const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    let twiml = new Twilio.twiml.VoiceResponse();
    twiml.redirect('gather-action');

    // Create sync list for sid and redirect to the gather function.
    futelUtil.createList(event.CallSid).then(response => {
        // todo: hold until there are at least 2 sync lists.
        callback(null, twiml);
    }).catch((error) => {
        console.log(error);
        callback(error);
    });
};
