const getStorageDataLocal = key =>
	new Promise((resolve, reject) =>
		chrome.storage.local.get(key, result =>
			chrome.runtime.lastError
				? reject(Error(chrome.runtime.lastError.message))
				: resolve(result)
		)
	)

const setStorageDataLocal = data =>
	new Promise((resolve, reject) =>
		chrome.storage.local.set(data, () =>
			chrome.runtime.lastError
				? reject(Error(chrome.runtime.lastError.message))
				: resolve()
		)
	)

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason == 'install') {
        chrome.storage.sync.get(['it_1'], resp => {
            if (!resp.it_1) {
                chrome.storage.sync.set({
					it_1: ''
                })
            }
        })
    } else if (details.reason == 'update') {
        // chrome.storage.sync.clear()
		chrome.storage.sync.get(['it_1', 'it_2'], resp => {
            if (resp.it_1 && !resp.it_2 && Object.keys(resp.it_1).length === 0) {
                chrome.storage.sync.set({
                    it_1: ''
                })
            }
        })

		// chrome.storage.sync.get(null, resp =>{
		// 	console.log(resp)
		// })
		//
		// const items = await getStorageDataLocal(null)
		// console.log(items)

        await setStorageDataLocal({
            note1: 'Hi, welcome to quick answers!',
            note2: 'There are three (for now) editable notes. No need? Open the extension icon at top and disable it.',
            note3: 'To make use of it drag the note to the message field.',
			notesOn: true,
			messOn: true
        })
    }

	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		// With a new rule ...
		chrome.declarativeContent.onPageChanged.addRules([
			{
				// That fires when a page's URL contains a 'g' ...
				conditions: [
					new chrome.declarativeContent.PageStateMatcher({
						pageUrl: {
							hostEquals: 'www.linkedin.com'
						},
					})
				],
				// And shows the extension's page action.
				actions: [ new chrome.declarativeContent.ShowPageAction() ]
			}
		])
	})
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

    chrome.storage.sync.clear(function(){
        chrome.storage.sync.set(storageObj, callback);
    });
}
