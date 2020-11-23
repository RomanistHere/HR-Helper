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

const getTextArea = (url) => `
    <form action="#" class="RomanistHere__form">
        <a href="#" class="RomanistHere__link RomanistHere__link_close">X</a>
        <textarea class="RomanistHere__textarea"></textarea>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link-left RomanistHere__link_expand">Expand</a>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link_mark">Mark</a>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link-dis RomanistHere__btn">Save</a>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link_remove RomanistHere__link-right RomanistHere__link-dis">Clear</a>
    </form>
`
const switchModeToFill = item => {
    const remove = item.querySelector('.RomanistHere__link_remove')
    const save = item.querySelector('.RomanistHere__btn')
    const mark = item.querySelector('.RomanistHere__link_mark')

    remove.classList.remove('RomanistHere__link-dis')
    save.classList.remove('RomanistHere__link-dis')
    mark.classList.add('RomanistHere__link-dis')
}

const fillText = (item, text) => {
    const textArea = item.querySelector('.RomanistHere__textarea')

    textArea.value = text
    item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-filled')
    switchModeToFill(item)
}

const fixArea = (e, formWrap) => {
    e.stopPropagation()
    e.preventDefault()

    formWrap.classList.add('RomanistHere__wrap-show')
}

const closeForm = (e, item, formWrap, shouldmark = false) => {
    e.preventDefault()

    setTimeout(() => {
        if (shouldmark) item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-filled')
        formWrap.classList.remove('RomanistHere__wrap-show')
    }, 50)
}

const removeItem = (e, url, textArea, formWrap, item) => {
    textArea.value = ''
    item.querySelector('.RomanistHere__icon').classList.remove('RomanistHere__icon-filled')

    chrome.storage.sync.get(['data'], resp => {
        let { data } = resp
        delete data[url]
        chrome.storage.sync.set({ data: data })
    })

    closeForm(e, item, formWrap, false)
}

const saveChanges = (e, url, textArea, formWrap, item) => {
    const newText = textArea.value

    chrome.storage.sync.get(['data'], resp => {
        const { data } = resp
        const newData = { ...data, [url]: newText }
        chrome.storage.sync.set({ data: newData })
    })

    closeForm(e, item, formWrap, true)
}

const appendElements = (item, url) => {
    const wrapper = item.querySelector('.actor-name-with-distance')

    const icon = document.createElement("span")
    icon.classList.add('RomanistHere__icon')
    wrapper.appendChild(icon)

    const formWrap = document.createElement("div")
    formWrap.classList.add('RomanistHere__wrap')
    const formText = getTextArea(url)
    formWrap.innerHTML = formText
    wrapper.appendChild(formWrap)

    const btn = item.querySelector('.RomanistHere__btn')
    const close = item.querySelector('.RomanistHere__link_close')
    const expand = item.querySelector('.RomanistHere__link_expand')
    const mark = item.querySelector('.RomanistHere__link_mark')
    const remove = item.querySelector('.RomanistHere__link_remove')

    const textArea = item.querySelector('.RomanistHere__textarea')

    icon.addEventListener('click', e => fixArea(e, formWrap))
    formWrap.addEventListener('click', e => fixArea(e, formWrap))

    btn.addEventListener('click', e => saveChanges(e, url, textArea, formWrap, item))
    remove.addEventListener('click', e => removeItem(e, url, textArea, formWrap, item))
    close.addEventListener('click', e => closeForm(e, item, formWrap, false))
    textArea.addEventListener('input', e => { switchModeToFill(item) })

    item.classList.add('RomanistHere-filled')
}

const getPureURL = url => url.substring(url.lastIndexOf("/in/") + 4, url.indexOf("/", 8))

const updInfo = () => {
    chrome.storage.sync.get(['data'], resp => {
        const { data } = resp
        const items = document.querySelectorAll('.search-result.search-result--person:not(.RomanistHere-filled)')

        items.forEach(item => {
            const url = getPureURL(item.querySelector('.search-result__result-link').getAttribute("href"))

            appendElements(item, url)

            if (url in data) {
                fillText(item, data[url])
            }
        })
    })
}

updInfo()

const debUpdInfo = debounce(updInfo, 300)

const domObserver = new MutationObserver(mutations => {
    debUpdInfo()
})

domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
})
