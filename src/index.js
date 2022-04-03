import * as viz1 from './modules/viz1/viz.js'
import * as viz2 from './modules/viz2/viz.js'
import * as viz3 from './modules/viz3/viz.js'
import * as viz4 from './modules/viz4/viz.js'
import * as helper from './scripts/helper.js'
import * as preprocess from './scripts/preprocess.js'

const svg1 = d3.select('#viz1-svg')
const svg2 = d3.select('#viz2-svg')
const svg3 = d3.select('#viz3-svg')
const svg4a = d3.select('#viz4a-svg')
const svg4b = d3.select('#viz4b-svg')

// Datasets without filtering
let exoData
let geoData

// Filters and dynamic properties
let line
let dateFilter
let stopFocus
let stop
let direction
const ALL_STOPS = 'Tous'
const BOTH_DIRECTION = 'Bidirectionnel'

// Filtered data
const LINE_FILTER = 0
const DIRECTION_FILTER = 1
const DATE_FILTER = 2
const STOP_FILTER = 3
let filteredData = {
    raw: [],
    byLine: [],
    byLineDirection: [],
    byLineDirectionDate: [],
    byLineDirectionDateStop: [],
}

const setLine = (newLine) => {
    line = newLine
    refreshFilteredData(LINE_FILTER)
    render()
}

const setDateFilter = (minDate, maxDate) => {
    dateFilter = [new Date(parseInt(minDate)), new Date(parseInt(maxDate))]
    refreshFilteredData(DATE_FILTER)
    render()
}

const setStopFocus = (newStop) => {
    stopFocus = newStop
    render()
}

const setStop = (newStop) => {
    stop = newStop
    refreshFilteredData(STOP_FILTER)
    render()
}

const setDirection = (newDirection) => {
    direction = newDirection
    refreshFilteredData(DIRECTION_FILTER)
    render()
}

const setDefaultFilters = (data) => {
    line = data[0]['ligne']
    dateFilter = helper.getMinMaxDate(data)
    stopFocus = undefined
    stop = ALL_STOPS
    direction = BOTH_DIRECTION
}

const refreshFilteredData = (updatedFilter=0) => {
    filteredData.raw = exoData
    if (updatedFilter <= LINE_FILTER)
        filteredData.byLine = filteredData.raw.filter(element => element['ligne'] == line)
    if (updatedFilter <= DIRECTION_FILTER) {
        if (direction == BOTH_DIRECTION)
            filteredData.byLineDirection = filteredData.byLine
        else
            filteredData.byLineDirection = filteredData.byLine.filter(element => element['direction'] == direction)
    }
    if (updatedFilter <= DATE_FILTER) {
        const minDate = dateFilter[0].getTime()
        const maxDate = dateFilter[1].getTime()
        filteredData.byLineDirectionDate = filteredData.byLineDirection.filter(
            element => minDate <= element['date_number'] && element['date_number'] <= maxDate)
    }
    if (updatedFilter <= STOP_FILTER) {
        if (stop == ALL_STOPS)
            filteredData.byLineDirectionDateStop = filteredData.byLineDirectionDate
        else
            filteredData.byLineDirectionDateStop = filteredData.byLine.filter(element => element['arret_nom'] == stop)
    }

    updateFilterOptions()
    updateData()
}

const updateFilterOptions = () => {
    const filterGroup = d3.select('#section-filter').select('.viz-container')
    helper.setOptionsForDropdown(filterGroup.select('.filter-line'),
        helper.getUniqueValues(exoData, 'ligne'))
    helper.setOptionsForDropdown(filterGroup.select('.filter-direction'),
        [BOTH_DIRECTION].concat(helper.getUniqueValues(filteredData.byLine, 'direction')))
    helper.setOptionsForDropdown(filterGroup.select('.filter-min-date'),
        helper.getUniqueValues(filteredData.byLineDirection, 'date_number'))
    helper.setOptionsForDropdown(filterGroup.select('.filter-max-date'),
        helper.getUniqueValues(filteredData.byLineDirection, 'date_number').reverse())
    helper.setOptionsForDropdown(filterGroup.select('.filter-stop'),
        [ALL_STOPS].concat(helper.getUniqueValues(filteredData.byLineDirectionDate, 'arret_nom')))
}

const setFilterListeners = () => {
    const filterGroup = d3.select('#section-filter').select('.viz-container')
    filterGroup.select('.filter-line').on('change', () => setLine(filterGroup.select('.filter-line').node().value))
    filterGroup.select('.filter-direction').on('change', () => setDirection(filterGroup.select('.filter-direction').node().value))
    const callSetDateFilter = () => setDateFilter(
        filterGroup.select('.filter-min-date').node().value, filterGroup.select('.filter-max-date').node().value)
    filterGroup.select('.filter-min-date').on('change', callSetDateFilter)
    filterGroup.select('.filter-max-date').on('change', callSetDateFilter)
    filterGroup.select('.filter-stop').on('change', () => setStop(filterGroup.select('.filter-stop').node().value))
}

const updateData = () => {
    viz1.updateData(filteredData)
    viz2.updateData(filteredData)
    viz3.updateData(filteredData)
    viz4.updateData(filteredData)
}

const render = () => {
    svg1.call(viz1.viz, {
        data: filteredData,
        render: render
    })
    
    svg2.call(viz2.viz, {
        data: filteredData,
        render: render
    })
    
    svg3.call(viz3.viz, {
        data: filteredData,
        render: render
    })
    
    svg4a.call(viz4.viz, {
        mode: 'in advance',
        data: filteredData,
        render: render
    })
    
    svg4b.call(viz4.viz, {
        mode: 'delay',
        data: filteredData,
        render: render
    })
}

// -------- MAIN --------

window.addEventListener('resize', () => {
    render()
})

Promise.all([
    d3.csv('./exo_data.csv'),
    d3.json('./montreal.json')
]).then(([fetchExoData, fetchGeoData]) => {
        exoData = preprocess.convertStringToNumberForNumericFields(
            preprocess.addMetaData(fetchExoData)
        )
        geoData = fetchGeoData
        setDefaultFilters(exoData)
        refreshFilteredData()
        updateFilterOptions()
        setFilterListeners()

        // Useful for development - Can be removed safely -----
        helper.debugLogAllUniqueValues(exoData)
        // ----------------------------------------------------

        render()
    })