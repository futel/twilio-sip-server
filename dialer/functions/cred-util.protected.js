// // CredentialList utilities.

// // Return a list of all CredentialLists for the SIP domain sid.
// function enumerateCredentialLists(client, sipDomainSid) {
//     return client.sip.domains(sipDomainSid)
//         .auth
//         .registrations
//         .credentialListMappings
//         .list();
// }

// // Return a list of usernames from the given CredentialList.
// function getSIPCredentialListUsernames(client, credList) {
//     return client.sip.credentialLists(credList)
//         .credentials
//         .list();  
// }

// exports.enumerateCredentialLists = enumerateCredentialLists;
// exports.getSIPCredentialListUsernames = getSIPCredentialListUsernames;


//     // let mergedAggregatedE164CredentialUsernames = [];
//     // credUtil.enumerateCredentialLists(
//     //     client, sipDomainSid).then(credentialLists => {
//     //         Promise.all(credentialLists.map(credList => {
//     //             return credUtil.getSIPCredentialListUsernames(
//     //                 client, credList.sid);
//     //         })).then(results => {
//     //             results.forEach(credentials => {
//     //                 // Push all usernames which start with + into
//     //                 // mergedAggregatedE164CredentialUsernames.
//     //                 mergedAggregatedE164CredentialUsernames.push.apply(
//     //                     mergedAggregatedE164CredentialUsernames,
//     //                     credentials.filter(
//     //                         record => record["username"].startsWith('+'))
//     //                         .map(record => record.username));
//     //             });
//     //             if (mergedAggregatedE164CredentialUsernames.includes(
//     //                 toE164Normalized)) {
//     //                 // Our SIP Domain has a credential username which
//     //                 // matches our To address. Make a SIP URL for that
//     //                 // username and our SIP domain, and dial it.
//     //                 console.log('Dialing another E.164 SIP User');
//     //                 twiml.dial(
//     //                     {callerId: fromSipCallerId, answerOnBridge: true})
//     //                     .sip(`sip:${toE164Normalized}@${sipDomain}`);
//     //             } else {
//     //                 // We didn't match the To address, dial a PSTN number.
//     //                 console.log('Dialing a PSTN Number');
//     //                 twiml.dial(
//     //                     {callerId: fromSipCallerId, answerOnBridge: true},
//     //                     toE164Normalized);
//     //             }
//     //             callback(null, twiml);
//     //         }).catch(err => {
//     //             console.log(err);
//     //             callback(err);
//     //         });
//     //     });
