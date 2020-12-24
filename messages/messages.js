const getMessTempl = (text) =>
    `<div class="RomanistHere__message">
        <div class="RomanistHere__message_links_wrap">
            <a href="#" class="RomanistHere__message_btn RomanistHere__message_paste">Pick</a>
            <a href="#" class="RomanistHere__message_btn RomanistHere__message_save">Save</a>
            <a href="#" class="RomanistHere__message_btn RomanistHere__message_remove">Delete</a>
        </div>
        <textarea class="RomanistHere__message_textarea">${text}</textarea>
    </div>`

const addLinkTempl = `<a href="#" class="RomanistHere__add_btn">Add</a>`

const getMessWrapTempl = () => {
    const div = document.createElement("DIV")
    div.classList.add('RomanistHere__mess_wrap')
    return div
}

const removeMess = () => {
    document.querySelector('.RomanistHere__mess_wrap').remove()
}

const showTempl = () => {
    const wrap = getMessWrapTempl()
    const messTempl = getMessTempl('Hello!')
    const messTempl2 = getMessTempl('My Friend!')
    wrap.innerHTML = messTempl + messTempl2

    document.body.appendChild(wrap)
}

const initMessTempl = () => {
    if (!window.location.href.includes('linkedin.com/messaging/thread')) {
        return
    }

    chrome.storage.local.get('messOn', resp => {
    	const { messOn } = resp

    	if (messOn == null || messOn === true) {
    		showTempl()
    		return
    	}
    })
}

initMessTempl()

// handle update from other sources
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	// from popup
	if (request.messagesShouldWork != null) {
		request.messagesShouldWork ? initMessTempl() : removeMess()
	}

	return true
})
