const timerMsec = 2;

const initiatedStatus = 'initiated';
const failStatuses = ['no-answer', 'failed'];
const succeedStatuses = ['ringing', 'in-progress', 'answered', 'completed'];
const otherStatuses = ['queued', 'canceled'];

// Return a Promise to complete the call given by sid.
function completeCall(sid) {
    client.calls(sid).update({status: 'completed'})
        .then(call => console.log(call.to));
}

exports.handler = function(context, event, callback) {
    const client = context.getTwilioClient();    
    if (event.CallStatus == initiatedStatus) {
        console.log('initiated');
        // XXX why is any timout too long
        client.calls(event.CallSid).update({status: 'completed'})
            .then(call => callback(null, null));
        // setTimeout(() => {
        //     console.log("timer done")
        //     // Abort call. Hopefully the call was already completed or
        //     // is in the process of being aborted. We could track that
        //     // with Twilio Sync.
        //     client.calls(event.CallSid).update({status: 'completed'})
        //         .then(call => callback(null, null));
        // }, timerMsec);        
    } else if (failStatuses.includes(event.CallStatus)) {
        // We don't really care about the status. It's 'failed' if the
        // there is a problem, and 'no-answer' if it rang too long, which
        // it didn't.
        // Metric client absent here.
        callback(null, null);        
    } else if (succeedStatuses.includes(event.CallStatus)) {
        console.log(`succeed status ${event.CallStatus}`);
        // Abort call.
        // We could metric client present here.
        // This is a bad outcome, our timer was too long.
        // For answered or in-progress, we should instead cancel the timer and play something
        // nice for the poor human who picked up.
        client.calls(event.CallSid).update({status: 'completed'})
            .then(call => callback(null, null));
    }
};
