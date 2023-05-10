// sip-incoming: handle calls originating from PSTN via a Twilio phone number

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    const client = context.getTwilioClient();
    let twiml = new Twilio.twiml.VoiceResponse();
    const { From: fromNumber, To: eventToNumber, SipDomainSid: sipDomainSid } = event;

    url = new URL(futelUtil.getDoFunctionUrl("dial_sip_e164", context));
    url.searchParams.append("to_number", eventToNumber);
    url.searchParams.append("from_number", fromNumber);
    twiml.redirect(url.href);
    callback(null, twiml);
};
