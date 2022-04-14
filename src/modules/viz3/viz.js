import * as colors from './../../scripts/colors.js'
import * as helper from './../../scripts/helper.js'
import * as preprocess from './../../scripts/preprocess.js'
import d3Tip from 'd3-tip'

/* eslint-disable indent */

let viz3Data = []

export function updateData(filteredData) {
    viz3Data = preprocess.aggregatePonctualite(filteredData.byLineDirectionDate, ['arret_nom'])
    viz3Data.sort((a, b) => a['sequence_arret'] - b['sequence_arret'])
}

export const viz = (selection, props) => {
    const {
        data,
        stop,
        ALL_STOPS,
        render
    } = props

    const {
        width,
        height
    } = selection.node().getBoundingClientRect()

    const margin = { top: 10, right: 10, bottom: 25, left: 30 }

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom


    const xScale = d3.scaleBand()
        .domain(helper.getUniqueValues(viz3Data, 'arret_nom'))
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
            .attr('x', margin.left / 2)
            .attr('y', margin.top + innerHeight / 2)
            .attr('class', 'ylabel')
    
    const arret = stop == ALL_STOPS ? 'Arrêts' : stop
    selection.select('.viz3-graph').selectAll('.xlabel')
        .data([null])
        .join('text')
            .text(arret)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('x', margin.left + innerWidth / 2)
            .attr('y', height - margin.bottom / 2)
            .attr('class', 'xlabel')
    
    selection.select('.viz3-graph').selectAll('.yaxis')
        .data([null])
        .join('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .attr('class', 'yaxis no-line')
            .call(yAxis)
    

    const tooltip = d3Tip().attr('class', 'd3-tip').html(getToolTipHTML)
    selection.call(tooltip)
    
    selection.select('.viz3-graph').selectAll('.viz3-element-avance')
        .data(viz3Data)
        .join('rect')
            .attr('class', 'viz3-element-avance')
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d['taux_Avance']))
            .attr('x', d => xScale(d['arret_nom']))
            .attr('y', d => margin.top)
            .attr('fill', colors.TAUX_AVANCE_VIZ3)
            .attr('opacity', function(d) {
                if (d['arret_nom'] != stop && stop != ALL_STOPS)
                    return OPACITY_UNSELECTED
                return 1
            })
            .on('mouseover', function(d) {
                tooltip.show(d, this)
            })
            .on('mouseout', tooltip.hide)
    
    selection.select('.viz3-graph').selectAll('.viz3-element-ponctuel')
        .data(viz3Data)
        .join('rect')
            .attr('class', 'viz3-element-ponctuel')
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d['taux_Ponctuel']))
            .attr('x', d => xScale(d['arret_nom']))
            .attr('y', d => (height - margin.bottom) - (yScale(d['taux_Ponctuel'] + d['taux_Retard'])))
            .attr('fill', colors.TAUX_PONCTUEL_VIZ3)
            .attr('opacity', function(d) {
                if (d['arret_nom'] != stop && stop != ALL_STOPS)
                    return OPACITY_UNSELECTED
                else if (d['arret_nom'] == stop)
                    tooltip.show(d, this)
                return 1
            })
            .on('mouseover', function(d) {
                tooltip.show(d, this)
            })
            .on('mouseout', tooltip.hide)
    
    selection.select('.viz3-graph').selectAll('.viz3-element-retard')
        .data(viz3Data)
        .join('rect')
            .attr('class', 'viz3-element-retard')
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d['taux_Retard']))
            .attr('x', d => xScale(d['arret_nom']))
            .attr('y', d => (height - margin.bottom) - yScale(d['taux_Retard']))
            .attr('fill', colors.TAUX_RETARD_VIZ3)
            .attr('opacity', function(d) {
                if (d['arret_nom'] != stop && stop != ALL_STOPS)
                    return OPACITY_UNSELECTED
                return 1
            })
            .on('mouseover', function(d) {
                tooltip.show(d, this)
            })
            .on('mouseout', tooltip.hide)
    
}

function getToolTipHTML(d) {
    let keyValues = (
        getKeyValue('Avance', (d.taux_Avance * 100.0).toFixed(2), colors.TAUX_AVANCE_VIZ3) +
        getKeyValue('Ponctuel', (d.taux_Ponctuel * 100.0).toFixed(2), colors.TAUX_PONCTUEL_VIZ3) +
        getKeyValue('Retard', (d.taux_Retard * 100.0).toFixed(2), colors.TAUX_RETARD_VIZ3)
    )
    
    return `
        <p class="viz3-tooltip-value"><strong></strong>${d.arret_nom}</p>
        <table>
            <tr>
                <td><p class="viz3-tooltip-value"><strong>Séquence</strong></p></td>
                <td><p class="viz3-tooltip-value"> : ${d['sequence_arret']}</p></td>
            </tr>
            ${keyValues}
        </table>
    `
}

function getKeyValue(key, value, color) {
    return `<tr>
        <td><p class="viz3-tooltip-value"><strong><span style="color:${color};">${key}</span></td>
        <td><p class="viz3-tooltip-value"> : ${value} %</td>
    </tr>`
}

const OPACITY_UNSELECTED = 0.3
