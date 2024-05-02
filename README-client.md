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
nat traversal: keep-alive
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
Hook Flash Timing: minimum: 500 maximum: 500
For menu:
- Offhook Auto-Dial: #
- Offhook Auto-Dial Delay: 0
- Dial Plan: <empty>
For dialtone:
- Offhook Auto-Dial:
- Offhook Auto-Dial Delay:
- Dial Plan: (911|933|1[2-9]xxxxxxxxx|0111[2-9]xxxxxxxxx|[2-9]xxxxxxxxx|*|#|0)

Note that this has no dialplan, so dialtone clients will get the dialtone from our Twilio IVR. We could instead use the ATA's dialtone.

# Set up Polycom SoundPoint IP 501

- If needed, factory reset somehow?
- Update the application and config
  - Set up and start a FTP server allowing anonymous read
  - Unpack SoundPoint_IP_SIP_3_2_7_release_sig_combined.zip where it will be served eg /srv/ftp
    - Create a writable /log directory if desired
  - Update local/ftp
    - update 000000000000.cfg
      - update first value of CONFIG_FILES to <extensions>.cfg eg "demo.cfg, sip.cfg"
    - update config for extension in <extensions>.cfg eg demo.cfg
      - update all values of reg.1.auth.password to <password>
  - Copy local/ftp over ftp serve directory eg /srv/ftp  
  - Start the FTP server and serve ftp directory
  - Start phone, select setup, set up anonymous FTP from IP of server, save, reboot, wait for update to complete
  - Stop the FTP server

Notes
- Phone admin password is 456, web user/password is Polycom/456
- If another phone can reach the FTP server while it is running, it may download and update with the served config! To avoid that, replace 000000000000.cfg etc with <mac>.cfg (readable on underside of phone)
- https://blog.thelifeofkenneth.com/2011/05/how-to-configure-polycom-soundpoint-ip.html
- SIP/Local Digitmap XXX S0<:#> S5<:#>
- The distro is not correct, we get errors about sip.ld during load

# Dial plan notes

    Dial if we match:
    911
    933
    1 followed by 2-9 followed by 9 digits (E.164 with US country code)
    2-9 followed by 9 digits (NANPA ie US E.164 without country code)
    0111 followed by 2-9 followed by 9 digits (NANPA international ie 01 then E.164 with US country code)
    #

Note that "[2-9]xxxxxxxxx" is allowing shorter sequences including 911 - the sequence length is apparently not enforced and a subsequence is accepted.
