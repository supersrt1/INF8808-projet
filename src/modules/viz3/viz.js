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

    const margin = { top: 10, right: 10, bottom: 10, left: 10 }

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    /*
    selection.selectAll('text')
        .data([null])
        .join('text')
            .text('ICI LA VIZUALISATION 3')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'black')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight / 2)
    */
    
    const xScale = d3.scaleBand()
        .domain(helper.getUniqueValues(viz3Data, 'sequence_arret'))
        .range([margin.left, width - margin.right])
        .paddingInner(0.1)
    const yScale = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([0, innerHeight])
    
    selection.selectAll('.viz3-graph')
        .data([null])
        .join('g')
            .attr('class', 'viz3-graph')
    
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
