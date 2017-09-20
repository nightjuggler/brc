"use strict";
var BRC = (function() {

var geo = GeographicLib.Geodesic.WGS84;

var radiansPerDegree = Math.PI / 180.0;
var degreesPerRadian = 180.0 / Math.PI;
var secondsPerDegree = 12 * 60 * 60 / 360;

var defaultYear = '2013';
var Measurements, ManCenter, TwelveOClockNormal;

function Vector(x, y, z)
{
	this.update(x, y, z);
}
Vector.prototype.update = function(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.cachedMagnitude = undefined;
}
Vector.prototype.dot = function(b)
{
	return this.x * b.x + this.y * b.y + this.z * b.z;
}
Vector.prototype.cross = function(b)
{
	return new Vector(
		this.y * b.z - this.z * b.y,
		this.z * b.x - this.x * b.z,
		this.x * b.y - this.y * b.x);
}
Vector.prototype.magnitude = function()
{
	if (this.cachedMagnitude === undefined)
		this.cachedMagnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);

	return this.cachedMagnitude;
}
Vector.prototype.angle = function(b)
{
	var cosAngle = this.dot(b) / (this.magnitude() * b.magnitude());

	if (cosAngle > 1) {
		if (cosAngle - 1 > 1e-14) return null;
		cosAngle = 1.0;
	} else if (cosAngle < -1) {
		if (-cosAngle - 1 > 1e-14) return null;
		cosAngle = -1.0;
	}

	return Math.acos(cosAngle) * degreesPerRadian;
}
function LatLong(latitude, longitude)
{
	this.latitude = latitude;
	this.longitude = longitude;

	this.vector = new Vector(0, 0, 0);
	this.updateVector();
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
LatLong.prototype.updateVector = function()
{
	var latitude = this.latitude * radiansPerDegree;
	var longitude = this.longitude * radiansPerDegree;

	var c = Math.cos(latitude);
	var s = Math.sin(latitude);

	this.vector.update(c * Math.cos(longitude), s, c * Math.sin(longitude));
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
		PentagonPoint3: new LatLong(40.80276,-119.18348),
	},
	'2014': {
		// http://innovate.burningman.org/dataset/2014-golden-spike-location/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78880,-119.20315),
		PentagonPoint1: new LatLong(40.78542,-119.23241),
		PentagonPoint2: new LatLong(40.80875,-119.21665),
		PentagonPoint3: new LatLong(40.80464,-119.18240),
		PentagonPoint4: new LatLong(40.77869,-119.17687),
		PentagonPoint5: new LatLong(40.76678,-119.20772)
	},
	'2015': {
		// http://innovate.burningman.org/dataset/2015-golden-spike-location/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78640,-119.20650),
		PentagonPoint1: new LatLong(40.78300,-119.23570),
		PentagonPoint2: new LatLong(40.80630,-119.21990),
		PentagonPoint3: new LatLong(40.80220,-119.18570),
		PentagonPoint4: new LatLong(40.77620,-119.18020),
		PentagonPoint5: new LatLong(40.76440,-119.21110)
	},
	'2016': {
		// http://innovate.burningman.org/dataset/2016-golden-spike-and-general-city-map-data/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78640,-119.20650),
		PentagonPoint1: new LatLong(40.78300,-119.23570),
		PentagonPoint2: new LatLong(40.80630,-119.21990),
		PentagonPoint3: new LatLong(40.80220,-119.18570),
		PentagonPoint4: new LatLong(40.77620,-119.18020),
		PentagonPoint5: new LatLong(40.76440,-119.21110)
	},
	'2017': {
		// http://innovate.burningman.org/dataset/2017-golden-spike-and-general-city-map-data/
		ManToEsplanade: 2500,
		EsplanadeToA: 400,
		StreetWidth: 40,
		BlockWidth: 200,

		ManCenter: new LatLong(40.78660,-119.20660),
		PentagonPoint1: new LatLong(40.78306,-119.23568),
		PentagonPoint2: new LatLong(40.80652,-119.22006),
		PentagonPoint3: new LatLong(40.80247,-119.18581),
		PentagonPoint4: new LatLong(40.77657,-119.18026),
		PentagonPoint5: new LatLong(40.76448,-119.21119)
	}
};
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
	TwelveOClockNormal = ManCenter.vector.cross(m.PentagonPoint3.vector);

	m.rotationAngle = getRotationAngle();
	setCachedDistances(m);
	return m;
}
function getRotationAngle()
{
	var north = new LatLong(90, ManCenter.longitude);

	var normal = ManCenter.vector.cross(north.vector);

	var degrees = TwelveOClockNormal.angle(normal);

	if (TwelveOClockNormal.dot(north.vector) > 1e-14)
		degrees = 360 - degrees;

	return degrees;
}
function getTimeForAngle(degrees)
{
	var t = Math.round(degrees * secondsPerDegree);

	var seconds = t % 60; t = (t - seconds) / 60;
	var minutes = t % 60; t = (t - minutes) / 60;

	if (t === 0) t = 12;

	seconds = seconds < 10 ? (seconds === 0 ? '' : ':0' + seconds) : ':' + seconds;
	minutes = minutes < 10 ? (minutes === 0 ? ':00' : ':0' + minutes) : ':' + minutes;

	return t + minutes + seconds;
}
function getAngleForLatLong(latLong)
{
	var normal = ManCenter.vector.cross(latLong.vector);

	var degrees = TwelveOClockNormal.angle(normal);

	latLong.acuteAngle = degrees;

	if (TwelveOClockNormal.dot(latLong.vector) < -1e-14)
		degrees = 360 - degrees;

	return degrees;
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
				(angle >= 60 && angle < 75)))
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
function getDistanceForLatLong(latLong)
{
	var result = geo.Inverse(ManCenter.latitude, ManCenter.longitude,
		latLong.latitude, latLong.longitude);

	var d = result.s12 / 0.3048; // Convert from meters to feet

	if (d < 10000)
		return getStreetFromDistanceAndAngle(d, latLong.acuteAngle);

	if ((d /= 5280) < 30)
		return d.toFixed(1) + "mi";

	return Math.round(d) + "mi";
}
function getLocationFromLatLong(latLong)
{
	if (latLong.equals(ManCenter))
		return "Center of the Man";

	latLong.updateVector();

	var t = getTimeForAngle(getAngleForLatLong(latLong));
	var d = getDistanceForLatLong(latLong);

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

	var m = location.match(/^([1-9][012]?(:[0-9][0-9](:[0-9][0-9])?)?)&/);
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
			seconds = parseInt(hrsMinSec[2], 10);
			if (seconds > 59) return null;
		}
	}

	var degrees = (hours * 3600 + minutes * 60 + seconds) / secondsPerDegree;

	degrees = (degrees + Measurements.rotationAngle) % 360;

	degrees += 0.108 * Math.sin(2 * degrees * radiansPerDegree); // Why?

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
	else if (location.match(/^[1-9][0-9]*(\.[0-9])?MI$/))
	{
		feet = parseFloat(location.slice(0, -2), 10) * 5280;
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
	setMeasurements: setMeasurements,
};

})();
