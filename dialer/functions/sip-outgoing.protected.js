// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    const { From: eventFromNumber, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    
    console.log(`Original from number: ${eventFromNumber}`);
    console.log(`Original to number: ${eventToNumber}`);
    // The caller ID is the SIP extension we are calling from, which we assume is E.164.
    let fromNumber = futelUtil.sipToExtension(eventFromNumber);
    console.log(`SIP CallerID: ${fromNumber}`);    
    let toNumber = futelUtil.sipToExtension(eventToNumber);
    if (!toNumber) {
        console.log("Could not parse appropriate to number.");
        twiml.reject();
        callback(null, twiml);
        return;
    }        
    toNumber = futelUtil.normalizeNumber(toNumber);
    console.log(`Normalized to number: ${toNumber}`);

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
