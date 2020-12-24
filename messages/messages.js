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

const messTempl = (text) =>
    `<div class="RomanistHere__message_links_wrap">
        <a href="#" class="RomanistHere__message_btn RomanistHere__message_edit">Edit</a>
        <a href="#" class="RomanistHere__message_btn RomanistHere__message_save">Save</a>
        <a href="#" class="RomanistHere__message_btn RomanistHere__message_remove">Delete</a>
    </div>
    <textarea href="#" class="RomanistHere__message_textarea">${text}</textarea>
    <a href="#" class="RomanistHere__message_text_span">${text}</a>`

const addMechanics = (div, text, storedNote) => {
    const content = messTempl(text)
    div.innerHTML = content

    const textArea = div.querySelector('.RomanistHere__message_textarea')
    const textItem = div.querySelector('.RomanistHere__message_text_span')
    const deleteItem = div.querySelector('.RomanistHere__message_remove')

    textItem.addEventListener('click', e => {
        e.preventDefault()
    })

    div.querySelector('.RomanistHere__message_edit').addEventListener('click', e => {
        e.preventDefault()
        textArea.classList.add('RomanistHere__message_textarea-visible')
        textItem.classList.add('RomanistHere__message_text_span-hide')
    })

    div.querySelector('.RomanistHere__message_save').addEventListener('click', async (e) => {
        e.preventDefault()
        textArea.classList.remove('RomanistHere__message_textarea-visible')
        textItem.classList.remove('RomanistHere__message_text_span-hide')

        const newText = textArea.value
        addMechanics(div, newText, storedNote)
        const objToSave = { [storedNote]: newText }
        await setStorageDataLocal(objToSave)
    })

    deleteItem.addEventListener('click', e => {
        e.preventDefault()
        div.remove()
    })
}

const getMessTempl = async (storedNote) => {
    const resp = await getStorageDataLocal(storedNote)
    const text = resp[storedNote]
    const div = document.createElement("DIV")
    div.classList.add('RomanistHere__message')

    addMechanics(div, text, storedNote)

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

const showTempl = async () => {
    const wrap = getMessWrapTempl()

    const messTempl1 = await getMessTempl('note1')
    const messTempl2 = await getMessTempl('note2')
    const messTempl3 = await getMessTempl('note3')

    wrap.appendChild(messTempl1)
    wrap.appendChild(messTempl2)
    wrap.appendChild(messTempl3)

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
