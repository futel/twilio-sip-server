Currently, before the first interaction of every request (dialplan plays a sound and/or dialplan is waiting for a keypress), there is a delay. Describe what, why, where, how. Describe current and future solutions.

## How can we monitor the delay?

Actual Twilio logs

Web UI
- monitor:calls:[call]
- shows all requests/responses from Twilio with duration incl dialplan, assets

Can we download or monitor these?
- https://www.twilio.com/docs/voice/tutorials/how-to-retrieve-call-logs/python
- client.calls.list

Lambda logs
- Just to have the twiml serving time as a comparision
Cache hit/miss?
- What cache or edge are we expecting to be in use? How can we verify?\
- Actual cache logs
- S3 request logs
- eg we are doing N asset requests out of a max M, or N megs out of a max M
- monitor rate of download, either vs request/response or absolute, and run a test suite
Delay per request
- eg without any caching, an ivr iteration downloads the same things and plays the same duration each time, so monitor the rate of twiml requests

## How can we describe the delay?

What are the figures of interest? How can our future selves compare their current timmes with ours?

## What causes the delays?

- Dialplan function rendering etc time between request/response
    Sound file download (Twilio downloads every file between receiving TwiML and performing the document)

## What happens during the delays?

- Are keypresses accepted?

## What is the current delay?

- Per sound file, per meg, per stanza
- Cache hit/miss
- TwiML rendering and side effect time

## How can we reduce this delay? What is currently being done and what are futures?

- Smaller responses for fewer downloads per interaction
  - Instead of the entire IVR, intro/stanza/outro, with one menu iteration per stanza
- Larger sound files for fewer requests per interaction? eg entire stanza instead of each statement
- Cacheability
  - Twilio does the downloading, so we can only make it cacheable and measure cache hits/misses
- Regional in/out edges for both sound files and Twilio
  - currently uses umatilla (us2) edge when returning URLs to Twilio SIP Domains?
  - https://www.twilio.com/docs/voice/api/receiving-sip#sip-uri-edge
- Play a stream when we can (in TwiML), assemble and play sounds on the fly or pre-rendered while waiting for keypress
