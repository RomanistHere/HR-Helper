const getMessTempl = (text) => {
    const div = document.createElement("DIV")
    div.classList.add('RomanistHere__message')

    const content = `<div class="RomanistHere__message_links_wrap">
                        <a href="#" class="RomanistHere__message_btn RomanistHere__message_paste">Pick</a>
                        <a href="#" class="RomanistHere__message_btn RomanistHere__message_save">Save</a>
                        <a href="#" class="RomanistHere__message_btn RomanistHere__message_remove">Delete</a>
                    </div>
                    <textarea class="RomanistHere__message_textarea">${text}</textarea>`

    div.innerHTML = content
    div.querySelector('.RomanistHere__message_paste').addEventListener('click', e => {
        e.preventDefault()
        const text = div.querySelector('.RomanistHere__message_textarea').value
        document.querySelector('.msg-form__contenteditable').textContent = text
        document.querySelector('.msg-form__send-button').disabled = false
        console.log(text)
    })

    return div
}

const getMessWrapTempl = () => {
    const addLinkTempl = `<a href="#" class="RomanistHere__show_btn">Show</a>`
    const div = document.createElement("DIV")

    div.classList.add('RomanistHere__mess_wrap')
    div.innerHTML = addLinkTempl

    div.querySelector('.RomanistHere__show_btn').addEventListener('click', e => {
        e.preventDefault()
        const link = e.currentTarget

        div.classList.toggle('RomanistHere__mess_wrap-active')
        link.textContent = link.innerHTML === 'Show' ? 'Hide' : 'Show'
    })

    return div
}

const removeMess = () => {
    document.querySelector('.RomanistHere__mess_wrap').remove()
}

const showTempl = () => {
    const wrap = getMessWrapTempl()
    const messTempl = getMessTempl('Hello!')
    const messTempl2 = getMessTempl('My Friend!')

    wrap.appendChild(messTempl)
    wrap.appendChild(messTempl2)

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
