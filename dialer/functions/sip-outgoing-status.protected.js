// Handler for a Dial status callback.
// Publishes a metric to SNS.

const snsClientPath = Runtime.getFunctions()['sns-client'].path;
const snsClient = require(snsClientPath);

exports.handler = function(context, event, callback) {
    let fromNumber = event.From;
    let dialCallStatus = event.DialCallStatus
    let dialEvent = null;
    let dialStatusEventBase = null;
    let regExSipUri = /^sip:((\+)?[0-9]+)@(.*)/;
    console.log(`Original from number: ${fromNumber}`);
    // The caller ID is the SIP extension we are calling from, which we assume is E.164.
    if (fromNumber.match(regExSipUri)) {
        // outgoing from Twilio SIP Domain
        fromNumber = fromNumber.match(regExSipUri)[1];
        const dialEvent = "outgoing_call";
        const dialStatusEventBase = "outgoing_dialstatus_";
    } else {
        // incoming from Twilio phone number
        const dialEvent = "incoming_call";
        const dialStatusEventBase = "incoming_dialstatus_";        
    }
    console.log(`SIP CallerID: ${fromNumber}`);    
    console.log(`DialCallStatus ${dialCallStatus}`);

    let dialStatusEvent = dialStatusEventBase + dialCallStatus;
    snsClient.publish(
        context,
        {Channel: fromNumber,
         UserEvent: dialEvent}).then(response => {
             snsClient.publish(
                 context,
                 {Channel: fromNumber,
                  UserEvent: dialStatusEvent}).then(response => {
                      callback(null);
                  });
         });
};
