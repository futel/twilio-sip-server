const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

// Allowed country codes.
const usaCode = '1';
const mexicoCode = '52';

// Area codes of expensive NANPA numbers.
const premiumNanpaCodes = [
    '900',
    '976',
    '242',
    '246',
    '264',
    '268',
    '284',
    '345',
    '441',
    '473',
    '649',
    '664',
    '721',
    '758',
    '767',
    '784',
    '809',
    '829',
    '849',
    '868',
    '869',
    '876']

// Map of phone numbers to transform.
const transformNumbers = {'+211': '+18666986155'}

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
    return "https://" + context.DO_HOST + "/api/v1/web/" + context.DO_NAMESPACE + "/dialplans/" + name
}

// Return true if call to E.164 number should be denied.
function filterOutgoingNumber(number) {
    // Allow 911, 211, etc.
    if (number.match(/^\+...$/)) {
        return false;
    }
    if (!(number.startsWith("+" + usaCode) ||
          number.startsWith("+" + mexicoCode))) {
        // Not NANPA or Mexico. Note that Twilio might still reject
        // some NANPA, depending on settings.
        return true;
    }
    premiumNanpaCodes.forEach((prefix) => {
        if (number.startsWith("+1" + prefix)) {
            console.log("+1" + prefix);            
            return true;
        }
    });
    return false;
}

// Return transformed number, if we have one.
function transformNumber(phoneNumber) {
    if (phoneNumber in transformNumbers) {
        return transformNumbers[phoneNumber];
    }
    return phoneNumber;
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
exports.filterOutgoingNumber = filterOutgoingNumber;
exports.transformNumber = transformNumber;
exports.normalizeNumber = normalizeNumber;
exports.sipToExtension = sipToExtension;
exports.e164ToExtension = e164ToExtension;
