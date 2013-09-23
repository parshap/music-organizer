// jshint node:true
"use strict";

var PACKAGE = require("../package.json");

var progress = require("./stream-progress");

module.exports = function(streams) {
	logIntro();
	logReading(streams);
	logWriting(streams);
};

function logIntro() {
	console.log("album-organizer", "v" + PACKAGE.version);
	console.log();
}

function logReading(streams) {
	var prog = progress(streams.tracks);
	streams.files.pipe(count(function(length) {
		console.log("Reading", length, "files");
		prog.render();
	}));
}

function logWriting(streams) {
	var prog = progress(streams.writer);
	streams.tags.pipe(count(function(length) {
		console.log("Writing", length, "files");
		prog.render();
	}));
}

var reduce = require("stream-reduce");
function count(fn) {
	var stream = reduce(function(acc) {
		return acc + 1;
	}, 0);
	stream.on("data", fn);
	return stream;
}
