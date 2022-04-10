export function getUniqueValues(data, column) {
    const uniqueSet = data.reduce((accumulator, element) => {
        if (!accumulator.has(element[column])) {
            accumulator.add(element[column])
        }
        return accumulator
    }, new Set())

    return Array.from(uniqueSet).sort((a, b) => a - b)
}

export function getMinMaxDate(data) {
    const dateNumbers = data.map(element => element['date_number'])
    const minMax = d3.extent(dateNumbers)
    return [createLocalDate(minMax[0]), createLocalDate(minMax[1])]
}

export function setOptionsForDropdown(selection, options) {
    selection.selectAll('option')
        .data(options)
        .join('option')
            .attr('value', d => d)
            .text(d => d)
}

export function debugLogAllUniqueValues(data) {
    data.columns.forEach(column => {
        console.log(column + ' unique values:')
        console.log(getUniqueValues(data, column))
    })
}

export function createLocalDate(time_number) {
    const d = new Date(time_number)
    d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000)
    return d
}

export function convertLocalDateToDateNumber(date) {
    const d = new Date(date)
    d.setTime(d.getTime() - d.getTimezoneOffset() * 60 * 1000)
    return d.getTime()
}

export function getDaysBetweenDates(date1, date2) {
    const diffTime = Math.abs(date1 - date2)
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

export function addDays(date, days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}