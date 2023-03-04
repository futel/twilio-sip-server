// sip-incoming: handle calls originating from PSTN via a Twilio phone number

// Get the source and destination number from the event, normalize it, and dial the
// corresponding destination extension on our prod SIP domain.

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

const extensionMapAsset = Runtime.getAssets()['/extensions.json'];
const extensionMap = JSON.parse(extensionMapAsset.open());

const sipDomainSubdomainBase = "direct-futel";
const sipDomainSuffix = "sip.us1.twilio.com";

// Return the appropriate SIP domain hostname for our environment.
function getSipDomain(context) {
    return sipDomainSubdomainBase + '-' + futelUtil.getEnvironment(context) + '.' + sipDomainSuffix;
}

exports.handler = function(context, event, callback) {
    const client = context.getTwilioClient();
    let twiml = new Twilio.twiml.VoiceResponse();
    const { From: fromNumber, To: eventToNumber, SipDomainSid: sipDomainSid } = event;
    let sipDomain = getSipDomain(context);

    console.log(`Original From Number: ${fromNumber}`);
    console.log(`Original To Number: ${eventToNumber}`);
    console.log(`SIP domain: ${sipDomain}`);    

    let toNumber = futelUtil.normalizeNumber(eventToNumber);
    let extension = futelUtil.e164ToExtension(toNumber, extensionMap);
    console.log(`Normalized to number: ${toNumber}`);
    console.log(`Extension: ${extension}`);    

    twiml.dial(
        {callerId: fromNumber,
         answerOnBridge: true,
         action: '/sip-outgoing-status'}).sip(
             `sip:${extension}@${sipDomain}`);
    callback(null, twiml); // Must not do anything after callback!
};
