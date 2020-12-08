const linkTemplate = (href, name) =>
    `<a class="marked__link link" title="Open ${name} in the new tab" target="_blank" href="https://www.linkedin.com/in/${href}/">
        ${name}
        <span class="remove" title="Delete" data-key="${href}" href="#">X</span>
        <span class="moveToSaved" title="Move to saved" data-key="${href}" href="#">⇓</span>
    </a>`

const stringTemplate = (textLeft, href, toUpd = false) =>
    `<div class="table__left">
        <a class="table__link link" title="Open ${textLeft} in the new tab" target="_blank" href="https://www.linkedin.com/in/${href}/">${textLeft}</a>
    </div>
    <textarea class="table__right"></textarea>
    <a class="remove" title="Delete" data-key="${href}" href="#">del</a>
    <a class="expand" title="Show in full-screen" data-key="${href}" href="#">full-screen</a>
    <a class="${toUpd ? 'save' : 'update'}" title="Update and save" data-key="${href}" href="#">${toUpd ? 'Unmark and save' : 'Save changes'}</a>`

const getName = string =>
    string ? string.trimStart().replace(/[\n\r]/g, ' ').split(' ').slice(0, 2).join(' ') : null

const objFilter = (obj, condition) => {
    let newObj = {}
    for (const [key, value] of Object.entries(obj)) {
        if (condition(value)) {
            newObj = { ...newObj, [key]: value }
        }
    }
    return newObj
}

const confirmChanges = () => {
    savedNotif.classList.add('saved-show')
    setTimeout(() => { savedNotif.classList.remove('saved-show') }, 3000)
}

const saveChanges = (key, newText, name) =>
    chrome.storage.sync.get(['data'], resp => {
        const newData = {
            ...resp.data,
            [key]: {
                text: newText,
                marked: false,
                itemName: getName(name),
                date: new Date().toLocaleDateString()
            }
        }
        chrome.storage.sync.set({ data: newData }, confirmChanges)
    })

const handleClick = (elem, func) => {
    if (elem.length == null) {
        elem.addEventListener('click', e => {
            e.preventDefault()
            func(e)
        })
    } else {
        elem.forEach(item => item.addEventListener('click', e => {
            e.preventDefault()
            func(e)
        }))
    }
}

const clearScreen = () => {
    const table = document.querySelector('.table')
    const marked = document.querySelector('.marked')
    table.innerHTML = ''
    marked.innerHTML = ''
}

const saveOnEnter = (textArea, key, name) => {
    textArea.addEventListener('keydown', e => {
        if (e.keyCode === 13 && e.ctrlKey) {
            const newText = textArea.value
            saveChanges(key, newText, name)
            textArea.parentNode.querySelector('.update').classList.remove('update-show')
        }
    })
}

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
    console.log(string)
    const obj = JSON.parse(string)
    console.log(obj)
    return obj
}

const loadData = async (queryArr) => {
    if (queryArr == null)
        queryArr = []

    const data = await getData()

    const table = document.querySelector('.table')
    const marked = document.querySelector('.marked')

    for (const [key, value] of Object.entries(data)) {
        if (queryArr[0] == 'romanisthere')
            console.log(value)

        const name = getName(value.itemName)

        // APPEND TO MARKED
        if (value.marked && queryArr.every(item => name.toLowerCase().includes(item))) {
            const linksWrap = document.createElement('span')
            const link = linkTemplate(key, name)

            linksWrap.innerHTML = link
            marked.appendChild(linksWrap)

            // handle moveToSaved button
            const moveToSaved = linksWrap.querySelector('.moveToSaved')
            handleClick(moveToSaved, e => {
                // move element from marked to saved
                e.currentTarget.parentNode.parentNode.remove()
                const newItem = document.createElement('div')
                const itemData = stringTemplate(name, key, true)
                newItem.classList.add('table__string')
                newItem.innerHTML = itemData
                table.insertBefore(newItem, table.childNodes[0])

                // handle textarea
                const textArea = newItem.querySelector('.table__right')
                const saveBtn = newItem.querySelector('.save')

                textArea.addEventListener('input', e => {
                    e.currentTarget.parentNode.querySelector('.save').classList.add('update-show')
                })

                saveOnEnter(textArea, key, name)

                handleClick(newItem.querySelector('.expand'), () => {
                    window.location.search = `key=${key}&name=${name}`
                })

                handleClick(saveBtn, () => {
                    const newText = textArea.value
                    saveChanges(key, newText, name)
                })
            })
            continue
        } else if (value.marked) {
            continue
        }

        // append to SAVED
        if (queryArr.every(item => key.toLowerCase().includes(item))
            || queryArr.every(item => name.toLowerCase().includes(item))
            || queryArr.every(item => value.text.toLowerCase().includes(item))) {
            // create and append element
            const tableWrap = document.createElement('div')
            const tableCont = stringTemplate(name, key)
            tableWrap.classList.add('table__string')
            tableWrap.innerHTML = tableCont
            table.appendChild(tableWrap)

            // handle textarea
            const textArea = tableWrap.querySelector('.table__right')
            textArea.value = value.text
            textArea.addEventListener('input', e => {
                e.currentTarget.parentNode.querySelector('.update').classList.add('update-show')
            })

            saveOnEnter(textArea, key, name)

            handleClick(tableWrap.querySelector('.expand'), () => {
                window.location.search = `key=${key}&name=${name}`
            })
        }
    }

    handleClick(document.querySelectorAll('.remove'), e => {
        const elem = e.currentTarget
        const key = elem.getAttribute('data-key')
        chrome.storage.sync.get(['data'], resp => {
            let newData = resp.data
            delete newData[key]
            chrome.storage.sync.set({ data: newData }, () => {
                confirmChanges()
                elem.parentNode.remove()
            })
        })
    })

    handleClick(document.querySelectorAll('.update'), e => {
        const elem = e.currentTarget
        const key = elem.getAttribute('data-key')
        const newVal = elem.parentNode.querySelector('.table__right').value
        chrome.storage.sync.get(['data'], resp => {
            const newData = { ...resp.data, [key]: { ...resp.data[key], text: newVal } }
            chrome.storage.sync.set({ data: newData }, () => {
                confirmChanges()
                elem.parentNode.querySelector('.update').classList.remove('update-show')
            })
        })
    })
}

document.querySelector('.search__input').addEventListener('keyup', e => {
    const query = e.target.value
    clearScreen()

    const queryArr = query.split(' ')
        .filter(item => item.length > 0)
        .filter(item => item !== 'AND' && item !== '||')
        .map(item => item.toLowerCase())
    console.log(queryArr)

    loadData(queryArr.length ? queryArr : null)
})

const expand = document.querySelectorAll('.section__expand')
const clear = document.querySelectorAll('.section__clear')
const popup = document.querySelector('.popup')
const closeInfo = document.querySelector('.section__info-close')
const savedNotif = document.querySelector('.saved')

handleClick(closeInfo, e => {
    e.currentTarget.parentNode.classList.remove('section__info-show')
    e.currentTarget.parentNode.classList.remove('section__info-display')

    chrome.storage.sync.set({
        optionsState: {
            infoClosed: true
        }
    })
})

// chrome.storage.sync.get(['optionsState'], resp => {
//     const { optionsState } = resp
//
//     if (!optionsState.infoClosed) {
//         document.querySelector('.section__info').classList.add('section__info-display')
//     }
// })

handleClick(expand, () => {
    const section = e.currentTarget.parentNode.parentNode
    section.classList.toggle('section-expand')
})

const firePopUp = (marked) => {
    popup.classList.add('popup-show')
    const deleteBtn = popup.querySelector('.delete')
    const notDeleteBtn = popup.querySelector('.notDelete')

    const handleDel = e => {
        e.preventDefault()

        chrome.storage.sync.get(['data'], resp => {
            const newData = objFilter(resp.data, (value) => value.marked === marked)
            chrome.storage.sync.set({ data: newData }, confirmChanges)
        })

        window.location.reload()
    }

    const handleNotDel = e => {
        e.preventDefault()

        popup.classList.remove('popup-show')

        deleteBtn.removeEventListener('click', handleDel)
        notDeleteBtn.removeEventListener('click', handleNotDel)
    }

    deleteBtn.addEventListener('click', handleDel)
    notDeleteBtn.addEventListener('click', handleNotDel)
}

handleClick(clear, (e) => {
    const marked = e.currentTarget.getAttribute('data-marked') == 'false' ? true : false
    firePopUp(marked)
})

loadData()

// EXPAND //
const initExpand = () => {
    const query = window.location.search.slice(1)
    if (query.length === 0)
        return

    const { key, name } = Object.fromEntries(new URLSearchParams(location.search))
    const expanded = document.querySelector('.expanded')
    const nameLink = expanded.querySelector('.expanded__name')
    const textArea = expanded.querySelector('.expanded__text')
    const saveBtn = expanded.querySelector('.expanded__save')
    const removeBtn = expanded.querySelector('.expanded__remove')
    const close = expanded.querySelector('.expanded__close')
    const infoLinks = expanded.querySelectorAll('.expanded__why')

    // set up elements
    nameLink.href = `${nameLink.href}${key}/`
    nameLink.innerText = getName(name)
    // set text if saved
    chrome.storage.sync.get(['data'], resp => {
        if (!resp.data)
            return

        const { data } = resp

        if (data[key]) {
            textArea.value = data[key].text ? data[key].text : ''
        }
    })

    // show expanded menu
    expanded.classList.add('expanded-show')
    document.body.style.overflow = 'hidden'

    // event listeners
    saveOnEnter(textArea, key, name)

    handleClick(saveBtn, () => {
        const newText = textArea.value
        saveChanges(key, newText, name)
    })

    handleClick(removeBtn, () => {
        chrome.storage.sync.get(['data'], resp => {
            let newData = resp.data
            delete newData[key]
            chrome.storage.sync.set({ data: newData }, () => {
                confirmChanges()
                textArea.value = ''
            })
        })
    })

    handleClick(close, () => {
        window.location.search = ''
    })

    handleClick(infoLinks, () => {
        document.querySelector('.section__info').classList.add('section__info-display')
        document.querySelector('.section__info').classList.add('section__info-show')
    })
}

initExpand()
