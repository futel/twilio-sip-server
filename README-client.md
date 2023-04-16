Have server, extension, Twilio extension list password

Server is one of
- direct-futel-prod.sip.twilio.com
- direct-futel-nonemergency-prod.sip.twilio.com
- direct-futel-stage.sip.twilio.com
- direct-futel-nonemergency-stage.sip.twilio.com

# Set up Linksys PAP ATA device

- nat mapping enable: no
- nat keep alive: enable
- proxy: <server>
- use outbound proxy: no
- register: yes
- make call without reg: yes
- ans call without reg: yes
- display name: <extension>
- user ID: <extension>
- password: (Twilio credential list password)
- call waiting serv: no
- Dial plan if emergency calls are enabled:
  - (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)
- Dial plan if emergency calls are not enabled:
  - (1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)

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
authenticate password: (Twilio credential list password)
sip registration: yes
unregister on reboot: no
outgoing call without registration: yes
Disable Call-Waiting: yes
Disable Call-Waiting Caller ID: yes
Disable Call-Waiting Tone: yes
Offhook Auto-Dial:

# Dial plan notes

    Dial if we match:
    911
    933
    1 followed by 2-9 followed by 9 digits (E.164 with US country code)
    2-9 followed by 9 digits (NANPA ie US E.164 without country code)
    0111 followed by 2-9 followed by 9 digits (NANPA international ie 01 then E.164 with US country code)
    #

Note that "[2-9]xxxxxxxxx" is allowing shorter sequences including 911 - the sequece length is apparently not enforced and a subsequence is accepted.
