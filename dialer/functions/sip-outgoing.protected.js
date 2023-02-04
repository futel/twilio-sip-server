// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial.

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

    if (filterOutgoingNumber(toNumber)) {
        console.log("filtered number " + toNumber);
        twiml.reject();
        callback(null, twiml); // Must not do anything after callback!
    } else {
        toNumber = transformNumber(toNumber);
        console.log(`Transformed to number: ${toNumber}`);
        twiml.dial(
            {callerId: fromNumber, answerOnBridge: true},
            toNumber);

        let metricEvent = {Channel: fromNumber, UserEvent: "filterdial"};
        // We are publishing the event before handing off the twiml, which is nonoptimal.
        // What if there is a service issue or our twiml is not correct?
        // Ideally we would metric in response to a status callback or something.
        snsClient.publish(context, metricEvent).then(response => {
            callback(null, twiml); // Must not do anything after callback!
        });
        // We are assuming that if we hit an error before the callback, it gets logged without us
        // giving it to the callback.
    }
};
