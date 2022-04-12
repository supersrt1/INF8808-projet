/* eslint-disable indent */
import * as helper from './../../scripts/helper.js'

import * as d3Chromatic from 'd3-scale-chromatic'
import d3Tip from 'd3-tip'

let dataViz4 = []

export function updateData(filteredData) {

    dataViz4 = filteredData.byLineDirectionDateStop

    // Add day of the week
    let days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    dataViz4.forEach(element => {
        let date = helper.createLocalDate(element.date_number)
        element['day'] = days[date.getDay()]
    });

    // Remove FE
    dataViz4 = dataViz4.filter(d => d.periode_horaire != "FE")

}

export const viz = (selection, props) => {
    const {
        mode,
        data,
        render
    } = props

    const {
        width,
        height
    } = selection.node().getBoundingClientRect()

    /* 
        INIT
    */

    // Set dimensions
    const margin = { top: 20, right: 20, bottom: 0, left: 80 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Set time labels
    const periodeHoraire = ["AM", "interpointe", "PM", "Soir/Nuit/Matin"]
    const dayOfTheWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

    /* 
        DATA
    */

    // Filter data using `Etat_Ponctualite`
    let dataToUse = []
    if (mode == "in advance"){
        dataToUse = dataViz4.filter(d => d.Etat_Ponctualite == "Avance")
    } else {
        dataToUse = dataViz4.filter(d => d.Etat_Ponctualite == "Retard")
    }

    // Get counts for `dataToUse` (only advance/late filtered data)
    let heatmapData = d3.nest()
    .key(d => d.day)
    .key(d => d.periode_horaire)
    .rollup(leaves => leaves.length)
    .entries(dataToUse)
    .flatMap(value => {
      return value.values.map(nestedValue => {
        return {
            day: value.key,
            periode_horaire: nestedValue.key,
          Counts: parseInt(nestedValue.value)
        }
      })
    })

    // Get counts for `dataViz4` (all filtered data)
    let allHeatmapData = d3.nest()
    .key(d => d.day)
    .key(d => d.periode_horaire)
    .rollup(leaves => leaves.length)
    .entries(dataViz4)
    .flatMap(value => {
      return value.values.map(nestedValue => {
        return {
            day: value.key,
            periode_horaire: nestedValue.key,
          Counts: parseInt(nestedValue.value)
        }
      })
    })

    // Add missing data
    periodeHoraire.forEach(periode => {
        dayOfTheWeek.forEach(day => {
            if (allHeatmapData.filter(e => e.periode_horaire === periode && e.day === day).length === 0){
                allHeatmapData.push({
                    day: day,
                    periode_horaire: periode,
                    Counts: 0
                })
            }
        })
    })

    periodeHoraire.forEach(periode => {
        dayOfTheWeek.forEach(day => {
            if (heatmapData.filter(e => e.periode_horaire === periode && e.day === day).length === 0){
                heatmapData.push({
                    day: day,
                    periode_horaire: periode,
                    Counts: 0
                })
            }
        })
    })

    // Get advance/late frequencies
    heatmapData.forEach((element) => {
        let totalCount = allHeatmapData.filter(d => d.periode_horaire == element.periode_horaire && d.day == element.day)[0].Counts
        element.Counts = totalCount !== 0 ? (element.Counts/totalCount).toFixed(3) : 0
    })

    /* 
        SCALES
    */

    // Color scale
    var colorScale = d3.scaleSequential(mode == "in advance" ? d3Chromatic.interpolateGreens : d3Chromatic.interpolateReds)
    colorScale
        .domain(d3.extent(heatmapData, d => d.Counts))

    // X and Y scales
    const xScale = d3.scaleBand().padding(0.02) 
    const yScale = d3.scaleBand().padding(0.02) 

    xScale
        .domain(dayOfTheWeek)
        .range([margin.left, innerWidth])

    yScale
        .domain(periodeHoraire)
        .range([margin.top, innerHeight])
    
    /* 
        TOOLTIP
    */
    const getTipContent = d => {
        return `
            <p class="viz4-tooltip-value">${d.Counts !== 0 ? d.Counts : 'no data'}</p>
        `
    }

    const tooltip = d3Tip().attr('class', 'd3-tip').html(getTipContent)
        selection.call(tooltip)
    
    /* 
        HEATMAP
    */

    selection.selectAll('.viz4-graph')
    .data([null])
    .join('g')
        .attr('class', 'viz4-graph')
    
    selection.select('.viz4-graph').selectAll('.viz4-element')
    .data(heatmapData)
    .join('rect')
        .attr('class', 'viz4-element')
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('x', d => xScale(d.day))
        .attr('y', d => yScale(d.periode_horaire))
        .attr('fill', d => d.Counts !== 0 ? colorScale(d.Counts) : "gray")
        .on('mouseover', function(d, i) {
            tooltip.show(d, this)
        })
        .on('mouseout', tooltip.hide)

    /* 
        AXIS
    */

    var axis = selection.selectAll('.viz4-axis')
    .data([null])
    .join('g')
        .attr('class', 'viz4-axis')

    // x axis
    const xAxis = d3.axisTop()
        .scale(xScale)
        .tickSize(0)

    axis.selectAll('.xaxis')
        .data([null])
        .join('g')
            .attr('transform', `translate(0, ${margin.top})`)
            .attr('class', 'xaxis')
            .call(xAxis)
            .call(g => g.select(".domain").remove())

    // y axis
    const yAxis = d3.axisLeft()
        .scale(yScale)
        .tickSize(0)

    axis.selectAll('.yaxis')
        .data([null])
        .join('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .attr('class', 'yaxis')
            .call(yAxis)
            .call(g => g.select(".domain").remove())

    /* 
        LEGEND
    */

    var legend = selection.selectAll('.viz4-legend')
    .data([null])
    .join('g')
        .attr('class', 'viz4-legend')

    // init gradient 
    var defs = legend.selectAll('.defs')
        .data([null])
        .join('g')
        .attr('class', 'defs')
    
    const linearGradient = defs
        .selectAll('linearGradient')
        .data([null])
        .join('linearGradient')
            .attr('id', mode == "in advance" ? 'gradientA' : 'gradientB')
            .attr('x1', 0).attr('y1', 1).attr('x2', 0).attr('y2', 0)
    
    linearGradient.selectAll('stop')
        .data(colorScale.ticks().map((tick, i, nodes) => (
        {
            offset: `${100 * (i / nodes.length)}%`,
            color: colorScale(tick)
        })))
        .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color)
      
    // init legend bar
    var legendBar = legend.selectAll('.legend-bar')
        .data([null])
        .join('rect')
            .attr('class', 'legend-bar')
      
      
    // init legend axis
    var legendAxisSelection = legend.selectAll('.legend-axis')
        .data([null])
        .join('g')
            .attr('class', 'legend-axis')
      
      
    // Draw legend 
    const x = margin.left + innerWidth - 30
    const y = margin.top 
    const fill = `url(#${mode == "in advance" ? 'gradientA' : 'gradientB'})`
    const legendWidth = margin.right
    const legendHeight = innerHeight - 20

    legendBar
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('x', x)
        .attr('y', y)
        .attr('fill', fill)
    
    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([legendHeight, 0])
    
    const legendAxis = d3.axisLeft()
        .scale(legendScale)
        .ticks(7)
    
    legendAxisSelection
        .attr('transform', `translate(${x}, ${y})`)
        .call(legendAxis)
        .call(g => g.select(".domain").remove())    
}
