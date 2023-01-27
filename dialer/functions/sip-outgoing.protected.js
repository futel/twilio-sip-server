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

// area codes of expensive NANPA numbers
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

// Return phoneNumber string normalized to E.164.
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
    // If we are 10 digits, assume US number without country code and add it.
    if (e164NormalizedNumber.match(/^..........$/)) {
        e164NormalizedNumber = '1' + e164NormalizedNumber;
    }
    e164NormalizedNumber = '+' + e164NormalizedNumber;
    return e164NormalizedNumber;
}

// Return true if call to number should be denied.
function filterOutgoingNumber(number) {
    // Allow 911 and 911 test.
    if (number == "+911") {
        return false;
    } else if (number == "+933") {
        return false;
    }
    if (!number.startsWith("+1")) {
        // Not US or NANPA.
        // XXX we want Mexico also, 53, are there others?
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

    if (filterOutgoingNumber(e164ToNumber)) {
        console.log("filtered number " + e164ToNumber);
        twiml.reject();
        callback(null, twiml);
    } else {
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
    }
};
