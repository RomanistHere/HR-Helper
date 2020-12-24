// STATE //

let state = {
	prevUrl: window.location.href
}

// HELPERS //
const getKeyFromURL = url => url.substring(url.lastIndexOf("/in/") + 4, url.indexOf("/", url.lastIndexOf("/in/") + 5))

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

const checkParNodeArr = (arr, elem) => {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].contains(elem)) {
			return true
		}
	}
	return false
}

const showErrMess = err => {
	alert(err)
}

const formTemplate = () =>
    `<form action="#" class="RomanistHere__form">
        <a href="#" class="RomanistHere__link RomanistHere__link_close">X</a>
        <textarea class="RomanistHere__textarea"></textarea>
        <a href="#" class="RomanistHere__link RomanistHere__link-left RomanistHere__link_expand">Expand</a>
        <a href="#" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link_mark">Mark</a>
        <a href="#" class="RomanistHere__link RomanistHere__link-middle RomanistHere__link-dis RomanistHere__btn">Save</a>
        <a href="#" class="RomanistHere__link RomanistHere__link_remove RomanistHere__link-right RomanistHere__link-dis">Clear</a>
		<div class="RomanistHere__saved">Saved</div>
    </form>`

// textarea is not empty
const switchModeToFull = item => {
    item.querySelector('.RomanistHere__link_remove').classList.remove('RomanistHere__link-dis')
    item.querySelector('.RomanistHere__btn').classList.remove('RomanistHere__link-dis')
    item.querySelector('.RomanistHere__link_mark').classList.add('RomanistHere__link-dis')
}

// textarea is empty
const switchModeToEmpty = item => {
    item.querySelector('.RomanistHere__link_remove').classList.add('RomanistHere__link-dis')
    item.querySelector('.RomanistHere__btn').classList.add('RomanistHere__link-dis')
    item.querySelector('.RomanistHere__link_mark').classList.remove('RomanistHere__link-dis')
}

// reset setup to default
const resetSetup = item => {
	fillText(item, '')
	item.querySelector('.RomanistHere__icon').classList.remove('RomanistHere__icon-marked')
	item.querySelector('.RomanistHere__icon').classList.remove('RomanistHere__icon-filled')
	switchModeToEmpty(item)
}

// mark setup
const markSetup = item => {
	item.querySelector('.RomanistHere__icon').classList.add('RomanistHere__icon-marked')
	item.querySelector('.RomanistHere__link_mark').classList.add('RomanistHere__link-dis')
	item.querySelector('.RomanistHere__link_remove').classList.remove('RomanistHere__link-dis')
}

const confirmChanges = savedNotif => {
    savedNotif.classList.add('RomanistHere__saved-show')
    setTimeout(() => { savedNotif.classList.remove('RomanistHere__saved-show') }, 2500)
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
	// don't refill if focused
	const formWrap = item.querySelector('.RomanistHere__wrap')
	if (formWrap && formWrap.classList.contains('RomanistHere__wrap-show')) {
		return
	}

	// reset to default
	resetSetup(item)

	// fill accordingly
	if (data == null) {
		return
	} else if (data.text && data.text.length > 0) {
        fillText(item, data.text)
    } else if (data.marked) {
        markSetup(item)
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
const removeItem = async (e, url, textArea, formWrap, item) => {
    resetSetup(item)

	let data = await getData()
    delete data[url]

	syncStore('it', data, data, () => {
		const savedNotif = item.querySelector('.RomanistHere__saved')
		confirmChanges(savedNotif)
	})

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

const getStorageData = key =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.get(key, result =>
            chrome.runtime.lastError
            ? reject(Error(chrome.runtime.lastError.message))
            : resolve(result)
        )
    )

const getData = async () => {
    let resp = await getStorageData(null)
    let string = ''

    delete resp['it']
    Object.values(resp).forEach(item => {
        string = string + item
    })

	if (string.length === 0) {
		return {}
	}

    const obj = JSON.parse(string)
    return obj
}

const saveToStorage = async (key, value, item, callback = () => {}) => {
    const data = await getData()
    const newData = { ...data, [key]: value }

	syncStore('it', newData, data, callback)
}

const lengthInUtf8Bytes = (str) => {
    const m = encodeURIComponent(str).match(/%[89ABab]/g)
    return str.length + (m ? m.length : 0)
}

const syncStore = (key, objectToStore, oldData, callback) => {
    let jsonstr = JSON.stringify(objectToStore), i = 0, storageObj = {},
        maxBytesPerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM,
        maxValueBytes, index, segment, counter

    while (jsonstr.length > 0) {
        index = key + "_" + i++
        maxValueBytes = maxBytesPerItem - lengthInUtf8Bytes(index)

        counter = maxValueBytes
        segment = jsonstr.substr(0, counter)
        while ((lengthInUtf8Bytes(JSON.stringify(segment)) + key.length) > maxValueBytes)
            segment = jsonstr.substr(0, --counter)

        storageObj[index] = segment
        jsonstr = jsonstr.substr(counter)
    }

    storageObj[key] = i

    chrome.storage.sync.clear(() => {
        chrome.storage.sync.set(storageObj, () => {
			if (chrome.runtime.lastError) {
				console.log(chrome.runtime.lastError.message)
				showErrMess('Sorry, something is wrong')
				syncStore('it', oldData, {}, () => {})
				return
			}
			callback()
		})
    })
}

const getName = string => {
	// console.log(string)
	const newString = string.replace('Expand', '')
		.replace('Status is online', '')
		.replace('Status is offline', '')
		.replace('Status is reachable', '')
		.replace('Status is unreachable', '')
		.replace('Save', '')
		.replace('Member’s name', '')
		.replace('Clear', '')
		.replace('Member’s', '')
		.replace('/2nd/', '')
		.replace('/1st/', '')
		.replace('/3rd/', '')
		.replace('degree connection', '')
		.replace(/[\n\r]/g, ' ')
		.trimStart()
		.split(' ')
		.slice(0, 2)
		.join(' ')
	// console.log(newString)
	return newString
}

const getNameAndUrl = (item, url) => {
	const header = document.querySelector('.global-nav')
	const name = header.contains(item) ? document.querySelector('.pv-top-card__photo').getAttribute('title') : getName(item.innerText)
	const newUrl = window.location.href.includes('/messaging/') ? getKeyFromURL(item.getAttribute('href')) : url

	return { name, newUrl }
}

// save item to storage
const saveChanges = (e, url, textArea, formWrap, item) => {
	const { name, newUrl } = getNameAndUrl(item, url)

    const newItem = {
        text: textArea.value,
        date: new Date().toLocaleDateString(),
        marked: false,
        itemName: name
    }

    saveToStorage(newUrl, newItem, item, () => {
		const savedNotif = item.querySelector('.RomanistHere__saved')
		confirmChanges(savedNotif)
	})
    closeForm(e, item, formWrap, true)
}

const saveOnEnter = (url, textArea, formWrap, item) => {
	textArea.addEventListener('keydown', e => {
        if (e.keyCode === 13 && e.ctrlKey) {
            saveChanges(e, url, textArea, formWrap, item)
        }
    })
}

// save item as marked to storage
const markItem = (e, url, formWrap, item) => {
	const { name, newUrl } = getNameAndUrl(item, url)

    const newItem = {
		date: new Date().toLocaleDateString(),
		marked: true,
		itemName: name
	}

    saveToStorage(newUrl, newItem, item, () => {
		markSetup(item)
	})
    closeForm(e, item, formWrap, false)
}

const openOptPage = (e, url, item, formWrap) => {
    e.preventDefault()
	const { name, newUrl } = getNameAndUrl(item, url)
    chrome.runtime.sendMessage({
		message: 'openOptPage',
		key: newUrl,
		name: name
	})
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
	saveOnEnter(url, textArea, formWrap, item)

    // mark wrapper as processed
    item.classList.add('RomanistHere-filled')
}

// get info from storage
const updInfo = async () => {
	if (state.prevUrl !== window.location.href) {
		state = { ...state, prevUrl: window.location.href }
		if (document.querySelector('.RomanistHere__header')) {
			document.querySelector('.RomanistHere__header').remove()
			document.querySelector('.global-nav').classList.remove('RomanistHere-filled')
		}
	}

	if (window.location.href.includes('/notifications')) {
		return
	}

	const data = await getData()
	const recomendations = document.querySelector('.pv-recommendations-section')
	const rightRailFeed = document.querySelector('.feed-follows-module')
	const myselfCont = document.querySelector('.global-nav__me-content')
	const myselfFeed = document.querySelector('.feed-identity-module')
	const commentsCont = document.querySelectorAll('.comments-comments-list')
	const invitations = document.querySelector('.mn-invitations-preview')
	const messagesPortative = document.querySelectorAll('.msg-overlay-conversation-bubble')
	const messagesFull = document.querySelectorAll('.msg-thread .msg-s-message-list-container')
	const allLinks = [...document.querySelectorAll('a:not(.RomanistHere__link)')]

	if (allLinks.length > 5000) {
		domObserver.disconnect()
		// TODO
		showErrMess('Sorry, something is not working. Too much results')
		// sendErr('mutation api 5k+', window.location.href)
		return
	}
	const links = allLinks.filter(link =>
		link.href.includes('in/')
		&& !link.href.includes('/report/')
		&& !link.href.includes('/linkedin/')
		&& !link.href.includes('/#')
		&& !link.href.includes('/edit/')
		&& !link.href.includes('/opportunities/')
		&& !link.href.includes('/detail')
		&& !link.href.includes('/?lipi=urn')
		&& !link.href.includes('/?mini')
		// myself container from top
		&& (myselfCont ? !myselfCont.contains(link) : true)
		&& (myselfFeed ? !myselfFeed.contains(link) : true)
		// feed
		&& (rightRailFeed ? !rightRailFeed.contains(link) : true)
		&& (recomendations ? !recomendations.contains(link) : true)
		// comments
		&& (commentsCont.length && checkParNodeArr(commentsCont, link) ? !link.innerHTML.includes('<img') : true)
		// invitations
		&& (invitations && invitations.contains(link) ? !link.innerHTML.includes('<img') : true)
		&& (invitations && invitations.contains(link) ? !link.innerHTML.includes('ghost-person') : true)
		// if not inside messages
		&& (messagesPortative.length ? !checkParNodeArr(messagesPortative, link) : true)
		&& (messagesFull.length ? !checkParNodeArr(messagesFull, link) : true)
		// only for results page
		&& (window.location.href.includes('/results/') ? !link.innerHTML.includes('<img') : true)
		&& (window.location.href.includes('/results/') ? !link.innerHTML.includes('ghost-person') : true))

	links.map(item => {
		const url = item.href
		const fixedUrl = url[url.length - 1] == '/' ? url : `${url}/`
		const key = getKeyFromURL(fixedUrl)

		if (!item.innerHTML.includes('RomanistHere__wrapper'))
			appendElements(item, key)

		fillItem(item, data[key])
	})

	// person page
	if (window.location.href.includes('linkedin.com/in/')) {
		const key = getKeyFromURL(window.location.href)
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
}

updInfo()

// handle Li update
const debUpdInfo = debounce(updInfo, 300)
const domObserver = new MutationObserver(mutations => {
    debUpdInfo()
})

domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
})

// handle update from other sources
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === 'updated') {
		debUpdInfo()
	}
})
