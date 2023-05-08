const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

// Return a string corresponding to our environment eg 'dev', 'prod'
function getEnvironment(context) {
    //let domainUri = /^[a-z]sip:((\+)?[0-9]+)@(.*)/;
    // dialer-6443-dev.twil.io
    let environment = context.DOMAIN_NAME;
    // dialer-6443-dev
    environment = environment.split('.')[0];
    // dev    
    environment = environment.split('-').pop();
    return environment;
}

// Return a URL for the DigitalOcean function for name.
function getDoFunctionUrl(name, context) {
    // XXX We only have one namespace, we should return the appropriate stage/prod/dev.
    return "https://" + context.DO_HOST + "/api/v1/web/" + context.DO_NAMESPACE + "/dialplans/" + name
}

// Return phoneNumber string normalized to E.164, if it can be.
// E.164 is +[country code][number].
function normalizeNumber(phoneNumber) {
    // This can't be the right way to do this, are there Twilio helpers?
    var number = phoneNumber;
    number = phoneUtil.parseAndKeepRawInput(number, 'US');
    number = phoneUtil.format(number, PNF.E164);
    // not really e.164 are we
    // Temporarily remove + if there.
    number = number.replace('+', '');
    // Remove international prefix if there.
    number = number.replace(/^011/, '');
    // If we are a 4 digit number starting with 1, presumably we are a
    // 3 digit number tha that normalizer added a 1 to, so remove it.
    if (number.match(/^1...$/)) {
        number = number.substring(1);
    }
    
    // If we are 10 digits, assume US number without country code and add it.
    if (number.match(/^..........$/)) {
        number = '1' + number;
    }
    number = '+' + number;
    return number;
}

// Return an extension extracted from sipUri, or null.
function sipToExtension(sipUri) {
    const regExSipUri = /^sip:((\+)?.*)@(.*)/;
    if (!sipUri.match(regExSipUri)) {
        console.log("Could not parse appropriate extension from SIP URI.");
        return null;
    }
    return decodeURIComponent(sipUri.match(regExSipUri)[1]);
}

// Return an extension for E.164 string.
function e164ToExtension(e164, extensionMap) {
    for (key in extensionMap) {
        if (extensionMap[key].callerId == e164) {
            return key;
        }
    }
    console.log("Could not find extension for E.164 number");
    return null;
}

exports.getDoFunctionUrl = getDoFunctionUrl;
exports.getEnvironment = getEnvironment;
exports.normalizeNumber = normalizeNumber;
exports.sipToExtension = sipToExtension;
exports.e164ToExtension = e164ToExtension;
