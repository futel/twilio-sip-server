# Setup for a Twilio SIP extension going directly to dialtone


# Objectives

Allow SIP clients to register to Twilio SIP Domains and make outgoing and incoming calls without our VOIP server or VPN. Incoming calls from a Twilio phone number ring the client. Outgoing calls go to PSTN, or get forwarded to our SIP server.


# Overview

- Incoming from PSTN => Twilio phone number => Twilio service => Twilio SIP domain => SIP client
- Outgoing from SIP client => Twilio service => PSTN

Twilio services used:
- Voice Sip Domains
- Phone Numbers
- Service
- Voice Credential Lists

We are assuming the default outgoing voice geographic permissions are good. Currently these are US/Canada, Puerto Rico, Mexico, Dominican Republic. There are more NANPA destinations but most of those are expensive.

# Deploy, promote, delete service, set up client

See README-deploy, README-client.

# Other things to do

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

advantages
- general serverless advantages
- separate dialtone only clients from asterisk

drawbacks
- can't log client de/registration?
- short delay before outgoing ring
