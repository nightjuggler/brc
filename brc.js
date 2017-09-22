"use strict";
var BRC = (function() {

var geo = GeographicLib.Geodesic.WGS84;

var radiansPerDegree = Math.PI / 180.0;
var degreesPerRadian = 180.0 / Math.PI;
var secondsPerDegree = 12 * 60 * 60 / 360;

var defaultYear = '2013';
var Measurements, ManCenter, TwelveOClockAzimuth;

function LatLong(latitude, longitude)
{
	this.latitude = latitude;
	this.longitude = longitude;
}
LatLong.prototype.copy = function()
{
	return new LatLong(this.latitude, this.longitude);
}
LatLong.prototype.equals = function(latLong)
{
	return Math.abs(this.latitude - latLong.latitude) < 1e-13 &&
		Math.abs(this.longitude - latLong.longitude) < 1e-13;
}
LatLong.prototype.toGoogle = function()
{
	return new google.maps.LatLng(this.latitude, this.longitude);
}
var MeasurementsByYear = {
	'2013': {
		ManToEsplanade: 2410, // Distance in feet from the center of the Man to the center of Esplanade
		EsplanadeToA: 420,
		StreetWidth: 30,
		BlockWidth: 200,

		EsplanadeWidth: 40,
		B_StreetWidth: 40,
		B_BlockWidth: 210,
		I_BlockWidth: 210,
		J_StreetWidth: 20,
		J_BlockWidth: 210,

		ManCenter: new LatLong(40.78699,-119.20433),
		Pentagon: [
			new LatLong(40.80276,-119.18348), // Point 3
		]
	},
	'2014': {
		// http://innovate.burningman.org/dataset/2014-golden-spike-location/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78880,-119.20315),
		Pentagon: [
			new LatLong(40.80464,-119.18240), // Point 3
			new LatLong(40.77869,-119.17687), // Point 4
			new LatLong(40.76678,-119.20772), // Point 5
			new LatLong(40.78542,-119.23241), // Point 1
			new LatLong(40.80875,-119.21665), // Point 2
		]
	},
	'2015': {
		// http://innovate.burningman.org/dataset/2015-golden-spike-location/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78640,-119.20650),
		Pentagon: [
			new LatLong(40.80220,-119.18570),
			new LatLong(40.77620,-119.18020),
			new LatLong(40.76440,-119.21110),
			new LatLong(40.78300,-119.23570),
			new LatLong(40.80630,-119.21990),
		]
	},
	'2016': {
		// http://innovate.burningman.org/dataset/2016-golden-spike-and-general-city-map-data/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78640,-119.20650),
		Pentagon: [
			new LatLong(40.80220,-119.18570),
			new LatLong(40.77620,-119.18020),
			new LatLong(40.76440,-119.21110),
			new LatLong(40.78300,-119.23570),
			new LatLong(40.80630,-119.21990),
		]
	},
	'2017': {
		// http://innovate.burningman.org/dataset/2017-golden-spike-and-general-city-map-data/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78660,-119.20660),
		Pentagon: [
			new LatLong(40.80247,-119.18581),
			new LatLong(40.77657,-119.18026),
			new LatLong(40.76448,-119.21119),
			new LatLong(40.78306,-119.23568),
			new LatLong(40.80652,-119.22006),
		]
	}
};
function generatePentagon(pentagon)
{
	var meters, degrees;

	if (pentagon.length === 0) {
		TwelveOClockAzimuth = 45;
		meters = 8145 * 0.3048;
		degrees = 0;
	} else {
		var TwelveOClock = pentagon[0];
		var result = geo.Inverse(ManCenter.latitude, ManCenter.longitude,
			TwelveOClock.latitude, TwelveOClock.longitude);

		TwelveOClockAzimuth = result.azi1;
		meters = result.s12;
		degrees = 72 * pentagon.length;
	}
	for (; degrees < 360; degrees += 72)
	{
		var result = geo.Direct(ManCenter.latitude, ManCenter.longitude,
			(degrees + TwelveOClockAzimuth) % 360, meters);
		pentagon.push(new LatLong(result.lat2, result.lon2));
	}
}
function setCachedDistances(m)
{
	var letters = m.letters = 'ABCDEFGHIJKL';
	var cachedDistances = m.cachedDistances = [];

	var defaultBlockWidth = m.BlockWidth;
	var defaultStreetWidth = m.StreetWidth;
	var streetWidth = m.EsplanadeWidth || defaultStreetWidth;
	var blockWidth = m.EsplanadeToA || defaultBlockWidth;

	var x = m.ManToEsplanade - streetWidth;
	cachedDistances.push(x);

	x += streetWidth + (streetWidth + blockWidth) / 2;
	cachedDistances.push(x);

	for (var block of letters)
	{
		streetWidth = m[block + '_StreetWidth'] || defaultStreetWidth;
		x += (blockWidth + streetWidth) / 2;
		cachedDistances.push(x);

		blockWidth = m[block + '_BlockWidth'] || defaultBlockWidth;
		x += (streetWidth + blockWidth) / 2;
		cachedDistances.push(x);
	}
}
function setMeasurements(year)
{
	var m = MeasurementsByYear[year];
	if (!m) return null;

	Measurements = m;
	ManCenter = m.ManCenter;

	generatePentagon(m.Pentagon);
	setCachedDistances(m);

	return m;
}
function getTimeForAngle(degrees, precision)
{
	var p = Math.pow(10, precision);
	var t = Math.round(degrees * secondsPerDegree * p) / p;

	var seconds = t % 60; t = (t - seconds) / 60;
	var minutes = t % 60; t = (t - minutes) / 60;

	if (t === 0) t = 12;

	var s = seconds.toFixed(precision);
	if (precision > 0)
		s = s.replace(/\.?0+$/, "");

	seconds = seconds < 10 ? (seconds === 0 ? '' : ':0' + s) : ':' + s;
	minutes = minutes < 10 ? (minutes === 0 ? ':00' : ':0' + minutes) : ':' + minutes;

	return t + minutes + seconds;
}
function getStreetFromDistanceAndAngle(d, angle)
{
	var dStr = Math.round(d) + "'";

	if (angle < 59)
		return dStr;

	var m = Measurements;
	var cachedDistances = m.cachedDistances;

	if (d < cachedDistances[0])
		return dStr;
	if (d < cachedDistances[1])
		return 'Esplanade (' + dStr + ')';

	var n = cachedDistances.length;

	for (var i = 2; i < n; ++i)
		if (d < cachedDistances[i])
		{
			i -= 2;
			var side = i % 2;
			var block = m.letters[(i - side) / 2];

			if (block === 'F' &&
				(angle > 150 ||
				(angle > 105 && angle < 120) ||
				(angle >= 59 && angle < 75)))
			{
				if (side === 0) {
					block = 'E';
					side = 'Mountain';
				} else {
					block = 'G';
					side = 'Man';
				}
			} else
				if (side === 0)
					side = 'Man';
				else
					side = 'Mountain';

			return block + ' (' + side + ' Side) (' + dStr + ')';
		}

	return dStr;
}
function getLocationFromLatLong(latLong)
{
	if (latLong.equals(ManCenter))
		return "Center of the Man";

	var result = geo.Inverse(ManCenter.latitude, ManCenter.longitude,
		latLong.latitude, latLong.longitude);

	var angle = result.azi1;
	if (angle < 0)
		angle += 360;
	angle -= TwelveOClockAzimuth;
	if (angle < 0)
		angle += 360;

	var t;
	var d = result.s12 / 0.3048; // Convert from meters to feet

	if (d < 10000) {
		t = getTimeForAngle(angle, 0);
		d = getStreetFromDistanceAndAngle(d, angle > 180 ? 360 - angle : angle);
	} else {
		t = getTimeForAngle(angle, 3);
		d /= 5280;
		d = d.toFixed(3).replace(/\.?0+$/, "") + "mi";
	}
	return t + ' & ' + d;
}
function getLatLongFromLocation(location)
{
	location = location.replace(/ /g, "").replace(/\+/g, "&").replace(/'/g, "FT").toUpperCase();

	if (location === "MAN")
		return ManCenter;

	if (location === "TEMPLE")
		location = "12&ESPLANADE";
	else if (location === "CENTERCAMP")
		location = "6&A";

	var m = location.match(/^([1-9][012]?(:[0-9][0-9](:[0-9][0-9](\.[0-9]{1,3})?)?)?)&/);
	if (!m) return null;

	var hrsMinSec = m[1].split(':');

	var hours = parseInt(hrsMinSec[0], 10);
	if (hours > 12) return null;
	if (hours === 12) hours = 0;

	var minutes = 0;
	var seconds = 0;
	if (hrsMinSec.length > 1) {
		minutes = parseInt(hrsMinSec[1], 10);
		if (minutes > 59) return null;
		if (hrsMinSec.length > 2) {
			seconds = parseFloat(hrsMinSec[2]);
			if (seconds >= 60) return null;
		}
	}

	var degrees = (hours * 3600 + minutes * 60 + seconds) / secondsPerDegree;

	degrees = (degrees + TwelveOClockAzimuth) % 360;

	location = location.slice(m[0].length);

	var feet = 0;
	if (location === 'ESPLANADE')
	{
		feet = Measurements.ManToEsplanade;
	}
	else if (location.match(/^[A-L]$/))
	{
		var i = location.charCodeAt(0) - 'A'.charCodeAt(0);
		feet = Measurements.cachedDistances[2 + 2 * i];
	}
	else if (location.match(/^[1-9][0-9]*FT$/))
	{
		feet = parseInt(location.slice(0, -2), 10);
	}
	else if (location.match(/^[1-9][0-9]*(\.[0-9]{1,3})?MI$/))
	{
		feet = parseFloat(location.slice(0, -2)) * 5280;
	}
	else return null;

	var meters = feet * 0.3048;
	var result = geo.Direct(ManCenter.latitude, ManCenter.longitude, degrees, meters);

	return new LatLong(result.lat2, result.lon2);
}

setMeasurements(defaultYear);

return {
	getLatLongFromLocation: getLatLongFromLocation,
	getLocationFromLatLong: getLocationFromLatLong,

	getManCenter: function() { return ManCenter; },
	getMeasurements: function() { return Measurements; },
	setMeasurements: setMeasurements,
};

})();
