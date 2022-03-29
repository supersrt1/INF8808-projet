/**
 * Returns a new dataset aggregated by param byColumns,
 * with new columns taux_Avance, taux_Ponctuel, taux_Retard,
 * average_montants and count
 */
export function aggregatePonctualite(data, byColumns) {
    const aggregateMap = data.reduce((accumulator, element) => {
        const aggregate = byColumns.map((column) => {
            return element[column]
        }).join('_')
        if (!accumulator.has(aggregate)) {
            accumulator.set(aggregate, Object.assign({}, element, {
                'taux_Avance': 0.0,
                'taux_Ponctuel': 0.0,
                'taux_Retard': 0.0,
                'average_montants': 0,
                'count': 0,
            }))
        }
        const ponctualite = element['Etat_Ponctualite']
        accumulator.get(aggregate)['count'] += 1
        accumulator.get(aggregate)['average_montants'] += element['montants']
        if (ponctualite === 'Avance')
            accumulator.get(aggregate)['taux_Avance'] += 1.0
        else if (ponctualite === 'Ponctuel')
            accumulator.get(aggregate)['taux_Ponctuel'] += 1.0
        else if (ponctualite === 'Retard')
            accumulator.get(aggregate)['taux_Retard'] += 1.0
        
        return accumulator
    }, new Map())

    const newData = Array.from(aggregateMap.values())
    newData.forEach((element) => {
        const count = element['count']
        element['taux_Avance'] /= count
        element['taux_Ponctuel'] /= count
        element['taux_Retard'] /= count
        element['average_montants'] /= count
    })
    return newData
}

/**
 * Adds new attributes to each element of data
 */
export function addMetaData(data) {
    data.forEach(element => {
        let [month, day, year] = element['date'].split('/')
        month -= 1 // Months are zero-based in javascript
        element['date_number'] = Date.UTC(year, month, day)
    });
    data.columns.push('date_number')

    return data
}

/**
 * Change some attributes to number type.
 */
export function convertStringToNumberForNumericFields(data) {
    data.forEach(element => {
        element['Minutes_ecart_planifie'] = parseInt(element['Minutes_ecart_planifie'])
        element['montants'] = parseInt(element['montants'])
        element['sequence_arret'] = parseInt(element['sequence_arret'])

        element['arret_Latitude'] = parseFloat(element['arret_Latitude'])
        element['arret_Longitude'] = parseFloat(element['arret_Longitude'])
    });
    return data
}