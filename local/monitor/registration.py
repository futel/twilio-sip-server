"""
Use the twilio api to infer whether SIP clients are registered.

Usage:
    python3 registration.py
"""

import argparse
import datetime
import os
import sys

import dotenv
from twilio.rest import Client

import probe

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Extensions to report on, or empty to report on every extension in the
# credential list.
EXTENSIONS = (
    'ainsworth',
    'alleytwentyseventh',
    'brazee',
    'breckenridge',
    'central',
    'cesar-chavez',
    'clinton',
    'eighth',
    'fiftyeighth',
    'fortysecond',
    'killingsworth',
    'microcosm',
    'souwester',
    'street-roots-one')

# Hours of history events to check.
HISTORY_HOURS=24
# Credential list holding the extensions of our SIP clients.
DEFAULT_CREDENTIAL_LIST = "sip-direct"
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

    codes are the error codes of the alerts for this call, if we have them.
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

def report(call, extension, state_):
    """Print a line about what a call says about an extension."""
    if call:
        status = call.status
        t = call.start_time or call.date_created
    else:
        status = None
        t = None
    print("{} {} {} {}".format(
        extension,
        state_,
        status,
        t))
    sys.stdout.flush()

def history(client, extension, codes, since, args):
    """Report on the recent calls of a SIP client and return its state."""
    calls = client.calls.list(
        to=sip_uri(extension, args.stage), start_time_after=since)
    if not calls:
        return (None, None)
    for call in calls:
        # Get the codes which are relevant to this call.
        call_codes = codes.get(call.sid, [])
        # Get the state for this call from the call and the codes.
        state_ = state(call, call_codes)
        return (call, state_)

def error_codes(client, since):
    """Return a map of resource sid to the error codes of its alerts since
    since."""
    codes = {}
    for alert in client.monitor.v1.alerts.list(start_date=since):
        codes.setdefault(alert.resource_sid, []).append(str(alert.error_code))
    return codes

def main(argv=None):
    args = parse_args(argv)

    client = Client(
        os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])

    extensions = EXTENSIONS or credential_list_extensions(
        client, DEFAULT_CREDENTIAL_LIST)
    since = (datetime.datetime.now(datetime.timezone.utc)
             - datetime.timedelta(hours=HISTORY_HOURS))
    codes = error_codes(client, since=since)

    for extension in extensions:
        #probe.probe(client, extension, args)
        (call, state_) = history(client, extension, codes, since=since, args=args)
        if state_ in (UNREGISTERED, UNREACHABLE, UNKNOWN, None):
            report(call, extension, state_)

if __name__ == "__main__":
    sys.exit(main())
