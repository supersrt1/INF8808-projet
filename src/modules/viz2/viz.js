/* eslint-disable indent */
import * as preprocess from './../../scripts/preprocess.js'
import d3Tip from 'd3-tip'

let g_data = [];

const id = 'map';
//                      longitude, latitude
const default_center = [-73.98353, 45.76177];
const default_zoom = 12

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
    const Stamen_TonerBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 10,
        maxZoom: 16,
        ext: 'png'
    }).addTo(map);

    L.svg().addTo(map);

    const legend = L.control({position: 'topright'})
    legend.onAdd = (map) => {
        return L.DomUtil.create('svg', 'viz2-legend')
    }
    legend.addTo(map);

    const overlay = d3.select(map.getPanes().overlayPane);
    const svg = overlay.select('svg')
        .attr('id', "map-svg")
        .attr("pointer-events", "auto");

    return {map, svg};
}


export function updateData(filteredData) {
    // Optional, for performance
    //g_data = preprocess.aggregatePonctualite(filteredData.byLineDirectionDateStop, ['arret_code'])
}

function makeLegend(){
    const LEGEND_WIDTH = 150;
    const LEGEND_HEIGHT = 50;
    const legendSvg = d3.select(".viz2-legend")
        .style('width', LEGEND_WIDTH+'px')
        .style('height', LEGEND_HEIGHT+'px');
    legendSvg.selectAll('#background')
        .data([null])
        .join('rect')
        .attr('id', 'background')
        .attr('width', LEGEND_WIDTH)
        .attr('height', LEGEND_HEIGHT)
        .attr('fill', 'white')
    legendSvg.selectAll('#title')
        .data([null])
        .join('text')
        .attr('id', 'title')
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'middle')
        .attr('fill', 'black')
        .text("LEGEND")
}

export const viz = (selection, props) => {
    const {
        data,
        render
    } = props

    //setInterval(()=>console.log(map.getZoom()), 1000);

    const groupedData = d3.nest()
                        .key(d=> d.arret_code)
                        .rollup(v => { return {name: v[0].arret_nom, cumulatif: d3.sum(v, d => d.montants), lon: v[0].arret_Longitude, lat: v[0].arret_Latitude}})
                        .entries(data.byLineDirectionDateStop);
                        
    //console.log("DATA", groupedData);

    groupedData.forEach((v)=> {
        v.value.area = Math.sqrt(v.value.cumulatif/Math.PI)
    });

    // LEGEND
    makeLegend();
    

    const getTipContent = d => {
        return `
            <p id="viz1-tooltip-title">${d.value.name}</p>
            <p class="viz1-tooltip-value"><strong>Montants: ${d.value.cumulatif} </strong></p>
        `
    }
    const tooltip = d3Tip().attr('class', 'd3-tip').html(getTipContent)
    svg.call(tooltip)

    // POINTS

    const minMax = d3.extent(groupedData, d => d.value.cumulatif)
    const rscale = d3.scaleSqrt().domain(minMax).range([2, 30]);

    const circles = svg.selectAll('#circles')
    .data([null])
    .join('g')
    .attr('id', 'circles');

    const points = circles.selectAll('circle')
        .data(groupedData)
        .join('circle')
        .attr('r', d=> Math.pow(2, (map.getZoom()-default_zoom)) * rscale(d.value.cumulatif))
        .attr("cx", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).x)
        .attr("cy", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).y)
        .attr("fill", "blue")
        .attr("opacity", 0.60)
        .attr("stroke-width", 0)
        .attr("pointer-events", "auto")
        .on("mouseover", function(d){
            tooltip.show(d, this);
            d3.select(this).attr("fill", "red");})
        .on("mouseout", function(){
            tooltip.hide();
            d3.select(this).attr("fill", "blue");});

    const update = () => points
        .attr('r', d=> Math.pow(2, (map.getZoom()-default_zoom)) * rscale(d.value.cumulatif))
        .attr("cx", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).x)
        .attr("cy", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).y);

    map.on("move", update);
}
