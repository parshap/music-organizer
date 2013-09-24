// jshint node:true
"use strict";

var es = require("event-stream"),
	ffmetadata = require("ffmetadata");

var limit = require("./limit-map-stream");

module.exports = function() {
	return limit(createStream(), 2);
};

function createStream() {
	return es.map(function(data, callback) {
		var path = data.file.path,
			track = data.track;
		ffmetadata.write(path, track.tags(), function(err) {
			callback(err, data);
		});
	});
}
