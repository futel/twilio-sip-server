# Objectives

Allow SIP clients to register to Twilio SIP Domains and make outgoing and incoming calls. Incoming calls from a Twilio phone number ring the client. Outgoing calls go to PSTN, get forwarded to our SIP server, or get TwiML.

# Overview

- Incoming from PSTN => Phone Number => Application Resource  => SIP Domain => our SIP client
- Outgoing from our SIP client => SIP Domain, DigitalOcean Functions => PSTN, Asterisk

Note that we don't implement incoming from Asterisk, this is non-optimal.

Twilio components set up here are:
- Application Resources (TwiML apps)
  - for incoming calls to Twilio hosted phone numbers
- SIP domains
  - for some of our SIP clients to register to and make outgoing and incoming calls with Programmable Voice
- Credentials, Credential Lists, Credential List Mappings
  - for SIP clients to authenticate with SIP domains
- Services
  - for asset hosting

Other Twilio components, not set up here:
- Elastic SIP Trunks
  - for some of our SIP clients to register and make outgoing calls with Asterisk

Other components, not set up here:
- DigitalOcean functions
  - to serve TwiML to drive calls made through the SIP Domains
- Asterisk
  - to provide SIP extensions which are destinations for some outgoing and calls

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

- can't log client de/registration?
- first leg to Twilio rings, then we get the initial destination
