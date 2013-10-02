// jshint node:true
"use strict";

var es = require("event-stream"),
	taglib = require("./taglib");

var limit = require("./limit-map-stream");

module.exports = function() {
	return limit(createStream(), 2);
};

function createStream() {
	return es.map(function(data, callback) {
		var path = data.file.path,
			tags = getTags(data.file, data.track);
		taglib.write(path, tags, function(err) {
			callback(err, data);
		});
	});
}

function getTags(file, track) {
	var data = track.tags();
	return extend(file.tags, encode({
		"TITLE": data.title,
		"ARTIST": data.artist,
		"ALBUM": data.album,
		"ALBUMARTIST": data.albumArtist,
		"TRACKNUMBER": data.track,
		"DISCNUMBER": data.disc,
		"DATE": data.date, // TDRC - Recording date - Most programs use this
		"RELEASEDATE": data.date, // TDRL - Release date
	}));
}

// Wrap each value of object with array (in-place)
function encode(data) {
	Object.keys(data).forEach(function(key) {
		data[key] = data[key] ? [data[key]] : [];
	});
	return data;
}

// Extend obj1 with properties of obj2
function extend(obj1, obj2) {
	Object.keys(obj2).forEach(function(key) {
		obj1[key] = obj2[key];
	});
	return obj1;
}
