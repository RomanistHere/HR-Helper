// get unique url
const getPureURL = url => url.substring(url.lastIndexOf("/in/") + 4, url.indexOf("/", 8))

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

const formTemplate = url =>
    `<form action="#" class="RomanistHere__form">
        <a href="#" class="RomanistHere__link RomanistHere__link_close">X</a>
        <textarea class="RomanistHere__textarea"></textarea>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link-left RomanistHere__link_expand">Expand</a>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link_mark">Mark</a>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link-dis RomanistHere__btn">Save</a>
        <a href="#" data-url="${url}" class="RomanistHere__link RomanistHere__link_remove RomanistHere__link-right RomanistHere__link-dis">Clear</a>
    </form>`

// textarea is not empty
const switchModeToFull = item => {
    const remove = item.querySelector('.RomanistHere__link_remove')
    const save = item.querySelector('.RomanistHere__btn')
    const mark = item.querySelector('.RomanistHere__link_mark')

    remove.classList.remove('RomanistHere__link-dis')
    save.classList.remove('RomanistHere__link-dis')
    mark.classList.add('RomanistHere__link-dis')
}

// textarea is empty
const switchModeToEmpty = item => {
    const remove = item.querySelector('.RomanistHere__link_remove')
    const save = item.querySelector('.RomanistHere__btn')
    const mark = item.querySelector('.RomanistHere__link_mark')

    remove.classList.add('RomanistHere__link-dis')
    save.classList.add('RomanistHere__link-dis')
    mark.classList.remove('RomanistHere__link-dis')
}

// fill text from storage
const fillText = (item, text) => {
    const textArea = item.querySelector('.RomanistHere__textarea')

    textArea.value = text
    item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-filled')
    switchModeToFull(item)
}

// fill item from storage
const fillItem = (item, data) => {
    if (data.text) {
        fillText(item, data.text)
    } else if (data.marked) {
        item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-marked')
        item.querySelector('.RomanistHere__link_mark').classList.add('RomanistHere__link-dis')
        item.querySelector('.RomanistHere__link_remove').classList.remove('RomanistHere__link-dis')
    }
}

// don't close form on mouseout
const fixArea = (e, formWrap) => {
    e.stopPropagation()
    e.preventDefault()

    formWrap.classList.add('RomanistHere__wrap-show')
}

// close form on mouseout
const closeForm = (e, item, formWrap, shouldmark = false) => {
    e.preventDefault()

    setTimeout(() => {
        if (shouldmark) item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-filled')
        formWrap.classList.remove('RomanistHere__wrap-show')
    }, 50)
}

// remove item from storage
const removeItem = (e, url, textArea, formWrap, item) => {
    textArea.value = ''
    item.querySelector('.RomanistHere__icon').classList.remove('RomanistHere__icon-filled')

    chrome.storage.sync.get(['data'], resp => {
        let { data } = resp.data ? resp : { data: {} }
        delete data[url]
        chrome.storage.sync.set({ data: data })
    })

    switchModeToEmpty(item)
    closeForm(e, item, formWrap, false)
}

// model
// {
//     itemName: string,
//     text: string,
//     date: string,
//     marked: boolean,
//     // later
//     userName: string,
//     userEmail: string,
//     userWork: string,
// }

const saveToStorage = (key, value) =>
    chrome.storage.sync.get(['data'], resp => {
        const { data } = resp.data ? resp : { data: {} }
        const newData = { ...data, [key]: value }
        chrome.storage.sync.set({ data: newData })
    })

// save item to storage
const saveChanges = (e, url, textArea, formWrap, item) => {
    const newItem = {
        text: textArea.value,
        date: new Date().toLocaleDateString(),
        marked: false,
        itemName: item.querySelector('.name.actor-name').textContent
    }

    saveToStorage(url, newItem)
    closeForm(e, item, formWrap, true)
}

// save item as marked to storage
const markItem = (e, url, formWrap, item) => {
    const newItem = { marked: true }

    saveToStorage(url, newItem)
    closeForm(e, item, formWrap, false)

    item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-marked')
}

// add UI to Li
const appendElements = (item, url) => {
    // wrapper from Li
    const wrapper = item.querySelector('.actor-name-with-distance')

    // create icon
    const icon = document.createElement("span")
    icon.classList.add('RomanistHere__icon')
    wrapper.appendChild(icon)

    // create form
    const formWrap = document.createElement("div")
    const formText = formTemplate(url)
    formWrap.classList.add('RomanistHere__wrap')
    formWrap.innerHTML = formText
    wrapper.appendChild(formWrap)

    // form controls
    const submit = item.querySelector('.RomanistHere__btn')
    const close = item.querySelector('.RomanistHere__link_close')
    const expand = item.querySelector('.RomanistHere__link_expand')
    const mark = item.querySelector('.RomanistHere__link_mark')
    const remove = item.querySelector('.RomanistHere__link_remove')

    // text area
    const textArea = item.querySelector('.RomanistHere__textarea')

    // state handlers
    icon.addEventListener('click', e => fixArea(e, formWrap))
    formWrap.addEventListener('click', e => fixArea(e, formWrap))

    // form handlers
    submit.addEventListener('click', e => saveChanges(e, url, textArea, formWrap, item))
    remove.addEventListener('click', e => removeItem(e, url, textArea, formWrap, item))
    close.addEventListener('click', e => closeForm(e, item, formWrap, false))
    mark.addEventListener('click', e => markItem(e, url, formWrap, item))
    textArea.addEventListener('input', e => { switchModeToFull(item) })

    // mark wrapper as processed
    item.classList.add('RomanistHere-filled')
}

// get info from storage
const updInfo = () => {
    chrome.storage.sync.get(['data'], resp => {
        const { data } = resp.data ? resp : { data: {} }
        const items = document.querySelectorAll('.search-result.search-result--person:not(.RomanistHere-filled)')

        items.forEach(item => {
            const url = getPureURL(item.querySelector('.search-result__result-link').getAttribute("href"))

            appendElements(item, url)

            if (url in data) {
                fillItem(item, data[url])
            }
        })
    })
}

updInfo()

const debUpdInfo = debounce(updInfo, 300)

// handle Li update
const domObserver = new MutationObserver(mutations => {
    debUpdInfo()
})

domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
})
