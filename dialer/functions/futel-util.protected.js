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
    let domainUri = /^[a-z]sip:((\+)?[0-9]+)@(.*)/;
    // dialer-6443-dev.twil.io
    let environment = context.DOMAIN_NAME;
    // dialer-6443-dev
    environment = environment.split('.')[0];
    // dev    
    environment = environment.split('-').pop();
    return environment;
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

exports.getEnvironment = getEnvironment;
exports.filterOutgoingNumber = filterOutgoingNumber;
exports.transformNumber = transformNumber;
