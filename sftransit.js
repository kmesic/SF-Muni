// GLOBALS
var init = true;
var margin = 10;

var width = window.innerWidth;
var height = window.innerHeight;

width -= margin - margin;
// Scale Ratio constant used for display on multiple devices
var scaleRatio = 270000/1587;

// Center is the coordinates of SF
var center = [-122.433701, 37.767683];

// Refresh rate of updating vehicles
var refreshVehicles = 10000;

// On zoom and pan scale the map
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

// Globals for projection calculation
var geoPath, projection;

// All different types of data so that zoom can properly adjust each one
var mapData = [];

var vehiclesG = {};

// When the user zooms, go through all the different data types 
// (neighboorhoods, streets, arteries, and freeways) and scale appropriately
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
        map.on('mouseenter', function(currData) {
                /*var mouse = d3.mouse(svg.node()).map(function(loc) {
                    return parseInt(loc);
                });
                tooltip.classed('hide', false)
                    .attr('style', 'left:' + (mouse[0] + 15) +
                      'px; top:' + (mouse[1] - 35) + 'px')
                    .html(currData.properties.neighborho);*/
            })
            .on('mouseleave', function() {
                   // tooltip.classed('hide', true);
            });
    });

    d3.json("sfmaps/streets.json", function(data) {
        function addStreetClass(d) {
            return "streets " + d.properties.STREETNAME.replace(/ /g,'');
        }
        var map = addData(data.features, addStreetClass);
        map.on('mousemove', function(currData) {
                /*var mouse = d3.mouse(svg.node()).map(function(loc) {
                    return parseInt(loc);
                });

                d3.select("#" + currData.properties.NHOOD.replace(/[ \\/]/g, ''))
                   .classed('showNHOOD', true);

                tooltip.classed('hide', false)
                    .attr('style', 'left:' + (mouse[0] + 15) +
                      'px; top:' + (mouse[1] - 35) + 'px')
                    .html(currData.properties.NHOOD);*/
            })
            .on('mouseout', function(currData) {
                    /*tooltip.classed('hide', true);
                    d3.select("#" + currData.properties.NHOOD.replace(/[ \\/]/g, ''))
                      .classed('showNHOOD', false);*/
            });

        d3.json("sfmaps/freeways.json", function(data) {
            addData(data.features, "freeways");
        });

        getRoutes();

        setInterval(function() {
            init = false;
            for (var id in routes) {
                if (routes.hasOwnProperty(id)) {
                    getVehicleInfo(id);
                }
            }
        },refreshVehicles);

    });

   /* d3.json("sfmaps/arteries.json", function(data) {
        var map = addData(data.features, "arteries");
    });*/


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

function drawRoute(paths, route, color) {
    
    var g = svg.append("g")
               .attr("id", "route" + route)
               .attr("class", "routepath")
               .attr("style", "stroke:#" + color + ";")
               .attr("stroke-width", 2);
    
    mapData.push(g);

    var currPoints = [];
    paths.forEach(function(path, index) {
        var points = path.children;
        var newPoints = [];
        for (var i = 0; i < points.length - 1; i++) {            
            currPoints.push({
                type: "LineString",
                properties: {title: routes[route].title},
                coordinates: [
                    [points[i].getAttribute("lon"), points[i].getAttribute("lat")],
                    [points[i + 1].getAttribute("lon"), points[i + 1].getAttribute("lat")],
                ]
            });
        }

        g.selectAll("path")
         .data(currPoints)
         .enter()
         .append( "path" )
         .attr( "d", geoPath )
         .on('mouseenter', function(currData) {
                var mouse = d3.mouse(svg.node()).map(function(loc) {
                    return parseInt(loc);
                });

                var curr = d3.select(this).node();
                d3.select(curr.parentNode).transition().duration(200).attr("stroke-width", 4);

                tooltip.classed('hide', false)
                    .attr('style', 'left:' + (mouse[0] + 15) +
                      'px; top:' + (mouse[1] - 35) + 'px')
                    .html(currData.properties.title);
         })
         .on('mouseleave', function(currData) {
                tooltip.classed('hide', true);

                var curr = d3.select(this).node();
                d3.select(curr.parentNode).transition().duration(500).attr("stroke-width", 2);

         });;
    });
}

function drawVehicles(vehicles, route) {
    var data = [];
    for (var id in vehicles) {
        if (vehicles.hasOwnProperty(id)) {
            data.push(vehicles[id]);
        }
    }

    if (init == true) {
        vehiclesG[route] = svg.append("g")
                        .attr("class", "vehicles");
        mapData.push(vehiclesG[route]);
    }

    var mapVehicle = vehiclesG[route].selectAll("circle")
                       .data(data, function(d) {
                            return d.id;
                       });

   mapVehicle.enter()
        .append("circle")
        .attr("cx", function (d) { return projection(d.loc)[0]; })
	    .attr("cy", function (d) { return projection(d.loc)[1]; })
	    .attr("r", "4px")
        .attr("class", "vechile")
	    .attr("fill", "#" + routes[route].color)
        .attr("stroke", "black");


    //TODO Maybe change to triangles if I have time...
    /*mapVehicle.enter()
        .append("path")
        .attr("d", d3.svg.symbol().size(20).type("triangle-up"))
        .attr("class", "vechile")
        .attr("fill", "red")
        .attr("stroke", "black")
        .attr("transform", function(d) {
                return "translate(" + projection(d.loc)[0] +
                       "," + projection(d.loc)[1] + ") rotate(-45)";
        });*/

   /* mapVehicle.transition()
              .duration(refreshVehicles)
              .attr("transform", function(d) {
                    return "translate(" + projection(d.loc)[0] +
                           "," + projection(d.loc)[1] + ")";
              });
    */
       
    mapVehicle.transition()
              .duration(refreshVehicles)
              .attr("cx", function (d) { return projection(d.loc)[0]; })
	          .attr("cy", function (d) { return projection(d.loc)[1]; });

    mapVehicle.exit().transition().remove();
}