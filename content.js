const debounce = (func, wait, immediate) => {
	var timeout
	return function() {
		var context = this, args = arguments
		var later = function() {
			timeout = null
			if (!immediate) func.apply(context, args)
		}
		var callNow = immediate && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) func.apply(context, args)
	}
}

const fillText = (item, text) => {
    const textArea = item.querySelector('.RomanistHere__textarea')
    textArea.value = text
}

const appendElements = (item, name) => {
    const wrapper = item.querySelector('.actor-name-with-distance')

    const icon = document.createElement("span")
    icon.classList.add('RomanistHere__icon')
    wrapper.appendChild(icon)

    const textArea = document.createElement("textarea")
    textArea.classList.add('RomanistHere__textarea')
    wrapper.appendChild(textArea)

    textArea.addEventListener('click', e => {
        e.stopPropagation()
        e.preventDefault()
    })

    textArea.addEventListener('blur', e => {
        const newText = e.target.value
        chrome.storage.sync.get(['data'], resp => {
            const { data } = resp
            const newData = { ...data, [name]: newText }
            chrome.storage.sync.set({ data: newData })
        })
    })

    item.classList.add('RomanistHere-filled')
}

const updInfo = () => {
    console.warn('updinfo')
    chrome.storage.sync.get(['data'], resp => {
        const { data } = resp
        const items = document.querySelectorAll('.search-result.search-result--person:not(.RomanistHere-filled)')

        items.forEach(item => {
            const name = item.querySelector('.name.actor-name').textContent

            appendElements(item, name)

            if (name in data) {
                fillText(item, data[name])
            }
        })
    })
}

updInfo()

const debUpdInfo = debounce(updInfo, 500)

const domObserver = new MutationObserver(mutations => {
    console.log('mutation')
    debUpdInfo()
})

domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
})
