const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

exports.handler = function(context, event, callback) {
    let twiml = new Twilio.twiml.VoiceResponse();

    testSid = "foobar";

    //futelUtil.createList(testSid).then(response => {
    
    promise = futelUtil.updateList(testSid, "foo bar baz");
    promse = promise.then(_result => futelUtil.updateList(testSid, "a b c"));
    promise.then(_result => {
        futelUtil.getClearList(testSid).then(items => {            
            console.log('retrieved items ' + items);
            return callback(null, JSON.stringify(items));
        });
    }).catch((error) => {
        console.log(error);
        callback(error);
    });
}
