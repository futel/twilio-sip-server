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

# Deploy service

See README-deploy.

# Other things to do

## Test service

Run a local server to interact with.

    twilio serverless:start

also --inspect="", --ngrok

If we had tests, this would be how to run them.

## Delete a service

List services to find the sid, then delete it.

    twilio serverless list
    twilio api:serverless:v1:services:remove --sid <SID>

Then delete .twiliodeployinfo.

This deletes the entire service, not just an environment. To delete an environment:

    twilio api:serverless:v1:services:environments:remove --service-sid <SID> --sid <SID>


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
  - filter pstn phone number on the function
  - use the cli to remove a credential
  - use the cli to CRUD a phone number
  - metric after call is placed, with a status callback handler or something

advantages
- general serverless advantages
- separate dialtone only clients from asterisk

drawbacks
- can't log client de/registration
- short delay before outgoing ring
- deployment and update is manual through web gui
    - we could instead use the Twilio CLI, local console commands
    - there is also a local test server in the Serverless Toolkit

- can we get our metrics?
- can we direct to asterisk for features eg pound for menu, operator?
- can we refer back if we do that?

Another option is to be less serverless. We can serve our own TwiML with the Twilio SDK in response to a POST from Twilio. This lets us e.g. publish our metrics in the way we are used to, use our server to decide how to react to messages, etc.

https://www.twilio.com/blog/registering-sip-phone-twilio-inbound-outbound
