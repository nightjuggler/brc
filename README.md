# brc.js

A JavaScript library that uses [GeographicLib](https://geographiclib.sourceforge.io/html/js/index.html)
to convert latitude and longitude to a Black Rock City (Burning Man) location (e.g. 2 &amp; Esplanade)
and vice versa.

# map.html

**brc.js** integrated with Google Maps.

See [https://nightjuggler.com/brc/map.html](https://nightjuggler.com/brc/map.html)

The location can also be specified in the URL. For example:

* [https://nightjuggler.com/brc/map.html?ll=40.791657,-119.198162](https://nightjuggler.com/brc/map.html?ll=40.791657,-119.198162)
* [https://nightjuggler.com/brc/map.html?loc=Temple](https://nightjuggler.com/brc/map.html?loc=Temple)
* [https://nightjuggler.com/brc/map.html?loc=CenterCamp](https://nightjuggler.com/brc/map.html?loc=CenterCamp)
* [https://nightjuggler.com/brc/map.html?loc=12+2400ft](https://nightjuggler.com/brc/map.html?loc=12+2400ft)
* [https://nightjuggler.com/brc/map.html?loc=3:17+K](https://nightjuggler.com/brc/map.html?loc=3:17+K)
* [https://nightjuggler.com/brc/map.html?loc=2+Esplanade](https://nightjuggler.com/brc/map.html?loc=2+Esplanade)
* [https://nightjuggler.com/brc/map.html?loc=5:40:33.8+280.16mi](https://nightjuggler.com/brc/map.html?loc=5:40:33.8+280.16mi)
* [https://nightjuggler.com/brc/map.html?loc=6:35:47.9+7665.185mi&z=18](https://nightjuggler.com/brc/map.html?loc=6:35:47.9+7665.185mi&z=18)

You can also specify the following:

* the year (2013-2017)
* the zoom level
* the map type ("hybrid", "roadmap", "satellite", or "terrain")
* whether to draw the perimeter pentagon
* whether to draw the city grid
* the latitude and longitude for the Man
* the 12 o'clock azimuth (in degrees clockwise from North)
* the distance from the Man to pentagon point 3 (in feet, meters, kilometers, or miles)
* the latitude and longitude for point 3 (overriding the azimuth and distance)

For example:

* [https://nightjuggler.com/brc/map.html?y=2016&pentagon&grid&z=14](https://nightjuggler.com/brc/map.html?y=2016&pentagon&grid&z=14)
* [https://nightjuggler.com/brc/map.html?man=37.75515,-122.45275&grid&pentagon&t=roadmap&z=13](https://nightjuggler.com/brc/map.html?man=37.75515,-122.45275&grid&pentagon&t=roadmap&z=13)
* [https://nightjuggler.com/brc/map.html?man=48.8583,2.2945&azimuth=315&point3=2.8km&grid&pentagon&t=terrain&z=13&loc=point3](https://nightjuggler.com/brc/map.html?man=48.8583,2.2945&azimuth=315&point3=2.8km&grid&pentagon&t=terrain&z=13&loc=point3)
* [https://nightjuggler.com/brc/map.html?man=37.7627,-122.4352&point3=37.79543,-122.39371&grid&pentagon&z=13](https://nightjuggler.com/brc/map.html?man=37.7627,-122.4352&point3=37.79543,-122.39371&grid&pentagon&z=13)

# gensvg.py

A Python script that outputs SVG for the layout of Black Rock City.

See [https://nightjuggler.com/brc/brc.svg](https://nightjuggler.com/brc/brc.svg)

