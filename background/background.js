chrome.runtime.onInstalled.addListener(details => {
    if (details.reason == 'install') {

    } else if (details.reason == 'update') {
        chrome.storage.sync.get(['data'], resp => {
            console.log(resp.data)
            // chrome.storage.sync.set({ 'data': {} })
        })
    }
})

// handle open option page request from "expand"
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message == 'openOptPage') {
        const curOptionsUrl = chrome.extension.getURL('options/options.html')
        const optionsUrl = `${curOptionsUrl}?${request.key}`
        chrome.tabs.query({ url: optionsUrl }, tabs => {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, { active: true })
            } else {
                chrome.tabs.create({ url: optionsUrl })
            }
        })
    }
})
