// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial. Or send to Futel asterisk trunk.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

const futelExtension = "outgoing_portland"; // testing

// We should just use stage instead of dev on the twilio side.
const twilioToFutelInstance = {
    'dev': 'stage',
    'prod': 'prod',
};

exports.handler = function(context, event, callback) {
    const { From: eventFromNumber, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    let instance = twilioToFutelInstance[
        futelUtil.getEnvironment(context)];
    
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
    try {
        toNumber = futelUtil.normalizeNumber(toNumber);
    } catch (error) {
        // If we couldn't do a normalization step, hopefully we don't care
        // about any of the others.
    }
    console.log(`Normalized to number: ${toNumber}`);

    if (toNumber == "#") {
        // Send caller to the trunk.
        console.log(`trunk to number: ${toNumber}`);
        let password = context.FUTEL_SIP_PASSWORD
        let username = "704"; // XXX testing, get a dedicated ext
        // XXX how do we state destination
        let sipUri = `sip:${futelExtension}@futel-${instance}.phu73l.net;region=us2`;
        twiml.dial(
            {answerOnBridge: true, action: '/sip-outgoing-status'}).sip(
                {username:username, password: password},
                sipUri);
        callback(null, twiml); // Must not do anything after callback!
    } else if (futelUtil.filterOutgoingNumber(toNumber)) {
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
    }
};
