import * as viz1 from './modules/viz1/viz.js'
import * as viz2 from './modules/viz2/viz.js'
import * as viz3 from './modules/viz3/viz.js'
import * as viz4 from './modules/viz4/viz.js'

const svg1 = d3.select('#viz1-svg')
const svg2 = d3.select('#viz2-svg')
const svg3 = d3.select('#viz3-svg')
const svg4a = d3.select('#viz4a-svg')
const svg4b = d3.select('#viz4b-svg')

let exoData
let geoData
let line
let dateFilter
let stopFocus
let stop
let direction

const setLine = (newLine) => {
    line = +newLine
    render()
}

const setDateFilter = (minDate, maxDate) => {
    dateFilter = [Date(minDate), Date(maxDate)]
    render()
}

const setStopFocus = (newStop) => {
    stopFocus = newStop
    render()
}

const setStop = (newStop) => {
    stop = newStop
    render()
}

const setDirection = (newDirection) => {
    direction = newDirection
    render()
}

const render = () => {
    svg1.call(viz1.viz, {
        data: exoData,
        render: render
    })
    
    svg2.call(viz2.viz, {
        data: exoData,
        render: render
    })
    
    svg3.call(viz3.viz, {
        data: exoData,
        render: render
    })
    
    svg4a.call(viz4.viz, {
        mode: 'in advance',
        data: exoData,
        render: render
    })
    
    svg4b.call(viz4.viz, {
        mode: 'delay',
        data: exoData,
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
        exoData = fetchExoData
        geoData = fetchGeoData
        render()
    })