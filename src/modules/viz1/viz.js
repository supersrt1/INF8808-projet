/* eslint-disable indent */
import * as helper from './../../scripts/helper.js'
import d3Tip from 'd3-tip'

export function updateData(filteredData) {
    // Optional, for performance
}

export const viz = (selection, props) => {
    const {
        data,
        stop,
        ALL_STOPS,
        dateFilter,
        setDateFilter,
        render
    } = props

    const {
        width,
        height
    } = selection.node().getBoundingClientRect()

    const margin = { top: 20, right: 20, bottom: 10, left: 40 }

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Filtrage au besoin sur les arrêts
    let filteredData = data.byLineDirection
    if (stop !== ALL_STOPS)
        filteredData = data.byLineDirection.filter(d => d['arret_nom'] == stop)

    // Regrouper les données par jour
    var groupedData = d3.nest()
                        .key(d => d.date_number)
                        .rollup(leaves => d3.sum(leaves, d => d.montants))
                        .entries(filteredData)

    // Calculer le scale sur l'axe horizontal
    const dateExtent = d3.extent(groupedData, d => +d.key)
    const dateScale = d3.scaleTime()
                        .domain([helper.createLocalDate(dateExtent[0]), helper.createLocalDate(dateExtent[1])])
                        .range([0, innerWidth])

    // Calculer le scale sur l'axe vertical
    const montantScale = d3.scaleLinear()
                            .domain([0, d3.max(groupedData, d => d.value)])
                            .range([innerHeight, 0])

    // Dessiner l'axe horizontal
    selection.selectAll('.viz1-axis-x')
        .data([null])
        .join('g')
            .attr('class', 'viz1-axis-x')
            .call(d3.axisBottom(dateScale))
            .attr('transform', `translate(${margin.left}, ${innerHeight + margin.top - 10})`)

    // Dessiner l'axe vertical
    selection.selectAll('.viz1-axis-y')
        .data([null])
        .join('g')
            .attr('class', 'viz1-axis-y')
            .call(d3.axisLeft(montantScale)
                .ticks(5))
            .attr('transform', `translate(${margin.left}, ${margin.top - 10})`)

    selection.selectAll('.viz1-axis-y .tick line')
        .attr('x2', innerWidth)

    // Création du groupe qui contient le graph
    const gData = selection.selectAll('.viz1-g-data')
        .data([null])
        .join('g')
            .attr('class', 'viz1-g-data')
            .attr('transform', `translate(${margin.left}, ${margin.top - 10})`)

    // Dessiner le tooltip
    const getTipContent = d => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return `
            <p id="viz1-tooltip-title">${helper.createLocalDate(+d.key).toLocaleDateString('fr-CA', options)}</p>
            <p class="viz1-tooltip-value"><strong>Montants : </strong>${d.value}</p>
        `
    }

    const tooltip = d3Tip().attr('class', 'd3-tip').html(getTipContent)
    selection.call(tooltip)

    // Dessiner les bandes
    const diffDays = helper.getDaysBetweenDates(dateScale.domain()[1], dateScale.domain()[0]) + 1
    const dayWidth = innerWidth / diffDays
    gData.selectAll('.viz1-data')
        .data(groupedData)
        .join('rect')
            .attr('class', 'viz1-data')
            .attr('height', d => innerHeight - montantScale(d.value))
            .attr('width', dayWidth)
            .attr('y', d => montantScale(d.value))
            .attr('x', d => dayWidth * helper.getDaysBetweenDates(helper.createLocalDate(+d.key), dateScale.domain()[0]))
            .attr('fill', d => {
                const day = helper.createLocalDate(+d.key).getDay()
                if (day === 0 || day === 6)
                    return '#9FBBCC' // Jours de fin de semaine
                return '#4059AD' // Jours de semaine
            })
            .attr('opacity', d => {
                const date = helper.createLocalDate(+d.key)
                if (date < dateFilter[0] || date > (dateFilter[1]))
                    return 0.3 // Lorsqu'à l'extérieur de l'interval de dates
                return 1 // Lorsque dans l'interval de dates
            })
            .on('mouseover', function(d, i) {
                if (!filterMinSelected && !filterMaxSelected)
                    tooltip.show(d, this)
            })
            .on('mouseout', tooltip.hide)

    // Dessiner les filtres de dates
    let filterMinSelected = false
    let filterMaxSelected = false
    const posMin = helper.getDaysBetweenDates(dateFilter[0], dateScale.domain()[0])
    const posMax = helper.getDaysBetweenDates(dateFilter[1], dateScale.domain()[1])
    const filtersOverflow = 5
    const minLine = gData.selectAll('.viz1-min-filter')
        .data([null])
        .join('line')
            .attr('class', 'viz1-min-filter')
            .attr('x1', dayWidth * posMin)
            .attr('x2', dayWidth * posMin)
            .attr('y1', -filtersOverflow)
            .attr('y2', innerHeight + filtersOverflow)
            .attr('stroke', 'black')
            .attr('stroke-width', 3)
            .on('mouseover', function() {
                if (!filterMinSelected)
                    d3.select(this).attr('stroke-width', 5)
            })
            .on('mouseout', function() {
                if (!filterMinSelected)
                    d3.select(this).attr('stroke-width', 3)
            })
            .on('mousedown', function() {
                filterMinSelected = true
                d3.select(this).attr('stroke', '#222')
            })

    const maxLine = gData.selectAll('.viz1-max-filter')
        .data([null])
        .join('line')
            .attr('class', 'viz1-max-filter')
            .attr('x1', dayWidth * (diffDays - posMax))
            .attr('x2', dayWidth * (diffDays - posMax))
            .attr('y1', -filtersOverflow)
            .attr('y2', innerHeight + filtersOverflow)
            .attr('stroke', 'black')
            .attr('stroke-width', 3)
            .on('mouseover', function() {
                if (!filterMaxSelected)
                    d3.select(this).attr('stroke-width', 5)
            })
            .on('mouseout', function() {
                if (!filterMaxSelected)
                    d3.select(this).attr('stroke-width', 3)
            })
            .on('mousedown', function() {
                filterMaxSelected = true
                d3.select(this).attr('stroke', '#222')
            })

    d3.select('body')
        .on('mouseup', function() {
            if(filterMinSelected){
                filterMinSelected = false
                minLine.attr('stroke', 'black')
                    .attr('stroke-width', 3)
                
                const newMinValue = helper.convertLocalDateToDateNumber(helper.addDays(dateScale.domain()[0], Math.round(+minLine.attr('x1') / dayWidth)))
                const newMaxValue = helper.convertLocalDateToDateNumber(dateFilter[1])
                setDateFilter(newMinValue, newMaxValue)
            }
            if(filterMaxSelected){
                filterMaxSelected = false
                maxLine.attr('stroke', 'black')
                    .attr('stroke-width', 3)
                
                const newMinValue = helper.convertLocalDateToDateNumber(dateFilter[0])
                const newMaxValue = helper.convertLocalDateToDateNumber(helper.addDays(dateScale.domain()[0], Math.round(+maxLine.attr('x1') / dayWidth) - 1))
                setDateFilter(newMinValue, newMaxValue)
            }
        })
        .on('mousemove', function() {
            if(filterMinSelected){
                const offset = Math.min(Math.max(0, Math.round(d3.mouse(gData.node())[0] / innerWidth * diffDays)), diffDays - posMax - 1)
                minLine.attr('x1', offset * dayWidth)
                    .attr('x2', offset * dayWidth)
            }
            if(filterMaxSelected){
                const offset = Math.max(Math.min(diffDays, Math.round(d3.mouse(gData.node())[0] / innerWidth * diffDays)), posMin + 1)
                maxLine.attr('x1', offset * dayWidth)
                    .attr('x2', offset * dayWidth)
            }
        })
            
}
