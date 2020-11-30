// const query = window.location.search.slice(1)
// console.log(query)

const linkTemplate = (href, name) =>
    `<a class="marked__link" target="_blank" href="https://www.linkedin.com/in/${href}">${name}</a>, `

const stringTemplate = (textLeft, textRight, href) =>
    `<div class="table__left">
        <a class="marked__link" target="_blank" href="https://www.linkedin.com/in/${href}">${textLeft}</a>
    </div>
    <div class="table__right">
        ${textRight}
    </div>`

const getName = string => {
    console.log(string)
    return string.trimStart().replace(/[\n\r]/g, ' ').split(' ').slice(0, 2).join(' ')
}

chrome.storage.sync.get(['data'], resp => {
    if (!resp.data) {
        return
    }

    const { data } = resp
    const table = document.querySelector('.table')
    const marked = document.querySelector('.marked')

    for (const [key, value] of Object.entries(data)) {
        // console.log(value)
        if (value.marked) {
            const linksWrap = document.createElement('span')
            const name = getName(value.itemName)
            const link = linkTemplate(key, name)

            linksWrap.innerHTML = link
            marked.appendChild(linksWrap)
            continue
        }

        const tableWrap = document.createElement('div')
        const name = getName(value.itemName)
        const tableCont = stringTemplate(name, value.text, key)

        tableWrap.classList.add('table__string')
        tableWrap.innerHTML = tableCont
        table.appendChild(tableWrap)
    }
})
