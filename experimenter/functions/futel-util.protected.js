// // Return a string corresponding to our environment eg 'dev', 'prod'
// function getEnvironment(context) {
//     return "stage";             // XXX testing
// }

const listTtl = 60 * 60 * 24          // one day

// Return a name suitable for a sync item.
function syncName(sid) {
    return 'list-' + sid;
}

// Return Promise to create a list for sid.
function createList(sid) {
    return Runtime.getSync().lists.create({uniqueName: syncName(sid), ttl: listTtl});
}    

// Return Promise to append item to the list for sid.
function updateList(sid, item) {
    // XXX ttl
    return Runtime.getSync().lists(syncName(sid)).syncListItems.create(
        stringToItem(item));
}    

function stringToItem(s) {
    // SyncListItems appear to require {data: {...}}
    return {data: {text:s}};
}

function itemToString(item) {
    return item.data.text;
}

// Return a Promise to delete the given list of synclist items.
function deleteItems(sid, items) {
    //console.log('xxx deleteItems');
    //console.log(items);
    return Promise.all(
        items.map(item =>
            Runtime.getSync().lists(syncName(sid)).syncListItems(
                item.index).remove()));
o}

// Return all items in list for sid in a Promise.
function getList(sid) {
    return Runtime.getSync().lists(syncName(sid)).syncListItems.list()
}

// Delete items in list for sid and return their values in a Promise.
function getClearList(sid) {
    return getList(sid).then(items =>
        deleteItems(sid, items).then(_results =>
            items.map(item => itemToString(item))));
}

exports.createList = createList;
exports.getClearList = getClearList;
exports.updateList = updateList;
