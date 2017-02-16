$(".button-collapse").sideNav({
    edge: "right"
});

$("#filter").click(function() {

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

    var routesP = d3.select("#slide-out")
                   .selectAll("p")
                   .data(routeData, function(d) {
                     return d.tag;
                   });
        
    var parent = routesP.enter()
                        .append("p");

    parent.append("input")
          .attr("type", "checkbox")
          .attr("class", "filled-in")
          .attr("id", function(d) {
              return "check" + d.tag;
          })
          .each(function(d) {
              if(d.off == false) {
                  d3.select(this)
                    .attr("checked", "checked");
              }
          })
          .on("change", function(d) {
              routes[d.tag].off = !routes[d.tag].off;
              d3.select("#vehicles-" + d.tag)
                .classed("hide", routes[d.tag].off);
              d3.select("#route" + d.tag)
                .classed("hide", routes[d.tag].off);
          });

    parent.append("label")
          .attr("for", function(d) {
              return "check" + d.tag;
          })
          .text(function(d) {
              return d.title;
          });

    routesP.exit().remove();
});
