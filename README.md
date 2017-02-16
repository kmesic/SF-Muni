# SF-Muni

Web Application of real-time positions of San Francisco's buses and trains

Tested Browser: Chrome

Visit the web app at: https://kmesic.github.io/SF-Muni/

Unfortunately due to Chrome increasing security on their browser, 
they are not allowing ordinary users to access external data with a http request from a https site.
All of the drawing of routes and vehicles are on NextBus server and the server only supports
http requests, not https requests. 

A temporary fix is when you are on the site, 
you must click on the security icon in the top right corner of the url bar.
After that you have to click load unsafe scritps and routes and vehicles 
should load onto the map.

For future demostrations I might add my own backend to retrieve NextBus data and redirect
it up to the site. However, I did not have time and found out about this last second as
when working localing it wasn't a problem.
