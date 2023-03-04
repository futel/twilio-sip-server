// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial. Or send to Futel asterisk trunk.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

const extensionMapAsset = Runtime.getAssets()['/extensions.json'];
const extensionMap = JSON.parse(extensionMapAsset.open());

exports.handler = function(context, event, callback) {
    const { From: extensionUri, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    let instance = futelUtil.getEnvironment(context);
    
    console.log(`Original from number: ${extensionUri}`);
    console.log(`Original to number: ${eventToNumber}`);
    // The caller ID is the SIP extension we are calling from, which we assume is E.164.
    let extension = futelUtil.sipToExtension(extensionUri);
    console.log(`Extension: ${extension}`);    
    let fromNumber = extensionMap[extension].callerId;
    console.log(`SIP CallerID: ${fromNumber}`);    
    let toNumber = futelUtil.sipToExtension(eventToNumber);
    if (!toNumber) {
        console.log("Could not parse appropriate to number.");
        twiml.say("We're sorry, your call cannot be completed as dialed. Please check the number and try again.");        
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
        let futelExtension = extensionMap[extension].outgoing;
        let sipUri = `sip:${futelExtension}@futel-${instance}.phu73l.net;region=us2`;
        twiml.dial(
            {answerOnBridge: true, action: '/sip-outgoing-status'}).sip(
                sipUri);
        callback(null, twiml); // Must not do anything after callback!
    } else if (futelUtil.filterOutgoingNumber(toNumber)) {
        console.log("filtered number " + toNumber);
        twiml.say("We're sorry, your call cannot be completed as dialed. Please check the number and try again.");
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
