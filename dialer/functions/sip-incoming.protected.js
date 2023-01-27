// sip-incoming: handle calls originating from PSTN via a Twilio phone number

// Get the source and destination number from the event, normalize it, and dial the
// corresponding destination extension on our prod SIP domain.

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);
const snsClientPath = Runtime.getFunctions()['sns-client'].path;
const snsClient = require(snsClientPath);

const sipDomainSubdomainBase = "direct-futel";
const sipDomainSuffix = "sip.us1.twilio.com";

// Return the appropriate SIP domain hostname for our environment.
function getSipDomain(context) {
    return sipDomainSubdomainBase + '-' + futelUtil.getEnvironment(context) + '.' + sipDomainSuffix;
}

exports.handler = function(context, event, callback) {
    const client = context.getTwilioClient();    
    let twiml = new Twilio.twiml.VoiceResponse();
    const { From: fromNumber, To: toNumber, SipDomainSid: sipDomainSid } = event;
    let sipDomain = getSipDomain(context);

    console.log(`Original From Number: ${fromNumber}`);
    console.log(`Original To Number: ${toNumber}`);
    console.log(`SIP domain: ${sipDomain}`);    
    
    // Normalize to number to E.164, that is how our SIP extensions are formatted.
    const rawtoNumber = phoneUtil.parseAndKeepRawInput(toNumber, 'US');
    toE164Normalized = phoneUtil.format(rawtoNumber, PNF.E164);
    console.log(`E.164 To Number: ${toE164Normalized}`);

    twiml.dial({callerId: fromNumber, answerOnBridge: true}).sip(
        `sip:${toE164Normalized}@${sipDomain}`);

    let metricEvent = {Channel: toE164Normalized, UserEvent: "incoming-dial"};
    // We are publishing the event before handing off the twiml, which is nonoptimal.
    // What if there is a service issue or our twiml is not correct?
    // Ideally we would metric in response to a status callback or something.
    snsClient.publish(context, metricEvent).then(response => {
        callback(null, twiml);
    });

    // We are assuming that if we hit an error before the callback, it gets logged without us
    // giving it to the callback.
};   
