Currently, before the first interaction of every request (dialplan plays a sound and/or dialplan is waiting for a keypress), there is a delay. Describe what, why, where, how. Describe current and future solutions.

## How can we monitor the delay?

### Twilio call logs

Web UI
- monitor:calls:[call]
- The "request inspector" shows all requests/responses from Twilio with duration, including the dialplan twiml request and each asset request. Some assets take 300ms, some take 3, presumably these are cache misses and hits.
- According to some rando on stackexchange, there isn't a programmatic way to get this?

Local scripts
- local/monitor/outbound.py
  - Initiate a call and play an IVR until iterations run out and we hang up.
  - This is useful to the extent that other calls can be filtered out by whatever reads the logs, probably using the From address and assets fetched.
- local/monitor/call_logs.py
  - List call durations.
  - We can't see the durations of the requests, which is what we want, but we can see the overall call duration.

Observations
- The cache seems fairly warm with frequent calls, maybe 80% cache hits?
- The lambda functions take a long time, about 500ms.

Notes
- Make 10 calls with outbound.py, then avg/total the durations with call_logs.py
- Needs a better test extension, context and automatic calling.
- But the download times are a fraction of the audio times? Make a test context that plays a 1 sec audio file 10 times to make this a little better?
- Maybe ongoing periodic calls for monitoring and cache warming? How much would this cost?
- Ongoing monitoring of durations?
  - Intro stanza of the initial contexts, "para espanol"
  - These are short and are probably not hung up on / skipped often, so we get the full duration?

### S3 request logs
- We log requests to the dialplan-assets-logs bucket.
- What useful information is in the logs?
  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/LogFormat.html
  - ,,time,,,,,,request-uri,http-status,,,total-time-ms,,,,,,,,,host-header,,  
  - The fact that a request was made, indicating a cache miss.
  - The total time from the server's perspective.
  - The host header, ie the HTTP host the requester used, including any region.

Notes
- Needs a better test extension, context, and automatic calling.
  - We could have a test context that references test assets. A test suite could hit the context a known number of times within a window. We can see the rate of cache hits with the number of requests.
- We can validate the host used by production (and all other) requests, and flag any ones not using the correct region.
- Ongoing monitoring of cache usage?
  - Intro stanza of the initial contexts, "para espanol"
  - Full cache usage, they are never downloaded. No cache usage, downloaded once for each initial context request.
  
### Cache hit/miss?
- What cache or edge are we expecting to be in use? How can we verify?
- Cloudfront?
- Actual cache logs

### Lambda logs
- Do we get any useful monitoring or logs? Response time?
- Add logs for monitoring? Start/end of each response? Other components of making the response?
- Ongoing periodic calls for monitoring and warming? How much would this cost?

## How can we describe the delay?

What are the figures of interest? How can our future selves compare their current timmes with ours?

## What causes the delays?

- Dialplan function rendering etc time between request/response
- Sound file download
  - Twilio downloads for every asset reference, including duplicates.
  - All downloads happen before the first audio is played.

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
- Is there sound format conversion?
  - codec? opus/g.729
