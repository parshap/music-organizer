// jshint node:true
"use strict";

var es = require("event-stream"),
	async = require("async"),
	ffmetadata = require("ffmetadata"),
	acoustid = require("acoustid");

var limit = require("./limit-map-stream");

// Map file paths to Track objects
module.exports = function createTrackStream() {
	return limit(es.map(getTrackData), 2);
};

// Get track data from track file path
function getTrackData(file, callback) {
	async.parallel({
		"tags": ffmetadata.read.bind(null, file),
		"acoustid": getAcoustID.bind(null, file),
	}, function(err, results) {
		callback(err, {
			path: file,
			tags: results.tags,
			acoustid: results.acoustid,
		});
	});
}

function getAcoustID(file, callback) {
	acoustid(file, {
		key: "8XaBELgH",
		meta: "recordings releasegroups releases tracks sources",
	}, function(err, results) {
		callback(err, results);
	});
}
