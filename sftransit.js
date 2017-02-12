var margin = 10;

var width = window.innerWidth;
var height = window.innerHeight;

width -= margin - margin;
var scaleRatio = 270000/1587;

var center = [-122.433701, 37.767683];

// Create svg for the map
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomMap);

var svg  = d3.select("body")
             .append("svg")
             .attr("id", "sf-map")
             .attr("viewBox", "0 0 " + width + " " + height )
             .attr("preserveAspectRatio", "xMinYMin");

var g = svg.append("g");


function zoomMap() {
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

d3.json("sfmaps/neighborhoods.json", createMap);

function createMap(data) {
    var projection = d3.geo.mercator()
        .scale(width * scaleRatio)
        .center(center)
        .translate([width /2, height /1.9]);

    var geoPath = d3.geo.path()
        .projection(projection);


    g.selectAll("path")
        .data(data.features)
        .enter()
        .append( "path" )
        .attr( "d", geoPath )
        .style( "fill", "#f93" )
        .style("stroke", "black")
        .style("stroke-width", 1);

    svg.call(zoom) 
       .call(zoom.event);
}