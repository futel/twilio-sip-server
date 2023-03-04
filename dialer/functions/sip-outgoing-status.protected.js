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
    
    snsClient.publish(context, {Channel: endpoint, UserEvent: dialEvent})
        .then(response =>
            snsClient.publish(
                context, {endpoint: endpoint, Channel: endpoint, UserEvent: dialStatusEvent}))
        .then(response => callback(null));
};
