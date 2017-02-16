/**
 * File: nextbusapi.js
 * Author: Kenan Mesic
 * Date: 02/16/2017
 * Descri/ption: Handles all retrieval of data from NextBus API
 * 
 */

// Globals
// Base url for the NextBus XML Feed
var url = "http://webservices.nextbus.com/service/publicXMLFeed?command=";
// Area will only be SF
var agency = "&a=sf-muni";

// Global to store all route infomation once retrieved
var routes = {}

/**
 * Get all info about routes including vehicle info for the route.
 * Then draw out all the routes and vehicles onto the map.
 */
function getAllInfoRoutesandDraw() {
    var routeurl = url + "routeList" + agency; 
    d3.xml(routeurl, function(error, data) {
        if (error) {
            return console.log(error);
        }

        var routes = data.getElementsByTagName("route");
        // Go through all routes and get info about them and draw on map
        for (var i = 0; i < routes.length; i++ ){
            getRoutePathsAndDraw(routes[i].getAttribute("tag"));
        }
    });

}

/**
 * Get all the paths about the route and draw them out.
 * Also start getting infomation about the vehicles on the route.
 * @param {string} routetag Tagname of the route
 */
function getRoutePathsAndDraw(routetag) {
    var routeurl = url + "routeConfig" + agency + "&" + "r=" + routetag;
    d3.xml(routeurl, function(error, data) {
        if (error) {
            return console.log(error);
        }

        // Store all revelent information in object to be later stored into routes
        var routeInfo = {};
        var route = data.getElementsByTagName("route")[0];
        routeInfo["color"] = route.getAttribute("color");
        routeInfo["oppositeColor"] = route.getAttribute("oppositeColor");
        routeInfo["tag"] = route.getAttribute("tag");
        routeInfo["title"] = route.getAttribute("title");
        routeInfo["stops"] = [];
        routeInfo["off"] = false;
        routeInfo["vehiclePolled"] = 0;
        routeInfo["vehicles"] = {};

        var children = route.children;
        var paths = [];
        // Go through all route children and store all stops and paths
        for (var i = 0; i < children.length; i++) {
            var currChild = children[i];

            if (currChild.tagName === "path") {
                paths.push(currChild);
            }
            
            // If not path or stop, then don't care about it for current release
            if (currChild.tagName !== "stop") {
                continue;
            }

            // Grab all revelent information
            var currentStop = {
                tag: currChild.getAttribute("tag"),
                title: currChild.getAttribute("title"),
                lat: currChild.getAttribute("lat"),
                lon: currChild.getAttribute("lon"),
                stopid: currChild.getAttribute("stopid")
            };

            routeInfo["stops"].push(currentStop);
        }

        routes[routeInfo["tag"]] = routeInfo;

        // Draw route with the stored paths and get all the vehicles along the route
        drawRoute(paths, routeInfo["tag"], routeInfo["color"]);
        getVehicleInfo(routeInfo["tag"]);
    });
}

/**
 * Get all vehicle info on the route and draw out the data.
 * @param {string} routeTag Tagname of the route
 */
function getVehicleInfo(routeTag) {
    var routeurl = url + "vehicleLocations" + agency + "&" + "r=" + routeTag + "&t=" + routes[routeTag].vehiclePolled;
    d3.xml(routeurl, function(error, data) {
        if (error) {
            console.log(error);
        }

        var vehicles = data.getElementsByTagName("vehicle");

        // Get the lastTime polled
        var lastTime = data.getElementsByTagName("lastTime");
        if (lastTime.length !== 0) {
            routes[routeTag].vehiclePolled = lastTime[0].getAttribute("time");
        }

        // Go through all vehicles
        for(var i = 0; i < vehicles.length; i++) {
            var vehicle = vehicles[i];

            // Store revelent info about the vehicle
            var vehicleInfo = {
                id: vehicle.getAttribute("id"),
                loc: [vehicle.getAttribute("lon"), vehicle.getAttribute("lat")],
                heading: vehicle.getAttribute("heading")
            };

            routes[routeTag].vehicles[vehicle.getAttribute("id")] = vehicleInfo;
        }

        // Draw all the vehicles received for the route
        drawVehicles(routes[routeTag].vehicles, routeTag);
    });

}