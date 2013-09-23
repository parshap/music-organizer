// jshint node:true
"use strict";

var es = require("event-stream"),
	buffer = require("./buffer");

var select = require("./select");

module.exports = function() {
	var stream = es.through(data, end),
		tee = es.through();

	var releases = tee.pipe(createTypeFilter("release"))
		.pipe(buffer());

	var files = tee.pipe(createTypeFilter("file"))
		.pipe(buffer());

	return stream;

	function data(d) {
		tee.write(d);
	}

	function end() {
		select.release(releases.buffer, files.buffer, function(err, release) {
			if (err) return stream.emit("error", err);
			stream.queue(release);
			stream.queue(null);
		});
	}
};

var filter = require("stream-filter");

function createTypeFilter(type) {
	return filter(function(data) {
		return data.type === type;
	});
}
