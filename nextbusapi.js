var url = "http://webservices.nextbus.com/service/publicXMLFeed?command=";
var agency = "&a=sf-muni";

var routes = []

getRoutes();

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

        var stops = route.children;
        for (var i = 0; i < stops.length; i++) {
            var stop = stops[i];
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

        routes.push(routeInfo);
    });
}