import os
from twilio.rest import Client

import dotenv
import os

dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

calls = client.calls.list(limit=100)

c = calls[0]
print(c.sid)
exit()
import pdb; pdb.set_trace()
for record in calls:
    print(record.sid)
