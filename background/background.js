chrome.runtime.onInstalled.addListener(details => {
    if (details.reason == 'install') {
        chrome.storage.sync.get(['data'], resp => {
            // console.log(resp.data)
            if (!resp.data) {
                chrome.storage.sync.set({
                    data_1: {},
                    appState: {
                        currentChunk: 'data_1'
                    },
                    optionsState: {
                        infoClosed: false
                    }
                })
            }
        })
    } else if (details.reason == 'update') {
        chrome.storage.sync.clear()
        // chrome.storage.sync.get(['data'], resp => {
        //     console.log(resp.data)
        //     // if (resp.data) {
        //     //     syncStore('it', { ...resp.data}, () => console.log('success'))
        //     // }
        // })
        // chrome.storage.sync.getBytesInUse(['data'], resp => {
        //     console.log('data: ', resp)
        // })
        // chrome.storage.sync.getBytesInUse(null, resp => {
        //     console.log('all: ', resp)
        // })
        // chrome.storage.sync.get(null, resp => {
        //     console.log(resp)
        // })
    }
})

// handle open option page request from "expand"
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message == 'openOptPage') {
        const curOptionsUrl = chrome.extension.getURL('options/options.html')
        const optionsUrl = `${curOptionsUrl}?key=${encodeURI(request.key)}&name=${request.name}`
        chrome.tabs.query({ url: optionsUrl }, tabs => {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, { active: true })
            } else {
                chrome.tabs.create({ url: optionsUrl })
            }
        })
    }
})

function lengthInUtf8Bytes(str) {
    const m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
}

function syncStore(key, objectToStore, callback) {
    var jsonstr = JSON.stringify(objectToStore), i = 0, storageObj = {},
        maxBytesPerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM,
        maxValueBytes, index, segment, counter;

    console.log("jsonstr length is " + lengthInUtf8Bytes(jsonstr));

    while (jsonstr.length > 0) {
        index = key + "_" + i++;
        maxValueBytes = maxBytesPerItem - lengthInUtf8Bytes(index);

        counter = maxValueBytes;
        segment = jsonstr.substr(0, counter);
        while ((lengthInUtf8Bytes(JSON.stringify(segment)) + key.length) > maxValueBytes)
            segment = jsonstr.substr(0, --counter);

        storageObj[index] = segment;
        jsonstr = jsonstr.substr(counter);
    }

    storageObj[key] = i;
    console.log((i + 1) + " keys used (= key + key_i)");

    chrome.storage.sync.clear(function(){
        console.log(storageObj);
        console.log(chrome.storage.sync);
        chrome.storage.sync.set(storageObj, callback);
    });
}
