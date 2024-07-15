"""
Print parts of Twilio call logs.
"""

import dotenv
import os
from twilio.rest import Client

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

calls = client.calls.list(limit=1000)

calls = (
    call for call in calls
    if call._from == "+15034681337") #"sip:monitor-one@direct-futel-stage.sip.twilio.com")

# events
# notifications
for record in calls:
    print(record.sid)
    print(record.start_time)
    #print(record.parent_call_sid)
    #print(record._from)
    print(record.duration)
    #print(record.direction)
    print(record.status)
    print()
