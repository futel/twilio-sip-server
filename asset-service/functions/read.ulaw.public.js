const fetch = require('node-fetch');

exports.handler = async (context, event, callback) => {
    console.log(event);
    const url = 'http://' + context.DOMAIN_NAME + '/' + event.lang + '/' + event.directory + '/' + event.name;
    console.log(url);
    
    h_response = await fetch(url);
    if (!h_response.ok) {
        throw new Error(`HTTP error: ${h_response.ok} ${h_response.status}`);
    }
    const blob = await h_response.blob();
    const buffer = await blob.arrayBuffer()
    //console.log(buffer.byteLength);

    const t_response = new Twilio.Response();
    t_response.setBody(buffer);
    t_response.appendHeader('Content-Type', 'audio/ulaw');
    t_response.appendHeader('Content-Length', buffer.byteLength);
    return callback(null, t_response);        
};
