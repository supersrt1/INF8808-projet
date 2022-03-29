/* eslint-disable indent */

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
    
    selection.selectAll('text')
        .data([null])
        .join('text')
            .text('ICI LA VIZUALISATION 3')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'black')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight / 2)
}
