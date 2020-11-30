// const query = window.location.search.slice(1)
// console.log(query)

const linkTemplate = (href, name) =>
    `<a class="marked__link link" target="_blank" href="https://www.linkedin.com/in/${href}/">
        ${name}
        <span class="remove" data-key="${href}" href="#">X</span>
    </a>`

const stringTemplate = (textLeft, textRight, href) =>
    `<div class="table__left">
        <a class="table__link link" target="_blank" href="https://www.linkedin.com/in/${href}/">${textLeft}</a>
    </div>
    <div class="table__right">
        ${textRight}
    </div>
    <a class="remove" data-key="${href}" href="#">X</a>`

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
            // if (query == '')
            //     console.log(value)

            const name = getName(value.itemName)

            if (value.marked && name.toLowerCase().includes(query)) {
                const linksWrap = document.createElement('span')
                const link = linkTemplate(key, name)

                linksWrap.innerHTML = link
                marked.appendChild(linksWrap)
                continue
            } else if (value.marked) {
                continue
            }

            if (key.toLowerCase().includes(query) || name.toLowerCase().includes(query) || value.text.toLowerCase().includes(query)) {
                const tableWrap = document.createElement('div')
                const tableCont = stringTemplate(name, value.text, key)

                tableWrap.classList.add('table__string')
                tableWrap.innerHTML = tableCont
                table.appendChild(tableWrap)
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
    })

document.querySelector('.search__input').addEventListener('keyup', e => {
    const query = e.target.value
    clearScreen()
    loadData(query.toLowerCase())
})

document.querySelector('.clearMarked').addEventListener('click', e => {
    e.preventDefault()

    chrome.storage.sync.get(['data'], resp => {
        const newData = objFilter(resp.data, (value) => value.marked === false)
        chrome.storage.sync.set({ data: newData })
    })

    window.location.reload()
})

document.querySelector('.clearSaved').addEventListener('click', e => {
    e.preventDefault()

    chrome.storage.sync.get(['data'], resp => {
        const newData = objFilter(resp.data, (value) => value.marked === true)
        chrome.storage.sync.set({ data: newData })
    })

    window.location.reload()
})

loadData()
