Twilio has no API for a SIP Domain's registrations — the console's "registered SIP endpoints" tab is the only view, and the SDK's SIP tree only has credential lists, IP ACLs and auth mappings. So local/monitor has to infer the state from calls. I checked your account's real data and the three signatures are clean and distinguishable:

┌──────────────────────────────────┬───────────────────────────────┬──────────────────┬───────┐
│          what it means           │          call status          │    start→end     │ alert │
├──────────────────────────────────┼───────────────────────────────┼──────────────────┼───────┤
│ registered and reachable         │ no-answer (or completed/busy) │ 20–55s (it rang) │ none  │
├──────────────────────────────────┼───────────────────────────────┼──────────────────┼───────┤
│ registered, Twilio can't deliver │ failed                        │ ~8s              │ 32011 │
├──────────────────────────────────┼───────────────────────────────┼──────────────────┼───────┤
│ no registration at all           │ no-answer                     │ 0s               │ 32009 │
└──────────────────────────────────┴───────────────────────────────┴──────────────────┴───────┘

The duration field is useless here (always 0 for unanswered calls), so the ring time has to be computed from start_time/end_time. Note that an unregistered dial comes back as no-answer, not failed — I verified that with a probe to a nonexistent extension on the stage domain (status no-answer, 0s, alert 32009). That's the opposite of what outbound.py's comment guesses.

What I built

local/monitor/registration.py, with two modes:

- default (passive, no calls placed): reads recent calls per extension plus the debugger alerts and reports the state. This works for free because the dialplan-functions exerciser already calls every extension of interest every ~10 minutes.
- --probe: places the calls itself and cancels each one the instant it reaches ringing, so a client rings for about a second instead of the exerciser's 20.

Current fleet state (last 24h, run against prod)

13 registered, 10 unreachable, 4 unregistered, 33 no-data (credential-list entries the exerciser doesn't call).

The 10 unreachable ones are the interesting part — every single one has registered a non-routable contact address, so Twilio can place their outgoing calls but can never ring them:

ainsworth           sips:ainsworth@192.168.2.205:5060;transport=tls
alleytwentyseventh  sips:alleytwentyseventh@23.23.23.100:5060;transport=tls
brazee              sips:brazee@192.168.0.102:5060;transport=tls
central             sips:central@192.168.1.8:5060;transport=tls
clinton             sips:clinton@192.168.1.2:5060;transport=tls
fiftyeighth         sips:fiftyeighth@192.168.0.72:5060;transport=tls
killingsworth       sips:killingsworth@192.168.0.13:5060;transport=tls
microcosm           sips:microcosm@192.168.2.116:5060;transport=tls
souwester           sips:souwester@192.168.1.46:5060;transport=tls
street-roots-one    sips:street-roots-one@10.1.10.167:5060;transport=tls

Unregistered: alleymaple, dome-workshop, street-roots-two, test-one. Registered and ringing: breckenridge, cesar-chavez-one, dome-office, eighth, ghost-mountain, landline, mother-foucaults, princeton, saratoga, seattle-cafered, seattle-estelitas, seattle-fortysecond, taylor.

Two other things the alert log turned up while I was in there: https://prod.dialplans.phu73l.net/ops/call_status_exercise is returning 502 (58 × alert 15003 in 14 days), so the exerciser's status callbacks are being dropped — the connected/not-connected signal already exists and is going nowhere. And /dial_outgoing returned 502 296 times in the same period (alert 11200).

Caveats

- The probe's ringing branch is unverified against a live client — I didn't want to ring a payphone to test it. Say the word and I'll run --probe against an extension you pick (dome-office looks like the safe candidate).
- Twilio drops repeated identical alerts, so a call with no alert is classified from its ring time alone: an instant no-answer is reported as ll-founded) guess. Alerts are onlyretained 30 days; call records last 13 months.

Sources: SIP registration, error 32009, error 32011, error 32221
