// jshint node:true
"use strict";

var es = require("event-stream"),
	async = require("async"),
	ffmetadata = require("ffmetadata"),
	acoustid = require("acoustid");

// Map file paths to Track objects
module.exports = function createTrackStream() {
	return es.map(getTrackData);
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
	}, callback);
}
