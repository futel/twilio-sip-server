// sip-incoming: handle calls originating from PSTN via a Twilio phone number

// Get the source and destination number from the event, normalize it, and dial the
// corresponding destination extension on our prod SIP domain.

// TODO
// Document requirements.
// Can we send SNS to our monitoring here? Alternative is Twilio console?

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

exports.handler = function(context, event, callback) {
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    const { From: fromNumber, To: toNumber, SipDomainSid: sipDomainSid } = event;
    // We send all calls to the prod SIP domain. This is questionable, but maybe it's OK since the
    // only component that we tweak between the SIP domain and the client is the credential list,
    // which shouldn't change and is very simple configuration-wise. But this does mean that we need a
    // real SIP client registered to the prod domain to test.
    // We could find our environment to find out whether we were prod or dev, then this would be
    // configured by the phone numbers, which are configured with which service environment to use
    // for an incoming call.
    let sipDomain = "direct-futel-prod.sip.us1.twilio.com";

    console.log(`Original From Number: ${fromNumber}`);
    console.log(`Original To Number: ${toNumber}`);
    console.log(`SIP domain: ${sipDomain}`);    
    
    // Normalize to number to E.164, that is how our SIP extensions are formatted.
    const rawtoNumber = phoneUtil.parseAndKeepRawInput(toNumber, 'US');
    toE164Normalized = phoneUtil.format(rawtoNumber, PNF.E164);
    console.log(`E.164 To Number: ${toE164Normalized}`);

    twiml.dial({callerId: fromNumber, answerOnBridge: true}).sip(
        `sip:${toE164Normalized}@${sipDomain}`);
    callback(null, twiml);

    // We are assuming that if we hit an error before the callback, it gets logged without us
    // giving it to the callback.
};   
