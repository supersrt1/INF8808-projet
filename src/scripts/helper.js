export function getUniqueValues(data, column) {
    const uniqueSet = data.reduce((accumulator, element) => {
        if (!accumulator.has(element[column])) {
            accumulator.add(element[column])
        }
        return accumulator
    }, new Set())

    return Array.from(uniqueSet).sort((a, b) => a - b)
}

export function debugLogAllUniqueValues(data) {
    data.columns.forEach(column => {
        console.log(column + ' unique values:')
        console.log(getUniqueValues(data, column))
    })
}