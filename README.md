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


# Requirements

- Twilio CLI package 5.3.2 eg twilio-5.3.2.deb
- serverless toolkit plugin for twilio
    twilio plugins:install @twilio-labs/plugin-serverless
- Twilio profile or other way to use creds


# Deploy and development notes

We will set up a service with a dev environment, and other components for the dev and prod servers. For components other than the service, the dev and prod components are identical except for which other components they reference.

The initial deploy process is to create the dev components and at least one SIP credential, then promote the dev service to prod. We expect to add more SIP credentials as clients are added.

When we develop, we will redeploy the dev service with the serverless toolkit. We shouldn't have to redeploy or change any other components, but nothing gets promoted except the service. If we change anything other than the service, we will presumably be changing the dev components, then changing the prod components to match dev when we promote the dev service to prod.

For most of the Twilio API calls, a 400 response because the resource already exists is OK.

We are assuming the default outgoing voice geographic permissions are good. Currently these are US/Canada, Puerto Rico, Mexico, Dominican Republic. There are more NANPA destinations but most of those are expensive.

---

# Set up dev and prod server components

This process should only need to be done once. After this is done, the expected process is:

- Update the Twilio service, deploy to dev, then promote to prod
- Add a new SIP client by creating a phone number and credential, and updating the credential list

Those processes are outlined in later sections.

If changes are made to other components, some of the processes here will be repeated.

## Set up environment secrets

Fill .env to match .env.sample as described in README-aws.

## Deploy the service to the dev and prod environments

We need to deploy to either environment if they don't exist yet. If we are starting out, we need to create dev and prod. Normally, both environments will always exist from then on, but if for some reason we have destroyed either, we will need to recreate them. It is not an error to deploy to an existing enviroment, this is how we update dev during development, but we normally don't want to update prod except by promoting dev.

All serverless toolkit commands are executed in the dialer directory. Api commands can be executed in any directory.

Deploy to dev.

    twilio serverless:deploy

Deploy to prod.

    twilio serverless:deploy --environment=prod

## Get the outgoing SIP function URLs

List the services to find the domain_base.

    twilio serverless list services --output-format=json

The outgoing dev SIP function URL is https://<domain_base>-dev.twil.io/sip-outgoing.

The outgoing prod SIP function URL is https://<domain_base>-prod.twil.io/sip-outgoing.

## Create new dev and prod SIP domains

Use the domain found in the previous step to determine the outgoing SIP function URLs.

    twilio api:core:sip:domains:create --domain-name direct-futel-dev.sip.twilio.com --friendly-name direct-futel-dev --sip-registration --emergency-calling-enabled --voice-method GET --voice-url '<DEV FUNCTION URL>'

    twilio api:core:sip:domains:create --domain-name direct-futel-prod.sip.twilio.com --friendly-name direct-futel-prod --sip-registration --emergency-calling-enabled --voice-method GET --voice-url '<PROD FUNCTION URL>'

Use the SIP function URLs found in the previous step.

## List the SIP domains to get the created SID

If we created a new SIP domain in the last step, the SID was listed there. Otherwise:

    twilio api:core:sip:domains:list

## Create the credential list

    twilio api:core:sip:credential-lists:create --friendly-name sip-direct

## List the credential lists to get the created SID (unless it was visible in the last step)

    twilio api:core:sip:credential-lists:list

## Create an auth registrations credential list mapping for dev and prod SIP domains

Use the SIDs of the domains and credential list found in the previous steps.

    twilio api:core:sip:domains:auth:registrations:credential-list-mappings:create --domain-sid <DEV DOMAIN SID> --credential-list-sid <CREDENTIAL LIST SID>

    twilio api:core:sip:domains:auth:registrations:credential-list-mappings:create --domain-sid <PROD DOMAIN SID> --credential-list-sid <CREDENTIAL LIST SID>

## Set voice authentication credentials for dev and prod SIP domains

Visit the GUI for the dev and prod sip domains and add the same credential list to "voice authentication", then save.

There doesn't seem to be any other way to do this.


# Create a new dev deployment, or update an existing one

To do this, redeploy the dev service. Other components won't change (but see notes above).

    twilio serverless:deploy


# Promote the service dev deployment to the production environment

    twilio serverless:promote --source-environment=dev --environment=prod


---

# Add configuration for a new SIP client

We need at least one SIP client, of course. When we add a new one, the only existing component which we change is the credential list. We add a phone number and credential.

## Create a phone number

Use the web GUI; the APIs may allow us to do this, but maybe not.

Create new phone number
- friendly name: (client)
- emergency calling: (client address)
- voice and fax:
    - accept incoming: voice calls
    - configure with: Webhook, TwiML Bin, Function, Studio Flow, Proxy Service
    - a call comes in: Function
    - service: dialer
    - environment: prod-environment (or dev-environment)
    - function path: /sip-incoming

## Create credential

The username is the E.164 phone numbers of the SIP client.

List the credential lists to get the SID.

    twilio api:core:sip:credential-lists:list

Create a new credential in the credential list. Use the SID found in the previous step. For the username, use the E.164 phone number created earlier.

    twilio api:core:sip:credential-lists:credentials:create --credential-list-sid <SID> --username '<USERNAME>' --password <PASSWORD>


---

# Other things to do

## Remove credential

Use the web gui.

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
