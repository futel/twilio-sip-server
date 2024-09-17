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

extension = "dome-office"
to = 'sip:{}@direct-futel-prod.sip.twilio.com'.format(extension)
# Context for callee to experience.
context = "outgoing_detroit"
# URL to return twiml for dialplan.
url = "https://prod.dialplans.phu73l.net/ivr?context={}".format(context)

call = client.calls.create(
    to=to,
    from_="+15034681337",
    url=url)
