/**
 * File: sftransit.js
 * Author: Kenan Mesic
 * Date: 02/16/2017
 * Description: Controls all drawing to the map of SF.
 */

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

/**
 * Initializes the map and creates all necessary drawings for the map like
 * the neighboorhoods and streets
 */
function createMap() {
    // Create the projection function to translate every point on map according
    // to the sites screen
    projection = d3.geo.mercator()
        .scale(width * scaleRatio)
        .center(center)
        .translate([width /2, height /1.9]);

    // Create geoJson projection function to make it easy to draw out geoJson
    geoPath = d3.geo.path()
        .projection(projection);

    // Read in the neighboords and draw them out
    d3.json("sfmaps/neighborhoods.json", function(data) {
        var map = drawData(data.features, "neighborhood");
        map.attr("id", function(d) {
            return d.properties.neighborho.replace(/[ \\/]/g, '');
        });
    });

    /**
     * Read in the streets and draw them out. Because of how much more data
     * is in streets it will almost 99% load after neighhoods, thus we can
     * allow it asynchrously load along the neighborhoods
     */
    d3.json("sfmaps/streets.json", function(data) {
        function addStreetClass(d) {
            return "streets " + d.properties.STREETNAME.replace(/ /g,'');
        }
        var map = drawData(data.features, addStreetClass);

        // Draw the freeways after the streets are drawn
        d3.json("sfmaps/freeways.json", function(data) {
            drawData(data.features, "freeways");
        });


        // Set init true as first time drawing everything
        init = true;
    
        // Get all the routes and vehicles and draw them out
        getAllInfoRoutesandDraw();

        // Every 10 secs, poll on the vehicles for each route
        // and update any changes on the map
        setInterval(function() {
            init = false;
            for (var id in routes) {
                if (routes.hasOwnProperty(id)) {
                    if(routes[id].off === false) {
                        getVehicleInfo(id);
                    }
                }
            }
        },refreshVehicles);

    });

    // Allow map to handle zoom and anyone else listening to map's zoom 
    svg.call(zoom) 
       .call(zoom.event);
}

/**
 * When the user zooms, zoomMap will go through all the different
 * groupings of drawings (neighboords, routes...etc) and scale appropriately
 * for the zoom
 */
function zoomMap() {
    for (var i = 0; i < mapData.length; i++)  {
        mapData[i].attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
}

/**
 * Draws the data passed in onto the map.
 * @param {array} data The data to draw out on the map
 * @param {string} dataName What to classify the drawing
 * @return {selection} The grouping of the drawing created
 */
function drawData(data, dataName) {
    var g = svg.append("g");
    mapData.push(g);

    return g.selectAll("path")
            .data(data)
            .enter()
            .append( "path" )
            .attr( "d", geoPath )
            .attr("class", dataName);
}

/**
 * Draws the route onto the map.
 * @param {array} paths Array of all the paths to draw for the route.
 *     This is generally received from the nextbus xml feed about the
 *     route.
 * @param {string} route Tagname of the route
 * @param {string} color Color of the route
 */
function drawRoute(paths, route, color) {
    
    // Create route group
    var g = svg.append("g")
               .attr("id", "route" + route)
               .attr("class", "routepath")
               .attr("style", "stroke:#" + color + ";")
               .attr("stroke-width", 2);
    
    mapData.push(g);

    // Go through all the paths to draw and create a geoJson
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

        // Draw out all the paths
        g.selectAll("path")
         .data(currPoints)
         .enter()
         .append( "path" )
         .attr( "d", geoPath )
         .on('mouseenter', function(currData) {
                /**
                 * When hovering over path, display route title
                 * in the tooltip and double size of route so the
                 * user can see the entire route.
                 **/
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
                /**
                 * When done hovering, remove the tooltip and
                 * return the route path to normal size
                 */
                tooltip.classed('hide', true);

                var curr = d3.select(this).node();
                d3.select(curr.parentNode).transition().duration(500).attr("stroke-width", 2);

         });;
    });
}

/**
 * Draws the vehicles for the route onto the map.
 * @param {array} vehicles Array of all the vehicles to draw for the route.
 *      Generally received from nextbusapi
 * @param {string} route Tagname of the route
 */
function drawVehicles(vehicles, route) {
    // Go through all vechiles and store into an array
    var data = [];
    for (var id in vehicles) {
        if (vehicles.hasOwnProperty(id)) {
            data.push(vehicles[id]);
        }
    }

    /**
     * If init then vehicles are being drawn for the first time,
     * thus need to create groups for each route of vehicles
     **/
    if (init == true) {
        vehiclesG[route] = svg.append("g")
                        .attr("class", "vehicles")
                        .attr("id", "vehicles-" + route);
        mapData.push(vehiclesG[route]);
    }

    // Bind data to each vehicle
    var mapVehicle = vehiclesG[route].selectAll("circle")
                       .data(data, function(d) {
                            return d.id;
                       });

    // Create a new vehicle with the projected points
    mapVehicle.enter()
        .append("circle")
        .attr("cx", function (d) { return projection(d.loc)[0]; })
	    .attr("cy", function (d) { return projection(d.loc)[1]; })
	    .attr("r", "4px")
        .attr("class", "vechile")
	    .attr("fill", "#" + routes[route].color)
        .attr("stroke", "black");
       
    // Update any vehicles already existing, but have new points
    mapVehicle.transition()
              .duration(refreshVehicles)
              .attr("cx", function (d) { return projection(d.loc)[0]; })
	          .attr("cy", function (d) { return projection(d.loc)[1]; });

    // Remove any vehicles that are no longer available
    mapVehicle.exit().transition().remove();
}