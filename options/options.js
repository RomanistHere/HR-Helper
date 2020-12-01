// const query = window.location.search.slice(1)
// console.log(query)

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
    <a class="remove" title="Delete" data-key="${href}" href="#">X</a>
    <a class="${toUpd ? 'save' : 'update'}" title="Update and save" data-key="${href}" href="#">${toUpd ? 'Unmark and save' : 'Update'}</a>`

const getName = string =>
    string.trimStart().replace(/[\n\r]/g, ' ').split(' ').slice(0, 2).join(' ')

const objFilter = (obj, condition) => {
    let newObj = {}
    for (const [key, value] of Object.entries(obj)) {
        if (condition(value)) {
            newObj = { ...newObj, [key]: value }
        }
    }
    return newObj
}

const clearScreen = () => {
    const table = document.querySelector('.table')
    const marked = document.querySelector('.marked')
    table.innerHTML = ''
    marked.innerHTML = ''
}

const loadData = query =>
    chrome.storage.sync.get(['data'], resp => {
        if (!resp.data)
            return

        if (query == null)
            query = ''

        const { data } = resp
        const table = document.querySelector('.table')
        const marked = document.querySelector('.marked')

        for (const [key, value] of Object.entries(data)) {
            if (query == 'romanisthere')
                console.log(value)

            const name = getName(value.itemName)

            if (value.marked && name.toLowerCase().includes(query)) {
                const linksWrap = document.createElement('span')
                const link = linkTemplate(key, name)

                linksWrap.innerHTML = link
                marked.appendChild(linksWrap)

                // handle moveToSaved button
                const moveToSaved = linksWrap.querySelector('.moveToSaved')
                moveToSaved.addEventListener('click', e => {
                    e.stopPropagation()
                    e.preventDefault()
                    e.currentTarget.parentNode.parentNode.remove()

                    const newItem = document.createElement('div')
                    const itemData = stringTemplate(name, key, true)
                    newItem.classList.add('table__string')
                    newItem.innerHTML = itemData

                    table.insertBefore(newItem, table.childNodes[0])

                    // handle textarea
                    const textArea = newItem.querySelector('.table__right')
                    textArea.addEventListener('click', e => {
                        e.currentTarget.parentNode.querySelector('.save').classList.add('update-show')
                    })

                    const saveBtn = newItem.querySelector('.save')
                    saveBtn.addEventListener('click', e => {
                        e.preventDefault()
                        const newText = textArea.value
                        chrome.storage.sync.get(['data'], resp => {
                            const newData = {
                                ...resp.data,
                                [key]: {
                                    ...resp.data[key],
                                    text: newText,
                                    marked: false,
                                }
                            }
                            chrome.storage.sync.set({ data: newData })
                        })
                    })
                })
                continue
            } else if (value.marked) {
                continue
            }

            if (key.toLowerCase().includes(query) || name.toLowerCase().includes(query) || value.text.toLowerCase().includes(query)) {
                // create and append element
                const tableWrap = document.createElement('div')
                const tableCont = stringTemplate(name, key)
                tableWrap.classList.add('table__string')
                tableWrap.innerHTML = tableCont
                table.appendChild(tableWrap)

                // handle textarea
                const textArea = tableWrap.querySelector('.table__right')
                textArea.value = value.text
                textArea.addEventListener('click', e => {
                    e.currentTarget.parentNode.querySelector('.update').classList.add('update-show')
                })
            }
        }

        document.querySelectorAll('.remove').forEach(item => item.addEventListener('click', e => {
            e.preventDefault()
            const elem = e.currentTarget
            const key = elem.getAttribute('data-key')
            chrome.storage.sync.get(['data'], resp => {
                let newData = resp.data
                delete newData[key]
                chrome.storage.sync.set({ data: newData })
                elem.parentNode.remove()
            })
        }))

        document.querySelectorAll('.update').forEach(item => item.addEventListener('click', e => {
            e.preventDefault()
            const elem = e.currentTarget
            const key = elem.getAttribute('data-key')
            const newVal = elem.parentNode.querySelector('.table__right').value
            chrome.storage.sync.get(['data'], resp => {
                const newData = { ...resp.data, [key]: { ...resp.data[key], text: newVal } }
                chrome.storage.sync.set({ data: newData })
            })
        }))
    })

document.querySelector('.search__input').addEventListener('keyup', e => {
    const query = e.target.value
    clearScreen()
    loadData(query.toLowerCase())
})

const expand = document.querySelectorAll('.section__expand')
const clear = document.querySelectorAll('.section__clear')
const popup = document.querySelector('.popup')

expand.forEach(item => item.addEventListener('click', e => {
    e.preventDefault()
    const section = e.currentTarget.parentNode.parentNode
    section.classList.toggle('section-expand')
}))

const firePopUp = (marked) => {
    popup.classList.add('popup-show')
    const deleteBtn = popup.querySelector('.delete')
    const notDeleteBtn = popup.querySelector('.notDelete')

    const handleDel = e => {
        e.preventDefault()

        chrome.storage.sync.get(['data'], resp => {
            const newData = objFilter(resp.data, (value) => value.marked === marked)
            chrome.storage.sync.set({ data: newData })
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

clear.forEach(item => item.addEventListener('click', e => {
    e.preventDefault()

    const marked = e.currentTarget.getAttribute('data-marked') == 'false' ? true : false
    firePopUp(marked)
}))

loadData()
