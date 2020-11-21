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
}

chrome.storage.sync.get(['data'], resp => {
    const { data } = resp
    const items = document.querySelectorAll('.search-result.search-result--person')

    items.forEach(item => {
        const name = item.querySelector('.name.actor-name').textContent

        appendElements(item, name)

        if (name in data) {
            fillText(item, data[name])
        }
    })
})
