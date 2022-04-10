import * as colors from './../../scripts/colors.js'
import * as helper from './../../scripts/helper.js'
import * as preprocess from './../../scripts/preprocess.js'

/* eslint-disable indent */

let viz3Data = []

export function updateData(filteredData) {
    viz3Data = preprocess.aggregatePonctualite(filteredData.byLineDirectionDateStop, ['arret_nom'])
}

export const viz = (selection, props) => {
    const {
        data,
        render
    } = props

    const {
        width,
        height
    } = selection.node().getBoundingClientRect()

    const yAxisWidth = 15
    const xAxisHeight = 15
    const xAxisWidth = 15
    const margin = { top: 10, right: 10 + xAxisWidth, bottom: 10 + xAxisHeight, left: 10 + yAxisWidth }

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom


    const xScale = d3.scaleBand()
        .domain(helper.getUniqueValues(viz3Data, 'sequence_arret'))
        .range([margin.left, width - margin.right])
        .paddingInner(0.1)
    const yScale = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([0, innerHeight])
    const yScaleAxis = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([innerHeight, 0])

    const yAxis = d3.axisLeft()
        .scale(yScaleAxis)
        .tickValues([0.25, 0.5, 0.75])
        .tickSizeOuter(0)
        .tickFormat("")
    
    selection.selectAll('.viz3-graph')
        .data([null])
        .join('g')
            .attr('class', 'viz3-graph')
    
    selection.select('.viz3-graph').selectAll('.ylabel')
        .data([null])
        .join('text')
            .text('%')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('x', margin.left - yAxisWidth)
            .attr('y', margin.top)
            .attr('class', 'ylabel')
    
    selection.select('.viz3-graph').selectAll('.xlabel')
        .data([null])
        .join('text')
            .text('Arrêts')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('x', width - margin.right)
            .attr('y', height - xAxisHeight)
            .attr('class', 'xlabel')
    
    selection.select('.viz3-graph').selectAll('.yaxis')
        .data([null])
        .join('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .attr('class', 'yaxis')
            .call(yAxis)
    
    selection.select('.viz3-graph').selectAll('.viz3-element-avance')
        .data(viz3Data)
        .join('rect')
            .attr('class', 'viz3-element-avance')
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d['taux_Avance']))
            .attr('x', d => xScale(d['sequence_arret']))
            .attr('y', d => margin.top)
            .attr('fill', colors.TAUX_AVANCE)
    
    selection.select('.viz3-graph').selectAll('.viz3-element-ponctuel')
        .data(viz3Data)
        .join('rect')
            .attr('class', 'viz3-element-ponctuel')
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d['taux_Ponctuel']))
            .attr('x', d => xScale(d['sequence_arret']))
            .attr('y', d => (height - margin.bottom) - (yScale(d['taux_Ponctuel'] + d['taux_Retard'])))
            .attr('fill', colors.TAUX_PONCTUEL)
    
    selection.select('.viz3-graph').selectAll('.viz3-element-retard')
        .data(viz3Data)
        .join('rect')
            .attr('class', 'viz3-element-retard')
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d['taux_Retard']))
            .attr('x', d => xScale(d['sequence_arret']))
            .attr('y', d => (height - margin.bottom) - yScale(d['taux_Retard']))
            .attr('fill', colors.TAUX_RETARD)
    
}
