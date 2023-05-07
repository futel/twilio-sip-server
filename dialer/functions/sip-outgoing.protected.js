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
    let fromNumber = extensionMap[extension].callerId;
    let enableEmergency = extensionMap[extension].enableEmergency;
    console.log(`Extension: ${extension}`);    
    console.log(`SIP CallerID: ${fromNumber}`);
    console.log(`enableEmergency: ${enableEmergency}`);    
    
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

    if (["#", "0"].includes(toNumber)) {
        // Send caller to the trunk.
        let futelExtension = null;
        if (toNumber == "#") {
            futelExtension = extensionMap[extension].outgoing;
        } else if (toNumber == "0") {
            futelExtension = "operator";
        }
        console.log(`trunk extension: ${futelExtension}`);
        let sipUri = `sip:${futelExtension}@futel-${instance}.phu73l.net;region=us2?x-callerid=${fromNumber}&x-enableemergency=${enableEmergency}`;
        twiml.dial(
            {answerOnBridge: true, action: '/sip-outgoing-status'}).sip(
                sipUri);
        callback(null, twiml);
    } else if (futelUtil.filterOutgoingNumber(toNumber)) {
        console.log("filtered number " + toNumber);
        twiml.say("We're sorry, your call cannot be completed as dialed. Please check the number and try again.");
        twiml.reject();
        callback(null, twiml);
    } else {
        toNumber = futelUtil.transformNumber(toNumber);
        console.log(`Transformed to number: ${toNumber}`);
        url = new URL(futelUtil.getDoFunctionUrl("dialer", context));
        url.searchParams.append("number", toNumber);
        url.searchParams.append("caller_id", fromNumber);
        twiml.redirect(url.href);
        callback(null, twiml);
    }
};
