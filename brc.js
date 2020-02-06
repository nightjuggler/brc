var GeographicLib;
var google;
var turf;

/* exported BRC */
var BRC = (function() {
"use strict";

var GeoAPI;
var Measurements;

var BRC = {};
var DefaultYear = 2013;
var LetterACode = "A".charCodeAt(0);
var SecondsPerDegree = 12 * 60 * 60 / 360;

function LatLong(latitude, longitude)
{
	this.latitude = latitude;
	this.longitude = longitude;
}
LatLong.prototype.copy = function()
{
	return new LatLong(this.latitude, this.longitude);
};
LatLong.prototype.toGoogle = function()
{
	return new google.maps.LatLng(this.latitude, this.longitude);
};
LatLong.prototype.toTurf = function()
{
	return turf.point([this.longitude, this.latitude]);
};
var DefaultMeasurements = {
	ManToEsplanade: 2500,
	EsplanadeToA: 400,
	StreetWidth: 40,
	BlockWidth: 200,
	OutermostRing: "L",
	TwelveOClockAzimuth: 45,
	Point3Distance: 8145 * 0.3048,

	inWideBlock: function(street, angle) {
		// Street: 0123456
		// Letter: ABCDEFG

		// F @ 2:00-2:30 (9:30-10:00), 3:30-4:00 (8:00-8:30), and 5:00-6:00 (6:00-7:00)

		return street === 5 &&
			(angle < 75 || angle > 105 && angle < 120 || angle > 150);
	},
};
var MeasurementsByYear = {
	"2013": {
		ManToEsplanade: 2410, // Distance in feet from the center of the Man to the center of Esplanade
		EsplanadeToA: 420,
		StreetWidth: 30,

		EsplanadeWidth: 40,
		B_StreetWidth: 40,
		B_BlockWidth: 210,
		I_BlockWidth: 210,
		J_StreetWidth: 20,
		J_BlockWidth: 210,

		inWideBlock: function(street, angle) {
			// F @ 2:00-2:30 (9:30-10:00) and 3:30-4:00 (8:00-8:30)
			// E @ 5:00-6:00 (6:00-7:00)

			return street === 5 && (angle < 75 || angle > 105 && angle < 120)
				|| street === 4 && angle > 150;
		},

		ManCenter: new LatLong(40.78699,-119.20433),
		Pentagon: [
			new LatLong(40.80276,-119.18348), // Point 3
			new LatLong(40.77682,-119.17793), // Point 4
			new LatLong(40.76490,-119.20880), // Point 5
			new LatLong(40.78351,-119.23349), // Point 1
			new LatLong(40.80688,-119.21773), // Point 2
		]
	},
	"2014": {
		// http://innovate.burningman.org/dataset/2014-golden-spike-location/

		ManCenter: new LatLong(40.78880,-119.20315),
		Pentagon: [
			new LatLong(40.80464,-119.18240), // Point 3
			new LatLong(40.77869,-119.17687), // Point 4
			new LatLong(40.76678,-119.20772), // Point 5
			new LatLong(40.78542,-119.23241), // Point 1
			new LatLong(40.80875,-119.21665), // Point 2
		]
	},
	"2015": {
		// http://innovate.burningman.org/dataset/2015-golden-spike-location/

		ManCenter: new LatLong(40.78640,-119.20650),
		Pentagon: [
			new LatLong(40.80220,-119.18570),
			new LatLong(40.77620,-119.18020),
			new LatLong(40.76440,-119.21110),
			new LatLong(40.78300,-119.23570),
			new LatLong(40.80630,-119.21990),
		]
	},
	"2016": {
		// http://innovate.burningman.org/dataset/2016-golden-spike-and-general-city-map-data/

		ManCenter: new LatLong(40.78640,-119.20650),
		Pentagon: [
			new LatLong(40.80220,-119.18570),
			new LatLong(40.77620,-119.18020),
			new LatLong(40.76440,-119.21110),
			new LatLong(40.78300,-119.23570),
			new LatLong(40.80630,-119.21990),
		]
	},
	"2017": {
		// http://innovate.burningman.org/dataset/2017-golden-spike-and-general-city-map-data/

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
function computePentagon(m)
{
	var pentagon = m.Pentagon;

	GeoAPI.setManCenter(m.ManCenter);

	if (pentagon.length > 0)
	{
		var result = GeoAPI.Inverse(pentagon[0]);
		m.TwelveOClockAzimuth = result.azi1;
		m.Point3Distance = result.s12;
	}
	for (var degrees = 72 * pentagon.length; degrees < 360; degrees += 72)
	{
		pentagon.push(GeoAPI.Direct((degrees + m.TwelveOClockAzimuth) % 360, m.Point3Distance));
	}

	if (Measurements)
		GeoAPI.setManCenter(Measurements.ManCenter);
}
function copyMissingProperties(toObj, fromObj)
{
	for (var key of Object.getOwnPropertyNames(fromObj))
		if (!(key in toObj))
			toObj[key] = fromObj[key];
}
function computeDistances(m)
{
	var cachedDistances = m.cachedDistances = [];

	var defaultStreetWidth = m.StreetWidth;
	var defaultBlockWidth = m.BlockWidth;
	var streetWidth = m.EsplanadeWidth || defaultStreetWidth;
	var blockWidth = m.EsplanadeToA || defaultBlockWidth;

	var x = m.ManToEsplanade - streetWidth;
	cachedDistances.push(x);

	x = m.ManToEsplanade + (streetWidth + blockWidth) / 2;
	cachedDistances.push(x);

	var lastLetter = m.OutermostRing.charCodeAt(0);

	for (var letterCode = LetterACode; letterCode <= lastLetter; ++letterCode)
	{
		var letter = String.fromCharCode(letterCode);

		streetWidth = m[letter + "_StreetWidth"] || defaultStreetWidth;
		x += (blockWidth + streetWidth) / 2;
		cachedDistances.push(x);

		blockWidth = m[letter + "_BlockWidth"] || defaultBlockWidth;
		x += (streetWidth + blockWidth) / 2;
		cachedDistances.push(x);
	}
}
function getMeasurements(year)
{
	if (year === undefined)
		return Measurements;

	var m = MeasurementsByYear[year];

	if (typeof year === "string" && year.length <= 16 && year.match(/^[A-Za-z][0-9A-Za-z]*$/))
	{
		if (!(m instanceof Object)) {
			m = {};
			for (var key of Object.getOwnPropertyNames(Measurements))
				m[key] = Measurements[key];

			MeasurementsByYear[year] = m;
		} else {
			if (m.cachedDistances === null)
				computeDistances(m);
			if (m.Pentagon.length < 5)
				computePentagon(m);
		}
	}
	else if (m instanceof Object && !Object.isFrozen(m))
	{
		copyMissingProperties(m, DefaultMeasurements);
		computeDistances(m);
		computePentagon(m);

		Object.freeze(m.ManCenter);
		Object.freeze(m.Pentagon);
		Object.freeze(m);
	}

	return m;
}
function setMeasurements(year)
{
	if (year === undefined)
		year = DefaultYear;

	var m = getMeasurements(year);

	if (!(m instanceof Object))
		return null;

	GeoAPI.setManCenter(m.ManCenter);

	return (Measurements = m);
}
function getTimeForAngle(degrees, precision)
{
	var p = Math.pow(10, precision);
	var t = Math.round(degrees * SecondsPerDegree * p) / p;

	var seconds = t % 60; t = (t - seconds) / 60;
	var minutes = t % 60; t = (t - minutes) / 60;

	if (t === 0) t = 12;

	var s = seconds.toFixed(precision);
	if (precision > 0)
		s = s.replace(/\.?0+$/, "");

	seconds = seconds < 10 ? (seconds === 0 ? "" : ":0" + s) : ":" + s;
	minutes = minutes < 10 ? (minutes === 0 ? ":00" : ":0" + minutes) : ":" + minutes;

	return t + minutes + seconds;
}
function getStreetFromDistanceAndAngle(d, angle)
{
	var dStr = Math.round(d) + "'";

	if (angle > 180)
		angle = 360 - angle;
	if (angle < 59)
		return dStr;

	var cachedDistances = Measurements.cachedDistances;

	if (d < cachedDistances[0])
		return dStr;
	if (d < cachedDistances[1])
		return "Esplanade (" + dStr + ")";

	var n = cachedDistances.length;

	for (var i = 2; i < n; ++i)
		if (d < cachedDistances[i])
		{
			var side = i & 1;
			var street = (i >> 1) - 1;

			side = Measurements.inWideBlock(street, angle) ?
				side === 0 ? (--street, "Mountain") : (++street, "Man") :
				side === 0 ? "Man" : "Mountain";

			street = String.fromCharCode(LetterACode + street);

			return street + " (" + side + " Side) (" + dStr + ")";
		}

	return dStr;
}
function getLocationFromLatLong(latLong)
{
	var result = GeoAPI.Inverse(latLong);
	var degrees = (result.azi1 - Measurements.TwelveOClockAzimuth + 720) % 360;
	var feet = result.s12 / 0.3048;
	var time, distance;

	if (feet < 0.5)
		return "Center of the Man";
	if (feet < 10000) {
		distance = getStreetFromDistanceAndAngle(feet, degrees);
		time = getTimeForAngle(degrees, 0);
	} else {
		distance = (feet / 5280).toFixed(3).replace(/\.?0+$/, "") + "mi";
		time = getTimeForAngle(degrees, 3);
	}
	return time + " & " + distance;
}
function getLatLongFromLocation(location)
{
	location = location.replace(/ /g, "").replace(/\+/g, "&").replace(/'/g, "FT").toUpperCase();

	if (location === "MAN")
		return Measurements.ManCenter;
	else if (location === "TEMPLE")
		location = "12&ESPLANADE";
	else if (location === "CENTERCAMP")
		location = "6&A";

	var m = location.match(/^([1-9][012]?(:[0-9][0-9](:[0-9][0-9](\.[0-9]{1,3})?)?)?)&/);
	if (!m) {
		if (!location.match(/^POINT[12345]$/)) return null;
		let i = parseInt(location.slice(-1), 10);
		return Measurements.Pentagon[(i + 2) % 5];
	}

	var hrsMinSec = m[1].split(":");

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

	var degrees, feet;

	degrees = (hours * 3600 + minutes * 60 + seconds) / SecondsPerDegree;
	degrees = (degrees + Measurements.TwelveOClockAzimuth) % 360;

	location = location.slice(m[0].length);
	location = location.replace(/\([0-9]+FT\)$/, "").replace(/\((MAN|MOUNTAIN)SIDE\)$/, "");

	if (location === "ESPLANADE")
	{
		feet = Measurements.ManToEsplanade;
	}
	else if (location.match(/^[A-Z]$/))
	{
		let i = location.charCodeAt(0) - LetterACode;
		feet = Measurements.cachedDistances[2 + 2 * i];
		if (feet === undefined) return null;
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

	return GeoAPI.Direct(degrees, feet * 0.3048);
}
const GeoAPIMap = new Map([
["geographiclib", function()
{
	var geo = GeographicLib && GeographicLib.Geodesic.WGS84;
	if (!geo) return null;

	var manCenter;
	return {
		Direct: function(degrees, meters)
		{
			var result = geo.Direct(manCenter.latitude, manCenter.longitude, degrees, meters);
			return new LatLong(result.lat2, result.lon2);
		},
		Inverse: function(latLong)
		{
			return geo.Inverse(manCenter.latitude, manCenter.longitude,
				latLong.latitude, latLong.longitude);
		},
		setManCenter: function(latLong)
		{
			manCenter = latLong;
		},
		getCustomDirect: function(latLong)
		{
			var lat1 = latLong.latitude;
			var lon1 = latLong.longitude;

			return function(degrees, meters) {
				var result = geo.Direct(lat1, lon1, degrees, meters);
				return new google.maps.LatLng(result.lat2, result.lon2);
			};
		},
		getPolygonArea: function(latLongArray)
		{
			var polygon = geo.Polygon();
			for (let ll of latLongArray)
				polygon.AddPoint(ll.latitude, ll.longitude);
			return polygon.Compute(true, true);
		},
		name: "GeographicLib",
	};
}],
["google", function()
{
	var geo = google && google.maps && google.maps.geometry && google.maps.geometry.spherical;
	if (!geo) return null;

	var manCenter;
	return {
		Direct: function(degrees, meters)
		{
			var ll = geo.computeOffset(manCenter, meters, degrees);
			return new LatLong(ll.lat(), ll.lng());
		},
		Inverse: function(latLong)
		{
			var ll = latLong.toGoogle();
			return {
				azi1: geo.computeHeading(manCenter, ll),
				s12: geo.computeDistanceBetween(manCenter, ll),
			};
		},
		setManCenter: function(latLong)
		{
			manCenter = latLong.toGoogle();
		},
		getCustomDirect: function(latLong)
		{
			latLong = latLong.toGoogle();

			return function(degrees, meters) {
				return geo.computeOffset(latLong, meters, degrees);
			};
		},
		getPolygonArea: function(latLongArray)
		{
			const llArray = latLongArray.map(ll => ll.toGoogle());

			const result = {};
			result.area = geo.computeArea(llArray);

			llArray.push(llArray[0]);
			result.perimeter = geo.computeLength(llArray);

			return result;
		},
		name: "Google Maps",
	};
}],
["turf", function()
{
	if (!turf) return null;

	const options = {units: "meters"};

	var manCenter;
	return {
		Direct: function(degrees, meters)
		{
			const ll = turf.getCoord(turf.destination(manCenter, meters, degrees, options));
			return new LatLong(ll[1], ll[0]);
		},
		Inverse: function(latLong)
		{
			const ll = latLong.toTurf();
			return {
				azi1: turf.bearing(manCenter, ll),
				s12: turf.distance(manCenter, ll, options),
			};
		},
		setManCenter: function(latLong)
		{
			manCenter = latLong.toTurf();
		},
		getCustomDirect: function(latLong)
		{
			latLong = latLong.toTurf();

			return function(degrees, meters) {
				const ll = turf.getCoord(turf.destination(latLong, meters, degrees, options));
				return new google.maps.LatLng(ll[1], ll[0]);
			};
		},
		getPolygonArea: function(latLongArray)
		{
			const llArray = latLongArray.map(ll => [ll.longitude, ll.latitude]);
			llArray.push(llArray[0]);

			const polygon = turf.polygon([llArray]);
			return {
				area: turf.area(polygon),
				perimeter: turf.length(polygon, options),
			};
		},
		name: "Turf",
	};
}],
]);
function getGeoAPI(api)
{
	if (!api) return GeoAPI;

	const fn = GeoAPIMap.get(api);
	return fn && fn();
}
BRC.init = function(preferredGeoAPI)
{
	GeoAPI = preferredGeoAPI && getGeoAPI(preferredGeoAPI) ||
		getGeoAPI("geographiclib") ||
		getGeoAPI("google") ||
		getGeoAPI("turf");
	if (GeoAPI && setMeasurements())
	{
		BRC.getGeoAPI = getGeoAPI;
		BRC.getLatLongFromLocation = getLatLongFromLocation;
		BRC.getLocationFromLatLong = getLocationFromLatLong;

		BRC.getMeasurements = getMeasurements;
		BRC.setMeasurements = setMeasurements;
	}
	return BRC;
};
return BRC;
})();
