/* eslint-disable indent */
import * as preprocess from './../../scripts/preprocess.js'
import d3Tip from 'd3-tip'

let g_data = [];

const MAP_ID = 'map';
//                      longitude, latitude
const DEFAULT_CENTER = [-73.98353, 45.76177];
const DEFAULT_ZOOM = 12;
const MIN_ZOOM = 10;
const MAX_ZOOM = 16;

const {map, svg} = createMap(MAP_ID, DEFAULT_CENTER, DEFAULT_ZOOM);

function createMap(id, center, zoom) {
    const map = L.map(id).setView([center[1], center[0]], zoom);

    // Other map tiles that could be used to change esthetic.
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
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        ext: 'png'
    }).addTo(map);

    L.svg().addTo(map);

    /*const legend = L.control({position: 'topright'})
    legend.onAdd = (map) => {
        return L.DomUtil.create('svg', 'viz2-legend123')
    }
    legend.addTo(map);*/

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

function makeLegend(rscale){
    const LEGEND_WIDTH = 250;
    const LEGEND_HEIGHT = 75;
    const legendSvg = d3.select("#viz2-legend")
    //.attr('width', LEGEND_WIDTH)
    //.attr('height', LEGEND_HEIGHT)
    .style('width', LEGEND_WIDTH+'px')
    .style('height', LEGEND_HEIGHT+'px')
    .style('background-color', 'white');

    legendSvg.selectAll('#title')
    .data([null])
    .join('text')
    .attr('id', 'title')
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'top')
    .attr('fill', 'black')
    .attr('font-weight', 'bolder')
    .attr('x', 5)
    .attr('y', 17)
    .text("Légende")

    const g = legendSvg.selectAll('g')
        .data([null])
        .join('g')

    const {
        width,
        height
    } = legendSvg.node().getBoundingClientRect()

    const SCALES = [100, 1000, 10000]

    const CELL_SIZE = width/ SCALES.length;

    const points = g.selectAll('circle')
        .data(SCALES)
        .join('circle')
        .attr('r', d =>  rscale(d))
        .attr("cx", (d,i) => CELL_SIZE * (i) + CELL_SIZE/2)
        .attr("cy", (d,i) => 33.5)
        .attr("fill", "blue")
        .attr("opacity", 0.70)
        .attr("stroke-width", 0)

    g.selectAll('text')
        .data(SCALES)
        .join('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'top')
        .attr('x', (d, i) => CELL_SIZE * (i) + CELL_SIZE/2)
        .attr('y', (d) => 62.35)
        .text(d=>d)


    const update = () => points
        .attr('r', d=> Math.pow(2, (map.getZoom()-DEFAULT_ZOOM)) * rscale(d))

    return update;

    
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
    
    // Sort to have a better draw order
    groupedData.sort((a, b)=> b.value.cumulatif - a.value.cumulatif)                    
    //console.log("DATA", groupedData);
/*
    groupedData.forEach((v)=> {
        v.value.area = Math.sqrt(v.value.cumulatif/Math.PI)
    });*/
    
    // TOOLTIP
    const getTipContent = d => {
        return `
            <p id="viz1-tooltip-title">${d.value.name}</p>
            <p class="viz1-tooltip-value"><strong>Montants: ${d.value.cumulatif} </strong></p>
        `
    }
    const tooltip = d3Tip().attr('class', 'd3-tip').html(getTipContent)
    svg.call(tooltip)

    // SCALE
    const minMax = d3.extent(groupedData, d => d.value.cumulatif)
    const rscale = d3.scaleSqrt().domain(minMax).range([2, 30]);

    // LEGEND
    const legendUpdate = makeLegend(rscale);

    // POINTS
    const circles = svg.selectAll('#circles')
    .data([null])
    .join('g')
    .attr('id', 'circles');

    const points = circles.selectAll('circle')
        .data(groupedData)
        .join('circle')
        .attr('r', d=> rscale(d.value.cumulatif))
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
        //.attr('r', d=> Math.pow(2, (map.getZoom()-DEFAULT_ZOOM)) * rscale(d.value.cumulatif))
        .attr("cx", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).x)
        .attr("cy", d => map.latLngToLayerPoint([d.value.lat, d.value.lon]).y);

    map.on("move", update);
    //map.on("move", legendUpdate);
}
