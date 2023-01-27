// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// If the destination number matches one of our credentials, construct a SIP URI with our SIP domain
// and dial it.
// Otherwise, assume it is a PSTN number and dial it.

// TODO
// Validate NANPA.
// Transform 211 etc.
// Can we send SNS to our monitoring here? Alternative is Twilio console?

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const snsClientPath = Runtime.getFunctions()['sns-client'].path;
const snsClient = require(snsClientPath);

// Return phoneNumber string normalized to E.164.
function normalizeNumber(phoneNumber) {
    const rawNumber = phoneUtil.parseAndKeepRawInput(phoneNumber, 'US');
    e164NormalizedNumber = phoneUtil.format(rawNumber, PNF.E164);
    return e164NormalizedNumber;
}

exports.handler = function(context, event, callback) {
    const { From: fromNumber, To: toNumber, SipDomainSid: sipDomainSid } = event;
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    
    let regExNumericSipUri = /^sip:((\+)?[0-9]+)@(.*)/;
    // The caller ID is the SIP extension we are calling from, which we assume is E.164.
    let fromSipCallerId = fromNumber.match(regExNumericSipUri)[1];
    let normalizedToNumber = toNumber.match(regExNumericSipUri)[1];
    //let sipDomain =  toNumber.match(regExNumericSipUri)[3];
    let e164ToNumber = normalizeNumber(normalizedToNumber);

    console.log(`Original From Number: ${fromNumber}`);
    console.log(`Original To Number: ${toNumber}`);
    console.log(`Normalized To Number: ${normalizedToNumber}`);     
    console.log(`SIP CallerID: ${fromSipCallerId}`);
    console.log(`e164ToNumber: ${e164ToNumber}`);    

    twiml.dial(
        {callerId: fromSipCallerId, answerOnBridge: true},
        e164ToNumber);

    let metricEvent = {Channel: fromSipCallerId, UserEvent: "filterdial"};
    // We are publishing the event before handing off the twiml, which is nonoptimal.
    // What if there is a service issue or our twiml is not correct?
    // Ideally we would metric in response to a status callback or something.
    snsClient.publish(context, metricEvent).then(response => {
        callback(null, twiml);
    });

    // We are assuming that if we hit an error before the callback, it gets logged without us
    // giving it to the callback.
};
