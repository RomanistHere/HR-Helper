chrome.runtime.onInstalled.addListener(details => {
    if (details.reason == 'install') {
        chrome.storage.sync.set({
            data: {},
            bckp: {},
            optionsState: {
                infoClosed: false
            }
        })
    } else if (details.reason == 'update') {
        chrome.storage.sync.get(['data'], resp => {
            if (!resp.data) {
                chrome.storage.sync.set({
                    data: {},
                    optionsState: {
                        infoClosed: false
                    }
                })
            } else {
                chrome.storage.sync.set({
                    bckp: { ...resp.data },
                    optionsState: {
                        infoClosed: false
                    }
                })
            }
        })
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

// const saveChanges = () => {
//     chrome.storage.sync.get(['data', 'bckp'], resp => {
//         console.log(resp)
//         // chrome.storage.sync.set({ 'data': {} })
//     })
// }
