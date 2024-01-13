# SIP client setup

# Requirements

Ensure that TCP and UDP traffic is open to addresses in https://www.twilio.com/docs/sip-trunking/ip-addresses.

Have:
- extension (from Twilio Programmable Voice Credential List)
- password (from Twilio Programmable Voice Credential List)

Server is one of
- direct-futel-prod.sip.twilio.com
- direct-futel-nonemergency-prod.sip.twilio.com
- direct-futel-stage.sip.twilio.com
- direct-futel-nonemergency-stage.sip.twilio.com

If enable_emergency is False in dialplan-functions extensions dict, use the nonemergency server.

# Set up Linksys PAP, SPA-2102, etc. ATA device

- nat mapping enable: no
- nat keep alive: enable
- proxy: <server>
- use outbound proxy: no
- register: yes
- make call without reg: yes
- ans call without reg: yes
- display name: <extension>
- user ID: <extension>
- password: <password>
- call waiting serv: no
- Dial plan for dialtone if emergency calls are enabled:
  - (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)
- Dial plan for dialtone if emergency calls are not enabled:
  - (1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)
- Dial Plan for menu:
  S0<:#>

# Set up Grandstream HT701

basic settings
telnet server: no

advanced settings
admin password:
firmware server path: blank
config server path: blank
automatic upgrade: no
always skip the firmware check: selected

fxs port
account active: yes
primary sip server: <server>
nat traversal: no
sip user id: <extension>
authenticate id: <extension>
authenticate password: <password>
sip registration: yes
unregister on reboot: no
outgoing call without registration: yes
Disable Call-Waiting: yes
Disable Call-Waiting Caller ID: yes
Disable Call-Waiting Tone: yes
Use # As Dial Key: no
Offhook Auto-Dial: #
Offhook Auto-Dial Delay: 0
Dial Plan: <empty>
Hook Flash Timing: minimum: 500 maximum: 500

Note that this has no dialplan, so dialtone clients will get the dialtone from our Twilio IVR. We could instead use the ATA's dialtone.

# Dial plan notes

    Dial if we match:
    911
    933
    1 followed by 2-9 followed by 9 digits (E.164 with US country code)
    2-9 followed by 9 digits (NANPA ie US E.164 without country code)
    0111 followed by 2-9 followed by 9 digits (NANPA international ie 01 then E.164 with US country code)
    #

Note that "[2-9]xxxxxxxxx" is allowing shorter sequences including 911 - the sequece length is apparently not enforced and a subsequence is accepted.
