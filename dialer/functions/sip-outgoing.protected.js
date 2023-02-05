// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial.

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

// Return phoneNumber string normalized to E.164, if it can be.
// E.164 is +[country code][number].
function normalizeNumber(phoneNumber) {
    // This can't be the right way to do this, are there Twilio helpers?
    const rawNumber = phoneUtil.parseAndKeepRawInput(phoneNumber, 'US');
    e164NormalizedNumber = phoneUtil.format(rawNumber, PNF.E164);
    // not really e.164 are we
    // Temporarily remove + if there.
    e164NormalizedNumber = e164NormalizedNumber.replace('+', '');
    // Remove international prefix if there.
    e164NormalizedNumber = e164NormalizedNumber.replace(/^011/, '');
    // If we are a 4 digit number starting with 1, presumably we are a
    // 3 digit number tha that normalizer added a 1 to, so remove it.
    if (e164NormalizedNumber.match(/^1...$/)) {
        e164NormalizedNumber = e164NormalizedNumber.substring(1);
    }
    
    // If we are 10 digits, assume US number without country code and add it.
    if (e164NormalizedNumber.match(/^..........$/)) {
        e164NormalizedNumber = '1' + e164NormalizedNumber;
    }
    e164NormalizedNumber = '+' + e164NormalizedNumber;
    return e164NormalizedNumber;
}

exports.handler = function(context, event, callback) {
    const { From: eventFromNumber, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    
    let regExSipUri = /^sip:((\+)?[0-9]+)@(.*)/;
    console.log(`Original from number: ${eventFromNumber}`);
    console.log(`Original to number: ${eventToNumber}`);
    // The caller ID is the SIP extension we are calling from, which we assume is E.164.
    let fromNumber = eventFromNumber.match(regExSipUri)[1];
    console.log(`SIP CallerID: ${fromNumber}`);    
    if (!eventToNumber.match(regExSipUri)) {
        console.log("Could not parse appropriate to number.");
        twiml.reject();
        callback(null, twiml);
        return;
    }
    let toNumber = eventToNumber.match(regExSipUri)[1];
    toNumber = normalizeNumber(toNumber);
    console.log(`Normalized to number: ${toNumber}`);
    //let sipDomain =  toNumber.match(regExSipUri)[3];

    if (futelUtil.filterOutgoingNumber(toNumber)) {
        console.log("filtered number " + toNumber);
        twiml.reject();
        callback(null, twiml); // Must not do anything after callback!
    } else {
        toNumber = futelUtil.transformNumber(toNumber);
        console.log(`Transformed to number: ${toNumber}`);
        // XXX default timeLimit is 4 hours, should be smaller, in seconds
        twiml.dial(
            {callerId: fromNumber,
             answerOnBridge: true,
             action: '/sip-outgoing-status'},
            toNumber);
        callback(null, twiml); // Must not do anything after callback!
        // We are assuming that if we hit an error before the callback, it gets logged without us
        // giving it to the callback.
    }
};
