// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial. Or send to Futel asterisk trunk.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

const extensionMapAsset = Runtime.getAssets()['/extensions.json'];
const extensionMap = JSON.parse(extensionMapAsset.open());

exports.handler = function(context, event, callback) {
    const { From: extensionUri, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    let twiml = new Twilio.twiml.VoiceResponse();
    
    console.log(`Original from number: ${extensionUri}`);
    console.log(`Original to number: ${eventToNumber}`);
    
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
        // XXX When does the normalizer break? If we couldn't do one normalization step,
        // hopefully we don't care about missing the others.
    }
    console.log(`Normalized to number: ${toNumber}`);
    if (["#", "0"].includes(toNumber)) {
        url = new URL(futelUtil.getDoFunctionUrl("dial_sip", context));
        url.searchParams.append("to_extension", toNumber);
        url.searchParams.append("from_uri", extensionUri);
        twiml.redirect(url.href);
        callback(null, twiml);
    } else {
        url = new URL(futelUtil.getDoFunctionUrl("dial_pstn", context));
        url.searchParams.append("to_uri", eventToNumber);
        url.searchParams.append("from_uri", extensionUri);
        twiml.redirect(url.href);
        callback(null, twiml);
    }
};
