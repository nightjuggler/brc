# brc.js

A JavaScript geocoder for Black Rock City (Burning Man) addresses/locations.

It defines a global `BRC` object.
After `BRC.init()` is called, the following functions can be called:

`BRC.getLatLongFromLocation()` takes a string parameter which is expected to be a Black Rock City-style address
(for example, `2 & Esplanade` or `11:45 & 5400ft`)
and returns the corresponding latitude and longitude (in the form of an object with
`latitude` and `longitude` properties).

`BRC.getLocationFromLatLong()` takes a latitude and longitude
(in the form of an object parameter which is expected to have
`latitude` and `longitude` properties)
and returns a Black Rock City-style address.

By default, **brc.js** will try to use [GeographicLib](https://geographiclib.sourceforge.io/html/js/index.html)
for computing geographical distances and angles,
but it can also use (and fall back to) the Google Maps API
([google.maps.geometry.spherical](https://developers.google.com/maps/documentation/javascript/reference/geometry#spherical))
or [Turf](https://github.com/Turfjs/turf).

# map.html

**brc.js** integrated with Google Maps.

See [https://nightjuggler.com/brc/map.html](https://nightjuggler.com/brc/map.html)

By default, the map is initially centered at the Man,
but the initial location can also be specified in the URL via the
`loc` (Black Rock City-style address),
`ll` (latitude,longitude), or
`xy` (longitude,latitude) parameters.
For example:

* [https://nightjuggler.com/brc/map.html?ll=40.791657,-119.198162](https://nightjuggler.com/brc/map.html?ll=40.791657,-119.198162)
* [https://nightjuggler.com/brc/map.html?loc=Temple](https://nightjuggler.com/brc/map.html?loc=Temple)
* [https://nightjuggler.com/brc/map.html?loc=CenterCamp](https://nightjuggler.com/brc/map.html?loc=CenterCamp)
* [https://nightjuggler.com/brc/map.html?loc=12+2400ft](https://nightjuggler.com/brc/map.html?loc=12+2400ft)
* [https://nightjuggler.com/brc/map.html?loc=3:17+K](https://nightjuggler.com/brc/map.html?loc=3:17+K)
* [https://nightjuggler.com/brc/map.html?loc=2+Esplanade](https://nightjuggler.com/brc/map.html?loc=2+Esplanade)
* [https://nightjuggler.com/brc/map.html?loc=5:40:33.8+280.16mi](https://nightjuggler.com/brc/map.html?loc=5:40:33.8+280.16mi)
* [https://nightjuggler.com/brc/map.html?loc=6:35:47.9+7665.185mi&z=18](https://nightjuggler.com/brc/map.html?loc=6:35:47.9+7665.185mi&z=18)

You can also specify the following:

<table>
<tr>
<td>URL parameter</td>
<td>Description</td>
</tr>
<tr>
<td><b>y</b> or <b>year</b></td>
<td>the year (2013-2017)</td>
</tr>
<tr>
<td><b>z</b> or <b>zoom</b></td>
<td>the zoom level</td>
</tr>
<tr>
<td><b>t</b></td>
<td>the map type ("hybrid", "roadmap", "satellite", or "terrain")</td>
</tr>
<tr>
<td><b>pentagon</b></td>
<td>whether to draw the perimeter pentagon</td>
</tr>
<tr>
<td><b>grid</b></td>
<td>whether to draw the city grid</td>
</tr>
<tr>
<td><b>man</b></td>
<td>the latitude and longitude for the Man</td>
</tr>
<tr>
<td><b>azi</b> or <b>azimuth</b></td>
<td>the 12 o'clock azimuth (in degrees clockwise from North)</td>
</tr>
<tr>
<td><b>p3</b> or <b>point3</b></td>
<td>the distance from the Man to pentagon point 3 (in feet, meters, kilometers, or miles)</td>
</tr>
<tr>
<td><b>p3</b> or <b>point3</b></td>
<td>the latitude and longitude for point 3 (overriding the azimuth and distance)</td>
</tr>
<tr>
<td><b>geoapi</b></td>
<td>the preferred API for computing geographical distances and angles ("geographiclib", "google", or "turf")</td>
</tr>
</table>

For example:

* [https://nightjuggler.com/brc/map.html?y=2016&pentagon&grid&z=14](https://nightjuggler.com/brc/map.html?y=2016&pentagon&grid&z=14)
* [https://nightjuggler.com/brc/map.html?man=37.75515,-122.45275&grid&pentagon&t=roadmap&z=13](https://nightjuggler.com/brc/map.html?man=37.75515,-122.45275&grid&pentagon&t=roadmap&z=13)
* [https://nightjuggler.com/brc/map.html?man=48.8583,2.2945&azimuth=315&point3=2.8km&grid&pentagon&t=terrain&z=13&loc=point3](https://nightjuggler.com/brc/map.html?man=48.8583,2.2945&azimuth=315&point3=2.8km&grid&pentagon&t=terrain&z=13&loc=point3)
* [https://nightjuggler.com/brc/map.html?man=37.7627,-122.4352&point3=37.79543,-122.39371&grid&pentagon&z=13](https://nightjuggler.com/brc/map.html?man=37.7627,-122.4352&point3=37.79543,-122.39371&grid&pentagon&z=13)

# gensvg.py

A Python script that outputs SVG for the layout of Black Rock City.

See [https://nightjuggler.com/brc/brc.svg](https://nightjuggler.com/brc/brc.svg)

