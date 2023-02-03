// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// If the destination number matches one of our credentials, construct a SIP URI with our SIP domain
// and dial it.
// Otherwise, assume it is a PSTN number and dial it.

// TODO
// Transform 211 etc.

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const snsClientPath = Runtime.getFunctions()['sns-client'].path;
const snsClient = require(snsClientPath);

// Allowed country codes.
const usaCode = '1';
const mexicoCode = '52';

// Area codes of expensive NANPA numbers.
const premiumNanpaCodes = [
    '900',
    '976',
    '242',
    '246',
    '264',
    '268',
    '284',
    '345',
    '441',
    '473',
    '649',
    '664',
    '721',
    '758',
    '767',
    '784',
    '809',
    '829',
    '849',
    '868',
    '869',
    '876']

// Map of phone numbers to transform.
const transformNumbers = {'+211': '+18666986155'}

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

// Return true if call to E.164 number should be denied.
function filterOutgoingNumber(number) {
    // Allow 911, 211, etc.
    if (number.match(/^\+...$/)) {
        return false;
    }
    if (!(number.startsWith("+" + usaCode) ||
          number.startsWith("+" + mexicoCode))) {
        // Not NANPA or Mexico. Note that Twilio might still reject
        // some NANPA, depending on settings.
        return true;
    }
    premiumNanpaCodes.forEach((prefix) => {
        if (number.startsWith("+1" + prefix)) {
            console.log("+1" + prefix);            
            return true;
        }
    });
    return false;
}

// Return transformed number, if we have one.
function transformNumber(phoneNumber) {
    if (phoneNumber in transformNumbers) {
        return transformNumbers[phoneNumber];
    }
    return phoneNumber;
}

exports.handler = function(context, event, callback) {
    const { From: fromNumber, To: toNumber, SipDomainSid: sipDomainSid } = event;
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    
    let regExNumericSipUri = /^sip:((\+)?[0-9]+)@(.*)/;
    // The caller ID is the SIP extension we are calling from, which we assume is E.164.
    console.log(`Original From Number: ${fromNumber}`);
    console.log(`Original To Number: ${toNumber}`);
    let fromSipCallerId = fromNumber.match(regExNumericSipUri)[1];
    console.log(`SIP CallerID: ${fromSipCallerId}`);    
    if (!toNumber.match(regExNumericSipUri)) {
        console.log("Could not find appropriate to number.");
        twiml.reject();
        callback(null, twiml);
        return;
    }
    let normalizedToNumber = toNumber.match(regExNumericSipUri)[1];
    console.log(`Normalized To Number: ${normalizedToNumber}`);
    //let sipDomain =  toNumber.match(regExNumericSipUri)[3];
    let e164ToNumber = normalizeNumber(normalizedToNumber);
    console.log(`e164ToNumber: ${e164ToNumber}`);

    if (filterOutgoingNumber(e164ToNumber)) {
        console.log("filtered number " + e164ToNumber);
        twiml.reject();
        callback(null, twiml);
    } else {
        let transformedToNumber = transformNumber(e164ToNumber);
        console.log(`transformedToNumber: ${transformedToNumber}`);
        twiml.dial(
            {callerId: fromSipCallerId, answerOnBridge: true},
            transformedToNumber);

        let metricEvent = {Channel: fromSipCallerId, UserEvent: "filterdial"};
        // We are publishing the event before handing off the twiml, which is nonoptimal.
        // What if there is a service issue or our twiml is not correct?
        // Ideally we would metric in response to a status callback or something.
        snsClient.publish(context, metricEvent).then(response => {
            callback(null, twiml);
        });
        // We are assuming that if we hit an error before the callback, it gets logged without us
        // giving it to the callback.
    }
};
