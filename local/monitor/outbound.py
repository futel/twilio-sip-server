"""
Use the twilio api to call our extensions regularly.
"""

import dotenv
import os
import time
from twilio.rest import Client

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

# Build a SIP To address.
extension = "mother-foucaults"
to = 'sip:{}@direct-futel-prod.sip.twilio.com'.format(extension)

# Build URL to return twiml for what the callee will experience.
context = "outgoing_portland"
url = "https://prod.dialplans.phu73l.net/ivr?context={}".format(context)

call = client.calls.create(
    to=to,
    from_="+15034681337",
    url=url)

# If the first status we get is no-answer, there is no SIP extension connected
# at that SIP To address? If the first status we get is ringing, there is a SIP
# extension connected at that SIP address?
status = call.status

FINAL_STATUSES = ('completed', 'failed', 'busy', 'no-answer', 'canceled')
while status not in FINAL_STATUSES:
    time.sleep(2)
    status = client.calls(call.sid).fetch().status
    print(status)
