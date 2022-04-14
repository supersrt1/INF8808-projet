/* eslint-disable indent */
import * as preprocess from './../../scripts/preprocess.js'
import d3Tip from 'd3-tip'

let g_data = [];

const id = 'map';
//                      longitude, latitude
const default_center = [-73.98353, 45.76177];
const default_zoom = 15

const {map, svg} = createMap(id, default_center, default_zoom);

function createMap(id, center, zoom) {
    const map = L.map(id).setView([center[1], center[0]], zoom);

    /*const Stadia_OSMBright = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    })*/
    /*var Stamen_Toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
})*/
    var Stamen_TonerBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 13,
        maxZoom: 17,
        ext: 'png'
    }).addTo(map);

    L.svg().addTo(map);

    const overlay = d3.select(map.getPanes().overlayPane);
    const svg = overlay.select('svg')
        .attr('id', "map-svg")
        .attr("pointer-events", "auto");

    //DomUtil.addClass(svg, 'leaflet-interactive');

    return {map, svg};
}


export function updateData(filteredData) {
    // Optional, for performance
    //g_data = preprocess.aggregatePonctualite(filteredData.byLineDirectionDateStop, ['arret_code'])
}

export const viz = (selection, props) => {
    const {
        data,
        render
    } = props

    //setInterval(()=>console.log(map.getZoom()), 1000);

    const groupedData = d3.nest()
                        .key(d=> d.arret_code)
                        .rollup(v => { return {cumulatif: d3.sum(v, d => d.montants), lon: v[0].arret_Longitude, lat: v[0].arret_Latitude}})
                        .entries(data.byLineDirectionDateStop);
                        
    console.log("DATA", groupedData);

    groupedData.forEach((v)=> {
        v.value.area = Math.sqrt(v.value.cumulatif/Math.PI)
    });

    const getTipContent = d => {
        return `
            <p id="viz1-tooltip-title"></p>
            <p class="viz1-tooltip-value"><strong>Montants : </strong></p>
        `
    }

    /*const tooltip = d3Tip().attr('class', 'd3-tip').html(getTipContent)
    svg.call(tooltip)*/

    const circles = svg.selectAll('#circles')
    .data([null])
    .join('g')
    .attr('id', 'circles');

    const points = circles.selectAll('circle')
        .data(groupedData)
        .join('circle')
        // Math.pow(2, (map.getZoom()-10))
        .attr('r', d=>d.value.area)
        .attr("cx", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).x)
        .attr("cy", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).y)
        .attr("fill", "blue")
        .attr("opacity", 0.60)
        .attr("stroke", "white")
        .attr("stroke-width", 0.2)
        .attr("pointer-events", "visible")
        .on("mouseover", function(d){
            /*console.log(d)
            tooltip.show(d, this);
            console.log(this.getBoundingClientRect())
            const bbox = this.getBoundingClientRect();
            tooltip
            .style("top", (bbox.top+ tbbox.height)+"px")
            .style("left",(bbox.x-tbbox.width)+"px")*/
            d3.select(this).attr("fill", "red");})
        .on("mouseout", function(){
            //tooltip.hide();
            d3.select(this).attr("fill", "blue");});

    const update = () => points
        .attr('r', d=>d.value.area)
        .attr("stroke-width", 0.2)
        .attr("cx", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).x)
        .attr("cy", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).y);

    map.on("move", update);


    

    /*
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
            .text('ICI LA VIZUALISATION 2')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'black')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight / 2)
    */
}
