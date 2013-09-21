// jshint node:true
"use strict";

var es = require("event-stream");

module.exports = function() {
	return es.pipeline(
		createReleaseFilter(),
		createSelectorStream()
	);
};

var filter = require("stream-filter");

function createReleaseFilter() {
	return filter(function(data) {
		return data.type === "release";
	});
}

var select = require("./select");

function createSelectorStream() {
	var stream = es.writeArray(function(err, releases) {
		if (err) return stream.emit("error", err);
		select.release(releases, function(err, release) {
			if (err) return stream.emit("error", err);
			stream.emit("data", release);
			stream.emit("end");
		});
	});
	return stream;
}
