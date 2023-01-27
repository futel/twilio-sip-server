const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const futelUtilPath = Runtime.getFunctions()['futel-util'].path;
const futelUtil = require(futelUtilPath);

const metricHostBase = 'twilio-sip-server';

// Return the appropriate metric event hostname for our environment.
function getMetricHostname(context) {
    return metricHostBase + '-' + futelUtil.getEnvironment(context);
}

function eventToMessage(context, event) {
    let dateString = new Date().toISOString();
    // PJSIP is an implementation detail from Asterisk that the usage grapher might require?
    //let channelString = "PSJIP/" + event.Channel;
    event = {
        Event: 'UserEvent',
        Channel: event.Channel,
        UserEvent: event.UserEvent
    };
    message = {
        timestamp: dateString,
        hostname: getMetricHostname(context),
        event: event};
    return JSON.stringify(message);
}

// Return a config object populated from context.
function getConfig(context) {
    return {
        region: 'us-west-2',
        credentials: {
            accessKeyId: context.AWS_ACCESS_KEY_ID,
            secretAccessKey: context.AWS_SECRET_ACCESS_KEY}};
}

// Return a publish parameters object populated from context and message.
function getPublishParams(context, message) {
    return {
        Message: message,
        TopicArn: context.AWS_TOPIC_ARN
    };
}

// Return a Promise with the response from publishing the event to SNS.
function publish(context, event, topic_arn) {
    message = eventToMessage(context, event);
    // Probably inefficient to create a new client for each publish,
    // but we might not have any better options with a Twilio service.
    const client = new SNSClient(getConfig(context));
    const command = new PublishCommand(getPublishParams(context, message));
    return client.send(command);
}

exports.publish = publish;
