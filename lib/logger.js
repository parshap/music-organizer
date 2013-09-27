// jshint node:true
"use strict";

var PACKAGE = require("../package.json");

var progress = require("./stream-progress"),
	before = require("./before");

module.exports = function(streams) {
	logIntro();
	logReading(streams);
	logSelectedRelease(streams);
	logWriting(streams);
};

function logIntro() {
	console.log("album-organizer", "v" + PACKAGE.version);
}

function logReading(streams) {
	var prog = progress(streams.tracks);
	streams.files.pipe(count(function(length) {
		console.log();
		console.log("Reading", length, "files");
		prog.render();
	}));
}

function logSelectedRelease(streams) {
	before(streams.release, "data", function(release) {
		console.log();
		console.log(release.toString());
	});
}

function logWriting(streams) {
	var prog;
	before(streams.tags, "data", once(function() {
		prog = progress(streams.writer);
	}));
	streams.tags.pipe(count(function(length) {
		console.log();
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

function once(fn) {
	var called = false;
	return function() {
		if ( ! called) {
			called = true;
			fn.apply(this, arguments);
		}
	};
}
