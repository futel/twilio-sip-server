// Return a URL for the DigitalOcean function for name.
function getDoFunctionUrl(name, context) {
    // XXX We only have one namespace, we should return the appropriate stage/prod/dev.
    return "https://" + context.DO_HOST + "/api/v1/web/" + context.DO_NAMESPACE + "/dialplans/" + name
}

exports.getDoFunctionUrl = getDoFunctionUrl;

