/**
 * File: index.js
 * Author: Kenan Mesic
 * Date: 02/16/2017
 * Description: Main JS file that handles any user interaction and initating
 *      the drawing of the map
 */

// Create the map and retrieve all data for the map
createMap();

// Configure the filter routes to open on the right
$(".button-collapse").sideNav({
    edge: "right"
});

// On click for filter button
$("#filter").click(function() {

    /**
     * Go through all the routes and grab important
     * infomation for data to bind to every checkbox
     * in the form.
     */
    var routeData = [];
    for (var id in routes) {
        if (routes.hasOwnProperty(id)) {
            var routeInfo = {
                tag: routes[id].tag,
                title: routes[id].title,
                off: routes[id].off
            }
            routeData.push(routeInfo);
        }
    }

    // Select all the checkebox's and bind data to it
    var routesP = d3.select("#slide-out")
                   .selectAll("p")
                   .data(routeData, function(d) {
                     return d.tag;
                   });
        
    var parent = routesP.enter()
                        .append("p");

    // Create the checkbox
    parent.append("input")
          .attr("type", "checkbox")
          .attr("class", "filled-in")
          .attr("id", function(d) {
              return "check" + d.tag;
          })
          .each(function(d) {
              // if not off already, then check the box
              if(d.off == false) {
                  d3.select(this)
                    .attr("checked", "checked");
              }
          })
          .on("change", function(d) {
              /**
               * Invert the off flag and show or hide the
               * route and its vehicles depending on the
               * off flag
               */
              routes[d.tag].off = !routes[d.tag].off;
              d3.select("#vehicles-" + d.tag)
                .classed("hide", routes[d.tag].off);
              d3.select("#route" + d.tag)
                .classed("hide", routes[d.tag].off);
          });

    // Create label for the checkbox
    parent.append("label")
          .attr("for", function(d) {
              return "check" + d.tag;
          })
          .text(function(d) {
              return d.title;
          });

    // Delete any checkboxes not needed anymore
    routesP.exit().remove();
});
