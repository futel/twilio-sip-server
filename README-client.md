# Set up Linksys PAP ATA device for prod

- nat mapping enable: no
- nat keep alive: enable
- proxy if emergency calls are enabled:
  - direct-futel-prod.sip.twilio.com
- proxy if emergency calls are not enabled:  
  - direct-futel-nonemergency-prod.sip.twilio.com
- use outbound proxy: no
- register: yes
- make call without reg: yes
- ans call without reg: yes
- display name: <extension>
- user ID: <extension>
- password: (Twilio credential list password)
- call waiting serv: no
- Dial plan if emergency calls are enabled:
  - (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|#)
- Dial plan if emergency calls are not enabled:
  - (1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|#)

For stage, the server address is one of
  - direct-futel-stage.sip.twilio.com
  - direct-futel-nonemergency-stage.sip.twilio.com

# Dial plan notes

    Dial if we match:
    911
    933
    1 followed by 2-9 followed by 9 digits (E.164 with US country code)
    2-9 followed by 9 digits (NANPA ie US E.164 without country code)
    0111 followed by 2-9 followed by 9 digits (NANPA international ie 01 then E.164 with US country code)
    #

Note that "[2-9]xxxxxxxxx" is allowing shorter sequences including 911 - the sequece length is apparently not enforced and a subsequence is accepted.
