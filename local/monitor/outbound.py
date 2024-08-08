"""
Initiate calls to our dialplan for testing.
"""

# Could we use this to monitor registration? like traceroute, increase
# timeout until we get something informative when calling a SIP endpoint?

import dotenv
import os
import time
from twilio.rest import Client

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

#to = "sip:test-one@direct-futel-stage.sip.twilio.com"
#to = "sip:dome-office@direct-futel-prod.sip.twilio.com"
# A test number set up in our deployment. This is a stupid way to test because
# we have to pay for the number and the SIP leg.
# What we want is a SIP URL for a client that will answer and not hang up.
to = "+19713512383"
# Context to test.
context = "outgoing_detroit"
# URL to return twiml. This is what we are testing, the total length of the call
# over all requests. We could also send twiml to test specific content.
url = "https://prod.dialplans.phu73l.net/ivr?context={}".format(context)

call = client.calls.create(
    to=to,
    from_="+15034681337",       # Arbitrary.
    url=url)

print(call.sid)
# We could instead set up an event callback to find out when the call ends,
# maybe an ops url that also logs duration?
while True:
    call_out = client.calls(call.sid).fetch()
    print(call_out.status)
    if call_out.status not in ['queued', 'in-progress']:
        break
    time.sleep(5)
print(call_out.duration)
