

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
