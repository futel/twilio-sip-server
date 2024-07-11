# Deploying components for the Twilio SIP server.

# Meta-Requirements

The AWS components in the dialplan-functions project must be set up.

# Requirements

- Twilio CLI package 5.3.2 eg twilio-5.3.2.deb
- Twilio profile or other way to use creds

# Deploy and development notes

We will set up Twilio Programmable Voice components for the stage and prod servers. The stage and prod components are identical except for which AWS API Gateway URLs they reference. 

The initial deploy process is to create the stage components and at least one SIP credential and phone number, then point the relevant components to the AWS API Gateway instance. We add more SIP credentials and phone numbers as clients are added.

The stage and prod installations communicate with the corresponding Asterisk and AWS API Gateway instances. We update stage or prod by updating the AWS API Gateway URLs they point to. The Asterisk installations update their hostnames as they are created and promoted, so Twilio does not need to track that change.

For most of the Twilio API calls, a 400 response because the resource already exists is OK.

---

# Setup

To be done once.

## Create Application Resources (TwiML apps)

We create one Application Resource each for stage and prod.

Have the AWS API Gateway URLs for incoming calls for stage and prod as described in dialplan-functions README-deploy, e.g.

    https://stage.dialplans.phu73l.net/dial_sip_e164

Create Application Resources.

    twilio api:core:applications:create \
        --voice-method POST \
        --voice-url <STAGE_FUNCTION_URL> \
        --friendly-name "incoming-stage"
        
    twilio api:core:applications:create \
        --voice-method POST \
        --voice-url <PROD_FUNCTION_URL> \
        --friendly-name "incoming-prod"

Note that we are not setting "--public-application-connect-enabled false", because that is causing an error. This may allow other Twilio customers to call this method, which could cause side effects or reveal information about our AWS components or content.

## Create new stage and prod emergency and nonemergency SIP domains

We create SIP Domains for stage, stage-nonemergency, prod, and prod-nonemergency.

Have the AWS API Gateway URLs for outgoing calls for stage and prod as described in dialplan-functions README-deploy, e.g.

    https://stage.dialplans.phu73l.net/dial_outgoing
    https://stage.dialplans.phu73l.net/dial_sip_e164

Create the SIP Domains.

    twilio api:core:sip:domains:create --domain-name direct-futel-stage.sip.twilio.com --friendly-name direct-futel-stage --sip-registration --emergency-calling-enabled --voice-method POST --voice-url '<STAGE FUNCTION URL>'

    twilio api:core:sip:domains:create --domain-name direct-futel-nonemergency-stage.sip.twilio.com --friendly-name direct-futel-nonemergency-stage --sip-registration --voice-method POST --voice-url '<STAGE FUNCTION URL>'

    twilio api:core:sip:domains:create --domain-name direct-futel-prod.sip.twilio.com --friendly-name direct-futel-prod --sip-registration --emergency-calling-enabled --voice-method POST --voice-url '<PROD FUNCTION URL>'

    twilio api:core:sip:domains:create --domain-name direct-futel-nonemergency-prod.sip.twilio.com --friendly-name direct-futel-nonemergency-prod --sip-registration --voice-method POST --voice-url '<PROD FUNCTION URL>'

Note that if the SIP Domain already exists, this will fail instead of updating the domain. The SIP Domains should instead be updated as in "Update the SIP Domains".

## List the SIP Domains to get the created SID

If we created a new SIP Domain in the last step, the SID was listed there. Otherwise:

    twilio api:core:sip:domains:list

## Create the Credential List

    twilio api:core:sip:credential-lists:create --friendly-name sip-direct

## List the Credential Lists to get the created SID

If we created a new Credential List in the last step, the SID was listed there. Otherwise:

    twilio api:core:sip:credential-lists:list

## Create auth registrations Credential List Mappings

We create one mapping for each SIP Domain.

Use the SIDs of the SIP Domains and Credential List found in the previous steps.

    twilio api:core:sip:domains:auth:registrations:credential-list-mappings:create --domain-sid <STAGE EMERGENCY DOMAIN SID> --credential-list-sid <CREDENTIAL LIST SID>

    twilio api:core:sip:domains:auth:registrations:credential-list-mappings:create --domain-sid <STAGE NONEMERGENCY DOMAIN SID> --credential-list-sid <CREDENTIAL LIST SID>

    twilio api:core:sip:domains:auth:registrations:credential-list-mappings:create --domain-sid <PROD EMERGENCY DOMAIN SID> --credential-list-sid <CREDENTIAL LIST SID>

    twilio api:core:sip:domains:auth:registrations:credential-list-mappings:create --domain-sid <PROD NONEMERGENCY DOMAIN SID> --credential-list-sid <CREDENTIAL LIST SID>

## Set voice authentication credentials for SIP Domains

We create one mapping for each SIP Domain.

Visit the GUI for the SIP Domains and add the same "sip-direct" credential list to "voice authentication", then save.

There doesn't seem to be any other way to do this.

---

# Update for a new dialplan-functions installation

If the HTTPS interface of the dialplan-functions component changes, we must update the relevant stage or prod Application Resources and SIP Domains.

## Update the Application Resources (TwiML Apps)

Have the AWS API Gateway URLs for incoming calls for stage and prod as described in dialplan-functions README-deploy, e.g.

    https://stage.dialplans.phu73l.net/dial_sip_e164

To use a new stage installation, update the Request URL of the incoming-stage Application Resource.

To use a new prod installation, update the Request URL of the incoming-prod Application Resource (to point to the new prod), and the incoming-stage Application Resource (to no longer point to the new prod).

List the Application Resources to get the relevant SIDs.

    twilio api:core:applications:list --friendly-name incoming-stage

    twilio api:core:applications:list --friendly-name incoming-prod

Update the relevant Application Resources.

    twilio api:core:applications:update \
        --sid <sid> \
        --voice-url https://stage.dialplans.phu73l.net/dial_sip_e164

## Update the SIP Domains

Have the AWS API Gateway URLs for outgoing calls for stage and prod as described in dialplan-functions README-deploy, e.g.

    https://stage.dialplans.phu73l.net/dial_outgoing

To use a new stage installation, update the Voice URL of the direct-futel-stage and direct-futel-nonemergency-stage SIP Domains.

To use a new prod installation, update the Voice URL of the direct-futel-prod and direct-futel-nonemergency-prod SIP Domains (to point to the new prod), and direct-futel-stage direct-futel-nonemergency-stage SIP Domains (to no longer point to the new prod).

List the SIP Domains to get the SIDs.

    twilio api:core:sip:domains:list

Update the relevant SIP Domains.

    twilio api:core:sip:domains:update --sid <sid> --voice-method POST --voice-url '<FUNCTION_URL>'

---

# Add configuration for a new SIP client

To add a new SIP client, we create or re-use a Twilio phone number and create a credential in the Twilio Credential List. We don't need to create a phone number for a client which doesn't allow incoming calls or outgoing emergency calls, and we can change a phone number later.

## Requirements

Extension has been added to AWS Lambda as described in dialplan-functions README-client.

## Create a phone number

Use the web GUI; the APIs may allow us to do this, but maybe not.

Create new phone number
- friendly name: (client)
- emergency calling: (client address)
- voice configuration:
    - configure with: TwiML App
    - TwiML App: incoming-prod (or incoming-stage)
- messaging configuation:
    - a message comes in: webhook
    - URL: blank

## Create credential

List the Credential Lists to get the SID of "sip-direct".

    twilio api:core:sip:credential-lists:list

Create a new credential in the Credential List. Use the SID found in the previous step.

    twilio api:core:sip:credential-lists:credentials:create --credential-list-sid <SID> --username '<USERNAME>' --password '<PASSWORD>'

# Delete configuration for a SIP client

Delete the phone number and delete the credential from the Credential List.

## Delete phone number

Use the web GUI.

## Delete credential

Use the web gui.

# Notes

To check a client connection: in the web console, voice:SIP domains:direct-futel-[nonemergency-]prod.sip.twilio.com:":registered SIP endpoints. Search for the credential name. There isn't a way to do this programmatically.

todo:
  - use the cli to remove a credential
  - use the cli to CRUD a phone number
  - use the cli to add voice authentication to a sip domain?
  - needs a maintenance/verification process
    - sip-direct credential list is associated with the expected sip domains
  - The API lets us assign emergency calling addresses for numbers https://www.twilio.com/docs/voice/sip/api/emergency-calling-api

