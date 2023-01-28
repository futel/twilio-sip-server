# Setup for a Twilio SIP extension going directly to dialtone


# Objectives

Allow SIP clients to make PSTN calls without our VOIP server or VPN.


# Overview

- Incoming from PSTN => Twilio phone number => Twilio service => Twilio SIP domain => SIP client
- Outgoing from SIP client => Twilio service => PSTN

Twilio services used:
- Voice Sip Domains
- Phone Numbers
- Service
- Voice Credential Lists

We are assuming the default outgoing voice geographic permissions are good. Currently these are US/Canada, Puerto Rico, Mexico, Dominican Republic. There are more NANPA destinations but most of those are expensive.

# Deploy, promote, delete service

See README-deploy.

# Other things to do

## Test service

    npm test

# Logging, monitoring

- visit web page for direct-outgoing service, enable live logging, see console messages that arrive
- monitor tab
    - logs/calls
        - success outgoing calls from direct-outgoing service
        - success incoming calls to TwiML Bin (twilio got call)
        - fail incoming calls to SIP endpoing (unregistered)
    - logs/errors
        - fail incoming calls to SIP endpoing (unregistered)

# Notes

todo:
  - metric after call is placed, with a status callback handler or something

advantages
- general serverless advantages
- separate dialtone only clients from asterisk

drawbacks
- can't log client de/registration
- short delay before outgoing ring

- can we direct to asterisk for features eg pound for menu, operator?
- can we refer back if we do that?

Another option is to be less serverless. We can serve our own TwiML with the Twilio SDK in response to a POST from Twilio. This lets us e.g. publish our metrics in the way we are used to, use our server to decide how to react to messages, etc. We would need to run our own server. But if we can put side effects in Twilio callbacks instead of the handler, the server only needs to serve TwiML (and eventually assets) over HTTP. We would need to do our own environments eg dev stage prod.

https://www.twilio.com/blog/registering-sip-phone-twilio-inbound-outbound
