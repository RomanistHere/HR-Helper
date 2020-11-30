// get unique url
const getPureURL = url => url.substring(url.lastIndexOf("/in/") + 4, url.indexOf("/", url.lastIndexOf("/in/") + 5))

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

const formTemplate = () =>
    `<form action="#" class="RomanistHere__form">
        <a href="#" class="RomanistHere__link RomanistHere__link_close">X</a>
        <textarea class="RomanistHere__textarea"></textarea>
        <a href="#" class="RomanistHere__link RomanistHere__link-left RomanistHere__link_expand">Expand</a>
        <a href="#" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link_mark">Mark</a>
        <a href="#" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link-dis RomanistHere__btn">Save</a>
        <a href="#" class="RomanistHere__link RomanistHere__link_remove RomanistHere__link-right RomanistHere__link-dis">Clear</a>
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
	// const formWrap = item.querySelector('.RomanistHere__wrap')
	// if (formWrap && formWrap.classList.includes('RomanistHere__wrap-show')) {
	// 	console.log('focused')
	// 	return
	// }

	if (data == null) {
		fillText(item, '')
		item.querySelector('.RomanistHere__icon').classList.remove('RomanistHere__icon-filled')
		switchModeToEmpty(item)
	} else if (data.text && data.text.length > 0) {
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
	const name = item.innerText.replace('Expand', '').replace('Save', '').replace('Clear', '').replace('/2nd/', '').replace('degree connection', '')

    const newItem = {
        text: textArea.value,
        date: new Date().toLocaleDateString(),
        marked: false,
        itemName: name
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

const openOptPage = (e, url, item, formWrap) => {
    e.preventDefault()
    chrome.runtime.sendMessage({ message: 'openOptPage', key: url })
    closeForm(e, item, formWrap, false)
}

// add UI to Li
const appendElements = (item, url) => {
    // create wrapper
    const wrapper = document.createElement('div')
	wrapper.classList.add('RomanistHere__wrapper')
	item.appendChild(wrapper)

    // create icon
    const icon = document.createElement('span')
    icon.classList.add('RomanistHere__icon')
    wrapper.appendChild(icon)

    // create form
    const formWrap = document.createElement('div')
    const formText = formTemplate()
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
	icon.addEventListener('mouseover', e => { e.preventDefault(); e.stopPropagation() })
	formWrap.addEventListener('mouseover', e => { e.preventDefault(); e.stopPropagation() })
	icon.addEventListener('mouseenter', e => { e.preventDefault(); e.stopPropagation() })
    formWrap.addEventListener('mouseenter', e => { e.preventDefault(); e.stopPropagation() })

    // form handlers
    submit.addEventListener('click', e => saveChanges(e, url, textArea, formWrap, item))
    remove.addEventListener('click', e => removeItem(e, url, textArea, formWrap, item))
    close.addEventListener('click', e => closeForm(e, item, formWrap, false))
    mark.addEventListener('click', e => markItem(e, url, formWrap, item))
    expand.addEventListener('click', e => openOptPage(e, url, item, formWrap))
    textArea.addEventListener('input', e => { switchModeToFull(item) })

    // mark wrapper as processed
    item.classList.add('RomanistHere-filled')
}

const checkParNodeArr = (arr, elem) => {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].contains(elem)) {
			return true
		}
	}
	return false
}

// get info from storage
const updInfo = () => {
    chrome.storage.sync.get(['data'], resp => {
        const { data } = resp.data ? resp : { data: {} }
		const myselfCont = document.querySelector('.global-nav__me-content')
		const messagesPortative = document.querySelectorAll('.msg-overlay-conversation-bubble')
		const messagesFull = document.querySelectorAll('.msg-thread .msg-s-message-list-container')
		const allLinks = [...document.querySelectorAll('a:not(.RomanistHere__link)')]

		if (allLinks.length > 5000) {
			domObserver.disconnect()
			// TODO
			// showErrMess('sorry, something is not working')
			// sendErr('mutation api 5k+', window.location.href)
			return
		}

		const links = allLinks.filter(link =>
			link.href.includes('in/')
			&& !link.href.includes('/report/')
			&& !link.href.includes('/linkedin/')
			&& !link.href.includes('/#')
			&& !link.href.includes('/edit/')
			&& !link.href.includes('/detail')
			// && !link.innerHTML.includes('RomanistHere__wrapper')
			// myself container from top
			&& (myselfCont ? !myselfCont.contains(link) : true)
			// if not inside messages
			&& (messagesPortative.length ? !checkParNodeArr(messagesPortative, link) : true)
			&& (messagesFull.length ? !checkParNodeArr(messagesFull, link) : true)
			// only for results page
			&& (window.location.href.includes('/results/') ? !link.innerHTML.includes('<img') : true)
			&& (window.location.href.includes('/results/') ? !link.innerHTML.includes('ghost-person') : true))

		links.map(item => {
			const url = item.href
			const fixedUrl = url[url.length - 1] == '/' ? url : `${url}/`
			const key = getPureURL(fixedUrl)
			console.log(key)

			if (!item.innerHTML.includes('RomanistHere__wrapper'))
				appendElements(item, key)

			fillItem(item, data[key])
		})

		// person page
		if (window.location.href.includes('linkedin.com/in/')) {
			const key = getPureURL(window.location.href)
			const header = document.querySelector('.global-nav')

			if (header.classList.contains('RomanistHere-filled')) {
				const headerWrap = header.querySelector('.RomanistHere__header')
				fillItem(headerWrap, data[key])
				return
			}

			const wrap = document.createElement('div')
			wrap.classList.add('RomanistHere__header')
			header.insertBefore(wrap, header.childNodes[0])

			appendElements(wrap, key)
			header.classList.add('RomanistHere-filled')
		}
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
