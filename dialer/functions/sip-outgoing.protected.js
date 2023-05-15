// sip-outgoing: termination for calls originating from a SIP client registered to a Twilio SIP domain.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    const { From: extensionUri, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    
    url = new URL(futelUtil.getDoFunctionUrl("dial_outgoing", context));
    url.searchParams.append("to_uri", eventToNumber);
    url.searchParams.append("from_uri", extensionUri);

    let twiml = new Twilio.twiml.VoiceResponse();    
    twiml.redirect(url.href);
    callback(null, twiml);
};
