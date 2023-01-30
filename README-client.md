# Set up Linksys PAP ATA device for prod

- nat keep alive: enable
- sip address: (E.164 number)@direct-futel-prod.sip.twilio.com
- sip server address: <sip:direct-futel-prod.sip.twilio.com;transport=tls>
- password: (Twilio credentential list password)
- Dial plan: (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx)

For dev, this is direct-futel-prod.sip.twilio.com.

# Dial plan notes

    Dial if we match:
    911
    933
    1 followed by 2-9 followed by 9 digits (E.164 with US country code)
    2-9 followed by 9 digits (NANPA ie US E.164 without country code)
    0111 followed by 2-9 followed by 9 digits (NANPA international ie 01 then E.164 with US country code)
