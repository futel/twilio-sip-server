// Return a URL for the DigitalOcean function for name.
function getDoFunctionUrl(name, context) {
    return "https://" + context.DO_HOST + "/api/v1/web/" + context.DO_NAMESPACE + "/dialers/" + name
}

exports.getDoFunctionUrl = getDoFunctionUrl;

