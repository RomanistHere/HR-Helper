// const query = window.location.search.slice(1)
// console.log(query)

const linkTemplate = (href, name) =>
    `<a class="marked__link link" target="_blank" href="https://www.linkedin.com/in/${href}/">${name}</a>`

const stringTemplate = (textLeft, textRight, href) =>
    `<div class="table__left">
        <a class="table__link link" target="_blank" href="https://www.linkedin.com/in/${href}/">${textLeft}</a>
    </div>
    <div class="table__right">
        ${textRight}
    </div>`

const getName = string =>
    string.trimStart().replace(/[\n\r]/g, ' ').split(' ').slice(0, 2).join(' ')

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
            if (query == '')
                console.log(value)

            if (value.marked && key.toLowerCase().includes(query)) {
                const linksWrap = document.createElement('span')
                const name = getName(value.itemName)
                const link = linkTemplate(key, name)

                linksWrap.innerHTML = link
                marked.appendChild(linksWrap)
                continue
            }

            if (key.toLowerCase().includes(query) && value.itemName.toLowerCase().includes(query) && value.text.toLowerCase().includes(query)) {
                const tableWrap = document.createElement('div')
                const name = getName(value.itemName)
                const tableCont = stringTemplate(name, value.text, key)

                tableWrap.classList.add('table__string')
                tableWrap.innerHTML = tableCont
                table.appendChild(tableWrap)
            }
        }
    })

document.querySelector('.search__input').addEventListener('keyup', e => {
    const query = e.target.value
    clearScreen()
    loadData(query.toLowerCase())
})

loadData()
