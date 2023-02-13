// Call a SIP number with a monitoring status callback.

require('dotenv').config()

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const statusCallbackUrl = 'https://monitor-3902-dev.twil.io/status';
const sipDomain = "direct-futel-dev.sip.twilio.com";

const toNumber = '+19713512383';
const fromNumber = '+19713512383';
const to = `sip:${toNumber}@${sipDomain}`;

client.calls
    .create({
        statusCallback: statusCallbackUrl,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        url: 'http://demo.twilio.com/docs/voice.xml',
        to: to,
        from: fromNumber
    })
    .then(call => console.log(call.sid));
