var width = window.innerWidth;
var height = window.innerHeight;

var svg  = d3.select('body')
             .append('svg')
             .attr("width", width)
             .attr("height", height);

var streets = svg.append("g");

var projection = d3.geo.albers()
    .translate([width/2, height/2]);

var geoPath = d3.geo.path()
    .projection(projection);

streets.selectAll("path")
    .data("streets.json")
    .enter()
    .append( "path" )
    .attr( "fill", "#ccc" )
    .attr( "d", geoPath );