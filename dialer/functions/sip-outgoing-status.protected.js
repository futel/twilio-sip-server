// Handler for a Dial status callback.
// Publishes a metric to SNS.

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

const snsClientPath = Runtime.getFunctions()['sns-client'].path;
const snsClient = require(snsClientPath);

const extensionMapAsset = Runtime.getAssets()['/extensions.json'];
const extensionMap = JSON.parse(extensionMapAsset.open());

exports.handler = function(context, event, callback) {
    let extensionUri = event.From;
    let toNumber = event.To;
    let dialCallStatus = event.DialCallStatus
    let dialEvent = null;
    let dialStatusEventBase = null;
    console.log(`Original from number: ${extensionUri}`);
    let extension = futelUtil.sipToExtension(extensionUri);
    if (extension) {
        // Outgoing from Twilio SIP Domain, extensionUri is SIP URI to extension.
        endpoint = extension;
        dialEvent = "outgoing_call";
        dialStatusEventBase = "outgoing_dialstatus_";
    } else {
        // Incoming to Twilio phone number, extensionUri is E.164 of caller.
        endpoint = futelUtil.e164ToExtension(toNumber, extensionMap);
        dialEvent = "incoming_call";
        dialStatusEventBase = "incoming_dialstatus_";        
    }
    let dialStatusEvent = dialStatusEventBase + dialCallStatus + '_' + endpoint;
    console.log(`endpoint: ${endpoint}`);
    console.log(`dialEvent ${dialEvent}`);        
    console.log(`dialStatusEvent ${dialStatusEvent}`);

    let twiml = new Twilio.twiml.VoiceResponse();
    if (dialCallStatus == "failed") {
        twiml.say("We're sorry, your call cannot be completed as dialed. Please try again later.");
    } else {
        // If the first interation on handset pickup is a local menu, we want to return to that.
        // If the first interation is a SIP call to a remote menu, we want to SIP it again if that
        // call hung up due to a user hitting the back key from the top, otherwise we want to end.
        // If the first interation is a dialtone, we want to end.
        // twiml.say("The call has been completed. Repeat, the call has been completed");
    }
    
    snsClient.publish(context, {Channel: endpoint, UserEvent: dialEvent})
        .then(response =>
            snsClient.publish(
                context, {endpoint: endpoint, Channel: endpoint, UserEvent: dialStatusEvent}))
        .then(response => callback(null, twiml));
};
