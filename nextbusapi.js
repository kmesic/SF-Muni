var url = "http://webservices.nextbus.com/service/publicXMLFeed?command=";
var agency = "&a=sf-muni";

var routes = {}

function getRoutes() {
    var routeurl = url + "routeList" + agency; 
    d3.xml(routeurl, function(error, data) {
        if (error) {
            return console.log(error);
        }

        var routes = data.getElementsByTagName("route");
        for (var i = 0; i < routes.length; i++ ){
            getRoutePaths(routes[i].getAttribute("tag"));
        }
    });

}

function getRoutePaths(routetag) {
    var routeurl = url + "routeConfig" + agency + "&" + "r=" + routetag;
    d3.xml(routeurl, function(error, data) {
        if (error) {
            return console.log(error);
        }
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

        var stops = route.children;
        var paths = [];
        for (var i = 0; i < stops.length; i++) {
            var stop = stops[i];

            if (stop.tagName === "path") {
                paths.push(stop);
            }
            if (stop.tagName !== "stop") {
                continue;
            }
            var currentStop = {
                tag: stop.getAttribute("tag"),
                title: stop.getAttribute("title"),
                lat: stop.getAttribute("lat"),
                lon: stop.getAttribute("lon"),
                stopid: stop.getAttribute("stopid")
            };

            routeInfo["stops"].push(currentStop);
        }

        routes[routeInfo["tag"]] = routeInfo;
        drawRoute(paths, routeInfo["tag"], routeInfo["color"]);
        getVehicleInfo(routeInfo["tag"]);
    });
}

function getVehicleInfo(routeTag) {
    var routeurl = url + "vehicleLocations" + agency + "&" + "r=" + routeTag + "&t=" + routes[routeTag].vehiclePolled;
    d3.xml(routeurl, function(error, data) {
        if (error) {
            console.log(error);
        }

        var vehicles = data.getElementsByTagName("vehicle");

        for(var i = 0; i < vehicles.length; i++) {
            var vehicle = vehicles[i];

            if (vehicle.tagName !== "vehicle") {
                if (vehicle.tagName === "lastTime") {
                    routes[routeTag].vehiclePolled = vehicle.getAttribute("time");
                }
                continue;
            }
            var vehicleInfo = {
                id: vehicle.getAttribute("id"),
                loc: [vehicle.getAttribute("lon"), vehicle.getAttribute("lat")],
                heading: vehicle.getAttribute("heading")
            };

            routes[routeTag].vehicles[vehicle.getAttribute("id")] = vehicleInfo;
        }

        drawVehicles(routes[routeTag].vehicles, routeTag);
    });

}