Polycom (R) SoundPoint(R) IP, SoundStation(R) IP and VVX (TM) Software Release SIP 3.2.5

This is a SIP software patch release applicable to currently shipped SoundPoint IP, SoundStation IP products deployed 
on SIP networks. 


WARNINGS:  
  1. VVX1500 products upgraded to SIP 3.2.5 WILL NOT BE ABLE TO DOWNGRADE TO SIP 3.1.3.

  2. The distribution files for the VVX1500 product contain both the BootROM and SIP software.
     There are inter-dependencies that require both to be upgraded at the same time.

  3. The SoundPoint IP 300, 301, 500, 600, 601 and SoundStation IP 4000 products are not supported in this release. 
     Customers with these products should refer to Technical Bulletin 35311 for instructions on how to configure the phones. 
     This Technical Bulletin is available from the Support site http://www.polycom.com/support/voice/soundpoint_ip/VoIP_Technical_Bulletins_pub.html

  4. This release requires BootROM 4.1.0 or newer to run on the SoundPoint IP 550, 560 and 650 products.


This Release supports the following products:
   SoundPoint IP 320, 330
   SoundPoint IP 321, 331
   SoundPoint IP 335
   SoundPoint IP 430
   SoundPoint IP 450
   SoundPoint IP 550
   SoundPoint IP 560
   SoundPoint IP 650
   SoundPoint IP 670
   SoundStation IP 5000
   SoundStation IP 6000
   SoundStation IP 7000
   VVX 1500


For build-id information, refer to the sip.ver file included in the release zip file.
For details on changes in this build, refer to the relevant Release Notes.

Recommended Upgrade Process:
  1. Unzip the contents of the release zip file.

  2. Place the sip.ld file into the appropriate location on the provisioning server.

  3. Update your configuration files to use the template files contained in the release zip file. In particular ensure 
     that you use the new sip.cfg file as there may be changes that are required for proper phone operation. Refer to the 
     documentation from your softswitch provider and/or follow the recommended practices in the reference documents 
     listed below.

  4. If you are using SoundPoint IP 300 or 500 devices deploy copies of the SIP 2.1.2 or 2.1.3 release and configuration 
     files named appropriately (See Technical Bulletin 35311 for details.

  5. Place the dictionary files into the appropriate location on the provisioning server.

  6. On the next phone reboot, the phones will automatically detect the new software and load it. In this case, the 
     reboot will take longer than usual.

  7. Confirm that the phone has loaded the correct software:
   a) If you have physical access to the phone, select Menu->Status->Platform->Application->Main and confirm 
      that the Version number matches that detailed in the Release Notes and in the sip.ver file.
   b) If the phones are being remotely upgraded, the version identifier may be verified by examining the phone 
      application log file.

Reference Documents - available from www.polycom.com/support/voip
  1. Release Notes: SoundPoint IP and SoundStation IP SIP Version 3.2.5
  2. Administrator’s Guide SoundPoint/SoundStation IP SIP 3.2
  3. White paper: Configuration File Management on SoundPoint IP Phones

Trademark Information
Polycom(R), SoundPoint(R), SoundStation(R), VVX(R) and the Polycom logo design are registered trademarks of Polycom, Inc. 
in the U.S. and various countries. All other trademarks are the property of their respective companies.
