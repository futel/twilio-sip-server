"""
Use the twilio api to report whether SIP clients are registered.

Twilio has no API for the registrations of a SIP Domain. The console's
"registered SIP endpoints" tab of the domain is the only view of them, so we
call each client and infer the state of its registration from the call:

- A call to an address with no registration ends immediately as no-answer,
  with a 32009 alert.
- A call to a registration which Twilio can't deliver to ends after a few
  seconds as failed, with a 32011 alert.
- A call to a usable registration rings. We cancel it as soon as it does, so
  the client rings for about a second.

history() reports the same states from calls which have already happened,
which costs nothing and disturbs nobody, and works because the exerciser of
dialplan-functions calls the extensions of interest every few minutes. It is
commented out, along with the parts of this script which only served it.

Usage:
    python3 registration.py
"""

import argparse
import datetime
import os
import sys
import time

import dotenv
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Twilio number to probe from, must be a number on the account.
DEFAULT_FROM = "+15034681337"
# Extensions to report on, or empty to report on every extension in the
# credential list.
EXTENSIONS = ()
# Credential list holding the extensions of our SIP clients.
DEFAULT_CREDENTIAL_LIST = "sip-direct"
# What the client hears if a human answers a probe before we cancel it.
TWIML = '<Response><Say>Futel registration test.</Say><Hangup/></Response>'
# Statuses which mean the call is over.
FINAL_STATUSES = ('completed', 'failed', 'busy', 'no-answer', 'canceled')
# Statuses which mean the call reached the client.
RINGING_STATUSES = ('ringing', 'in-progress')
# Final statuses which mean the call got as far as the client.
REACHED_STATUSES = ('completed', 'busy', 'no-answer', 'canceled')
# Alert error codes about the registration of the address we dialed. The
# alerts give us the codes as strings.
# "not currently registered", ie there is no registration at all.
UNREGISTERED_ERROR_CODE = '32009'
# "error communicating with SIP destination", ie there is a registration, but
# Twilio can't deliver to the contact address in it. Our clients do this when
# they register a private address, eg sips:ext@192.168.0.13:5060.
UNREACHABLE_ERROR_CODE = '32011'
# Alerts to fetch when looking up the alerts of calls. Alerts are listed most
# recent first, and this is about a month of them.
ALERT_LIMIT = 1000
# A probed call's alerts are buffered, so we retry the lookup.
ALERT_TRIES = 5
ALERT_INTERVAL = 3

REGISTERED = 'registered'
UNREGISTERED = 'unregistered'
UNREACHABLE = 'unreachable'
UNKNOWN = 'unknown'
# NO_DATA = 'no-data'

ERROR_CODE_STATES = {
    UNREGISTERED_ERROR_CODE: UNREGISTERED,
    UNREACHABLE_ERROR_CODE: UNREACHABLE,
}
# States which mean the client can't be called.
BAD_STATES = (UNREGISTERED, UNREACHABLE)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--stage',
        default='prod',
        choices=('prod', 'stage'),
        help="Which SIP domain to look at, prod or stage.")
    parser.add_argument(
        '--timeout',
        type=int,
        default=15,
        help=(
            "Seconds to let a probed client ring before giving up. Only "
            "reached if canceling the call fails."))
    parser.add_argument(
        '--poll',
        type=float,
        default=0.5,
        help="Seconds between status fetches of a probed call.")
    parser.add_argument(
        '--no-cancel',
        action='store_true',
        help="Let a probed client ring until it answers or we time out.")
    return parser.parse_args(argv)


def sip_uri(extension, stage):
    """Return the SIP URI of a client extension on our SIP domain."""
    return 'sip:{}@direct-futel-{}.sip.twilio.com'.format(extension, stage)


def credential_list_extensions(client, friendly_name):
    """Return the usernames in the credential list, which are extensions."""
    for credential_list in client.sip.credential_lists.list():
        if credential_list.friendly_name == friendly_name:
            return sorted(
                credential.username
                for credential in client.sip.credential_lists(
                    credential_list.sid).credentials.list())
    raise SystemExit("no credential list named {}".format(friendly_name))


def registration_code(codes):
    """
    Return the first of the codes which is about registration, or None.

    A call can have alerts which have nothing to do with the registration of
    the address we dialed, eg 15003 for a status callback which didn't
    respond.
    """
    for code in codes:
        if code in ERROR_CODE_STATES:
            return code
    return None


def ring_seconds(call):
    """
    Return the seconds the call spent getting to the client, or None.

    Twilio gives us a duration of 0 for every call which wasn't answered, so
    we have to find the ring time ourselves. A call which never reached a
    registration spends no time at all.
    """
    if not (call.start_time and call.end_time):
        return None
    return (call.end_time - call.start_time).total_seconds()


def state(call, codes):
    """
    Return what a call says about the registration of the address it dialed.

    codes are the error codes of the alerts of the call, if we have them.
    """
    code = registration_code(codes)
    if code:
        return ERROR_CODE_STATES[code]
    seconds = ring_seconds(call)
    if seconds is None:
        # The call never started, so it says nothing about the registration.
        return UNKNOWN
    if seconds and call.status in REACHED_STATUSES:
        # The call spent time ringing the client, so it was registered.
        return REGISTERED
    if not seconds and call.status in REACHED_STATUSES:
        # The call ended the instant it was made, which is what dialing an
        # address with no registration looks like. We don't have the 32009
        # alert, either because we didn't look or because Twilio didn't keep
        # it, so this is a guess.
        return UNREGISTERED
    # The call failed, and we don't have an alert saying why.
    return UNKNOWN


def report(call, codes, extension, state_):
    """Print a line about what a call says about an extension."""
    seconds = ring_seconds(call)
    print("{} {} {} {} {} {}".format(
        extension,
        state_,
        call.status,
        '-' if seconds is None else int(seconds),
        registration_code(codes) or '-',
        call.start_time or call.date_created))
    sys.stdout.flush()


def call_codes(client, call_sid, since):
    """
    Return the error codes of the alerts of the call.

    Alerts are buffered, so we retry for a while before giving up.
    """
    for _ in range(ALERT_TRIES):
        codes = [
            str(alert.error_code)
            for alert in client.monitor.v1.alerts.list(
                start_date=since, limit=ALERT_LIMIT)
            if alert.resource_sid == call_sid]
        if codes:
            return codes
        time.sleep(ALERT_INTERVAL)
    return []


def probe(client, extension, args):
    """
    Call a SIP client, report on it and return its state.

    We cancel the call as soon as it rings, so the client rings for about a
    second, or not at all.
    """
    since = (datetime.datetime.now(datetime.timezone.utc)
             - datetime.timedelta(minutes=1))
    try:
        call = client.calls.create(
            to=sip_uri(extension, args.stage),
            from_=DEFAULT_FROM,
            timeout=args.timeout,
            twiml=TWIML)
    except TwilioRestException as exception:
        print("{} {} - - {} -".format(extension, UNKNOWN, exception.code))
        return UNKNOWN

    status = call.status
    while status not in FINAL_STATUSES:
        if status in RINGING_STATUSES and not args.no_cancel:
            # The call reached the client, so it is registered. Hang up
            # before a human has to.
            try:
                client.calls(call.sid).update(status='completed')
            except TwilioRestException:
                # The call ended on its own while we were canceling it.
                pass
            print("{} {} {} - - {}".format(
                extension, REGISTERED, status,
                datetime.datetime.now(datetime.timezone.utc)))
            sys.stdout.flush()
            return REGISTERED
        time.sleep(args.poll)
        status = client.calls(call.sid).fetch().status

    # The call ended without us seeing it ring, so ask Twilio what happened.
    call = client.calls(call.sid).fetch()
    codes = call_codes(client, call.sid, since)
    state_ = state(call, codes)
    report(call, codes, extension, state_)
    return state_


# def history(client, extension, codes, since, args):
#     """Report on the recent calls of a SIP client and return its state."""
#     calls = client.calls.list(
#         to=sip_uri(extension, args.stage),
#         start_time_after=since,
#         limit=args.calls)
#     if not calls:
#         print("{} {}".format(extension, NO_DATA))
#         sys.stdout.flush()
#         return NO_DATA
#     states = []
#     for call in calls:
#         call_codes = codes.get(call.sid, [])
#         states.append(state(call, call_codes))
#         report(call, call_codes, extension, states[-1])
#     return states[0]

# def error_codes(client, since):
#     """Return a map of resource sid to the error codes of all of its alerts."""
#     codes = {}
#     for alert in client.monitor.v1.alerts.list(
#             start_date=since, limit=ALERT_LIMIT):
#         codes.setdefault(alert.resource_sid, []).append(str(alert.error_code))
#     return codes

def main(argv=None):
    args = parse_args(argv)

    client = Client(
        os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])

    extensions = EXTENSIONS or credential_list_extensions(
        client, DEFAULT_CREDENTIAL_LIST)
    # since = (datetime.datetime.now(datetime.timezone.utc)
    #          - datetime.timedelta(hours=args.hours))
    # codes = error_codes(client, since)

    states = []
    for extension in extensions:
        states.append(probe(client, extension, args))
        # states.append(history(client, extension, codes, since, args))

    print(states)

if __name__ == "__main__":
    sys.exit(main())
