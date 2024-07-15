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
- proxy: SERVER
- use outbound proxy: no
- register: yes
- make call without reg: yes
- ans call without reg: yes
- display name: EXTENSION
- user ID: EXTENSION
- password: PASSWORD
- call waiting serv: no
- Dial plan for dialtone if emergency calls are enabled:
  - XXX need all 3 digit
  - (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)
- Dial plan for dialtone if emergency calls are not enabled:
  - XXX need all 3 digit
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
primary sip server: SERVER
nat traversal: keep-alive
sip user id: EXTENSION
authenticate id: EXTENSION
authenticate password: PASSWORD
sip registration: yes
unregister on reboot: no
outgoing call without registration: yes
Disable Call-Waiting: yes
Disable Call-Waiting Caller ID: yes
Disable Call-Waiting Tone: yes
Use # As Dial Key: no
Hook Flash Timing: minimum: 500 maximum: 500
For menu:
- Offhook Auto-Dial: #
- Offhook Auto-Dial Delay: 0
- Dial Plan: (empty)
For dialtone:
- Offhook Auto-Dial:
- Offhook Auto-Dial Delay:
- Dial Plan: (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)

Note that this has no dialplan, so dialtone clients will get the dialtone from our Twilio IVR. We could instead use the ATA's dialtone.

# Set up Polycom SoundPoint IP 501

- If needed, reset
  - with the phone UI, "reset local config", reboot, "reset device setting"
- Update the application and config
  - Set up and start a FTP server allowing anonymous read
  - Unpack SoundPoint_IP_SIP_3_2_7_release_sig_combined.zip where it will be served eg /srv/ftp
    - Create a writable /log directory if desired
  - Update local/ftp
    - copy exisiting config files to MAC.cfg and MAC-directory.xml
    - update MAC.cfg    
      - update first value of CONFIG_FILES to EXTENSION.cfg eg "demo.cfg, sip.cfg"
    - update EXTENSION.cfg eg demo.cfg
      - update all values of reg.*.auth.password to PASSWORD
  - Copy local/ftp over ftp serve directory eg /srv/ftp
  - Start the FTP server and serve ftp directory
  - Start phone, select setup, set up anonymous FTP with the server address, save, reboot, wait for update to complete
  - Stop the FTP server
  - Set up server settings on the phone UI to use HTTP sp.prov.phu73l.net, no user/pass

Notes
- MAC address is the ID found on the underside of the phone
- Phone admin password is 456, web user/password is Polycom/456
- https://blog.thelifeofkenneth.com/2011/05/how-to-configure-polycom-soundpoint-ip.html
- HTTP can be used instead of FTP
- SIP/Local Digitmap XXX S0<:#> S5<:#>
- The distro is not correct for all models/revs, we sometimes get errors about sip.ld during load, which ones?
- If we don't know the mac address, 000000000000 will work in filenames, but then any phone that reaches the FTP server will use that config!
- The phone HTTP server takes a while to spin up, not all settings can be entered in web UI
- Provisioning is only done over FTP for historical reasons, HTTP is easier to set up
- sp.prov.phu73l.net doesn't exist yet
- is this how to factory reset?
  - boot, wait for the welcome screen (start/setup/about)
  - hold 468* (or maybe 1357)
  - wait for password screen
  - enter mac address with caps

# Set up Polycom SoundStation or SoundStation IP 4000

Notes

- https://h30434.www3.hp.com/t5/Desk-and-IP-Conference-Phones/FAQ-How-can-I-setup-my-Phone-Provisioning-Download-Upgrade/td-p/8763442
- https://support.hp.com/us-en/poly
- https://h30434.www3.hp.com/t5/Desk-and-IP-Conference-Phones/FAQ-How-can-I-setup-my-Phone-Provisioning-Download-Upgrade/td-p/8763442?attachment-id=15182
- https://h30434.www3.hp.com/t5/Desk-and-IP-Conference-Phones/FAQ-What-is-the-relevance-of-the-000000000000-cfg-or-lt-mac/td-p/8765529
- https://h30434.www3.hp.com/t5/Desk-and-IP-Conference-Phones/FAQ-How-can-I-setup-my-Phone-Provisioning-Download-Upgrade/td-p/8763442
- https://h30434.www3.hp.com/t5/Desk-and-IP-Conference-Phones/FAQ-How-can-I-setup-my-Phone-Provisioning-Download-Upgrade/td-p/8763442?attachment-id=15182
- https://h30434.www3.hp.com/t5/Desk-and-IP-Conference-Phones/FAQ-How-can-I-setup-certain-Device-parameters-on-my-phone/td-p/8775566

- is this how to factory reset?
  - boot,
  - wait for "loading application" and hit cancel
  - wait for the welcome screen (start/setup/about)
  - hold 68* (or maybe 1357)
  - wait for password screen
  - enter mac address with caps

# Dial plan notes

    Dial if we match:
    911
    933
    XXX we need all 3 digit numbers
    1 followed by 2-9 followed by 9 digits (E.164 with US country code)
    2-9 followed by 9 digits (NANPA ie US E.164 without country code)
    0111 followed by 2-9 followed by 9 digits (NANPA international ie 01 then E.164 with US country code)
    #
    XXX we need *

Note that "[2-9]xxxxxxxxx" is allowing shorter sequences including 911 - the sequence length is apparently not enforced and a subsequence is accepted.

# Region notes

We use the umatilla edge when connecting to the Twilio Sip Domain.
https://www.twilio.com/docs/voice/api/sending-sip#localized-sip-uris