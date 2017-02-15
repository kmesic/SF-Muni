var margin = 10;

var width = window.innerWidth;
var height = window.innerHeight;

width -= margin - margin;
var scaleRatio = 270000/1587;

var center = [-122.433701, 37.767683];

var neighborhoodsStyle = {
    "fill": "#f93",
    "stroke": "black",
    "stroke-width": "1"
}

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomMap);

// Create svg for the map
var svg  = d3.select("body")
             .append("svg")
             .attr("id", "sf-map")
             .attr("viewBox", "0 0 " + width + " " + height )
             .attr("preserveAspectRatio", "xMinYMin");

// Create tooltip for neighborhoods
var tooltip = d3.select('body')
                .append('div')
                .attr('class', 'hide tooltip');

var geoPath, projection;

var mapData = [];

function zoomMap() {
    for (var i = 0; i < mapData.length; i++)  {
        mapData[i].attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
}

createMap();
function createMap() {
    projection = d3.geo.mercator()
        .scale(width * scaleRatio)
        .center(center)
        .translate([width /2, height /1.9]);

    geoPath = d3.geo.path()
        .projection(projection);

    d3.json("sfmaps/neighborhoods.json", function(data) {
        var map = addData(data.features, "neighborhood");
        map.attr("id", function(d) {
            return d.properties.neighborho.replace(/[ \\/]/g, '');
        });
        map.on('mousemove', function(currData) {
                var mouse = d3.mouse(svg.node()).map(function(loc) {
                    return parseInt(loc);
                });
                tooltip.classed('hide', false)
                    .attr('style', 'left:' + (mouse[0] + 15) +
                      'px; top:' + (mouse[1] - 35) + 'px')
                    .html(currData.properties.neighborho);
            })
            .on('mouseout', function() {
                    tooltip.classed('hide', true);
            });
    });

    d3.json("sfmaps/streets.json", function(data) {
        function addStreetClass(d) {
            return "streets " + d.properties.STREETNAME.replace(/ /g,'');
        }
        var map = addData(data.features, addStreetClass);
        map.on('mousemove', function(currData) {
                var mouse = d3.mouse(svg.node()).map(function(loc) {
                    return parseInt(loc);
                });

                d3.select("#" + currData.properties.NHOOD.replace(/[ \\/]/g, ''))
                   .classed('showNHOOD', true);

                tooltip.classed('hide', false)
                    .attr('style', 'left:' + (mouse[0] + 15) +
                      'px; top:' + (mouse[1] - 35) + 'px')
                    .html(currData.properties.NHOOD);
            })
            .on('mouseout', function(currData) {
                    tooltip.classed('hide', true);
                    d3.select("#" + currData.properties.NHOOD.replace(/[ \\/]/g, ''))
                      .classed('showNHOOD', false);
            });

        d3.json("sfmaps/freeways.json", function(data) {
            addData(data.features, "freeways");
        });
    });

    d3.json("sfmaps/arteries.json", function(data) {
        var map = addData(data.features, "arteries");
    });


    svg.call(zoom) 
       .call(zoom.event);
}


function addData(data, dataName) {
    var g = svg.append("g");
    mapData.push(g);

    return g.selectAll("path")
            .data(data)
            .enter()
            .append( "path" )
            .attr( "d", geoPath )
            .attr("class", dataName);
}