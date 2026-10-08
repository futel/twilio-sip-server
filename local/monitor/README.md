# registration.py

Call clients to infer sip registration.

# Setup

## Set up environment secrets

Fill .env to match .env.sample.

## Create deployment virtualenv

- python3 -m venv venv
- source venv/bin/activate
- pip install -r requirements.txt

# Run

- source venv/bin/activate
- python3 registration.py

# Notes

registration.py calls each SIP client and infers the state of its
registration from the call:

- A call to an address with no registration ends immediately as no-answer,
  with a 32009 alert.
- A call to a registration which Twilio can't deliver to ends after a few
  seconds as failed, with a 32011 alert.
- A call to a usable registration rings. The call is canceled as soon as it
  does, so the client rings for about a second.

Extensions are taken from the EXTENSIONS constant of the script, or, if it is
empty, from the credential list, which is every client we have ever
configured rather than the ones we expect to be registered now. Every one of
them is called, so set EXTENSIONS before running this where a ringing phone
would disturb somebody.

A line is printed per call, of extension, state, call status, seconds spent
ringing, registration alert error code and time. The states are:

- registered: the call rang the client.
- unreachable: 32011, there is a registration, but Twilio can't deliver to
  the contact address in it. Our clients do this when they register a private
  address, eg sips:ext@192.168.0.13:5060, so the client can make calls but
  can't be called.
- unregistered: 32009, or a call which ended the instant it was made, which
  is what dialing an address with no registration looks like.
- unknown: a call which failed with no alert explaining it, eg because it was
  dialed through an edge the client isn't registered through (32221).

Options:
- --stage: prod (default) or stage, selects the SIP domain. Clients register
  to prod, so stage reports them all unregistered.
- --timeout: seconds to let a client ring, only reached if canceling the call
  fails, default 15.
- --poll: seconds between call status fetches, default 0.5.
- --no-cancel: let a client ring until it answers or we time out.

The history() function of the script reports the same states from calls which
have already happened, without placing any, which costs nothing and disturbs
nobody, and works because the exerciser of dialplan-functions calls the
extensions of interest every few minutes. It is commented out, along with the
--hours and --calls arguments and the error_codes() function, which only
served it.
