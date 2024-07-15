"""
Initiate calls to our dialplan for testing.
"""

import dotenv
import os
from twilio.rest import Client

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

# Using an incoming line pointing to Twilio is a stupid way to do this, and we
# are surely paying for 2-3 legs instead of one. We want a recipient that will
# just listen and not hang up before we do.
# XXX Using the incoming line probably distorts the total call time and possibly
# the cache activation also.
# Could we use this to monitor registration? like traceroute, increase
# timeout until we get something informative when calling a SIP endpoint?
call = client.calls.create(
    #to="sip:monitor-one@direct-futel-stage.sip.twilio.com",
    to="+15034681337",
    from_="+15034681337",
    url="https://stage.dialplans.phu73l.net/ivr?context=directories_detroit")

print(call.sid)
