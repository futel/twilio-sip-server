// Return a string corresponding to our environment eg 'dev', 'prod'
function getEnvironment(context) {
    let domainUri = /^[a-z]sip:((\+)?[0-9]+)@(.*)/;
    // dialer-6443-dev.twil.io
    let environment = context.DOMAIN_NAME;
    // dialer-6443-dev
    environment = environment.split('.')[0];
    // dev    
    environment = environment.split('-').pop();
    return environment;
}

exports.getEnvironment = getEnvironment;
