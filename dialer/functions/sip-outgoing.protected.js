// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.
// Parse the destination number from the SIP URI.
// Transform to a PSTN number, validate, filter, dial. Or send to Futel asterisk trunk.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    const { From: extensionUri, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    let twiml = new Twilio.twiml.VoiceResponse();
    
    if (["#", "0"].includes(toNumber)) {
        url = new URL(futelUtil.getDoFunctionUrl("dial_sip", context));
    } else {
        url = new URL(futelUtil.getDoFunctionUrl("dial_pstn", context));
    }
    url.searchParams.append("to_uri", eventToNumber);
    url.searchParams.append("from_uri", extensionUri);
    twiml.redirect(url.href);
    callback(null, twiml);
};
