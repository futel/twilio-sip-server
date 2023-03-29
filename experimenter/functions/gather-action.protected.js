const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    let twiml = new Twilio.twiml.VoiceResponse();
    //console.log(event.CallSid);

    // If we have input from the last call, add it to the storage.
    if (event.SpeechResult) {
        console.log('SpeechResult ' + event.SpeechResult);
        // console.log(event.Confidence);
        // XXX testing, should add to all other lists instead
        promise = futelUtil.updateList(event.CallSid, event.SpeechResult);
    } else {
        promise = Promise.resolve(null);
    }

    var items = [];
    promise.then(_result =>
        // Delete the relevant storage items and output their values.
        futelUtil.getClearList(event.CallSid).then(getItems => {
            console.log('retrieved items ' + util.inspect(getItems));
            if (!getItems.length) {
                getItems = ["hello?"];
                console.log('fake items ' + getItems);                
            }
            console.log('retrieved items ' + getItems);            
            items = items.concat(getItems);
        })).then(_result => {
            // XXX are there no other lists? go back to sip-outgoing
            console.log("gathering");
            const gather = twiml.gather({
                input: 'speech',
                profanityFilter: false,
                speechModel: "experimental_utterances",
                // speechModel: "phone_call", // $0.02/ea, no auto timeout
                // enhanced: true, // $0.03/ea, phone_call only
                speechTimeout: 'auto',
                // speechTimeout: 5,
                action: '/gather-action'
            });
            items.forEach(item => gather.say(item));
            // If we get here, gather didn't collect any input.
            twiml.redirect('gather-action');    
            callback(null, twiml);
        }).catch((error) => {
            console.log(error);
            callback(error);
        });
}
