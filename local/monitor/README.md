# Requirements

- openssl
- ffmpeg

# Setup

To be done once.
## Create test Application Resource (TwiML app)

Create an Application Resource for testing.

    twilio api:core:applications:create \
        --voice-method POST \
        --voice-url "https://twimlets.com/holdmusic?Bucket=com.twilio.music.classical" \
        --friendly-name "test"

Notes:
- This is used by local/monitor.
- This is nonoptimal, what we really want is a SIP client that won't hang up or interact with our dialplans.

## Create test phone number

Use the web GUI; the APIs may allow us to do this, but maybe not.

Create new phone number
- friendly name: test
- emergency calling: not registered
- voice configuration:
    - configure with: TwiML App
    - TwiML App: test
- messaging configuation:
    - a message comes in: webhook
    - URL: blank

Notes:
- This is used by local/monitor.
- This is nonoptimal, what we really want is a SIP client that won't hang up or interact with our dialplans.

Note that this is nonoptimal, what we really want is a SIP client that won't hang up or interact with our dialplan.

## Set up environment secrets

Fill .env to match .env.sample.

## Create deployment virtualenv

- python3 -m venv venv
- source venv/bin/activate
- pip install -r requirements.txt

# Run

- source venv/bin/activate
- python3 outbound.py

# Notes

Would be better to have a SIP client to accept a call and do nothing until caller hangs up.

- https://github.com/AGProjects/python3-sipsimple
- https://github.com/sippy/b2bua?tab=readme-ov-file
