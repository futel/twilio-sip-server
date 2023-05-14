// Return a URL for the DigitalOcean function for name.
function getDoFunctionUrl(name, context) {
    // XXX We only have one namespace, we should return the appropriate stage/prod/dev.
    return "https://" + context.DO_HOST + "/api/v1/web/" + context.DO_NAMESPACE + "/dialplans/" + name
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

exports.getDoFunctionUrl = getDoFunctionUrl;
exports.sipToExtension = sipToExtension;

