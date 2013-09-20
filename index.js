// jshint node:true
"use strict";

var PACKAGE = require("./package.json");

var es = require("event-stream"),
	color = require("cli-color"),
	reduce = require("stream-reduce");

var createFileStream = require("./lib/files"),
	createTrackStream = require("./lib/tracks"),
	createParseStream = require("./lib/parse"),
	createOrganizeStream = require("./lib/organize"),
	progress = require("./lib/stream-progress");

module.exports = function(path) {
	var fileStream = createFileStream(path),
		trackStream = createTrackStream(),
		parser = createParseStream(),
		organizer = createOrganizeStream();

	logIntro();
	logStart(fileStream, trackStream);

	fileStream
		.pipe(trackStream)
		.pipe(parser)
		.pipe(organizer);
};

function logIntro() {
	console.log(
		color.red("album-organizer"),
		color.redBright("v" + PACKAGE.version),
		"\n"
	);
}

function logStart(fileStream, trackStream) {
	var start = Date.now(),
		progressStream = progress(trackStream);

	fileStream.pipe(count(function(length) {
		console.log(
			"Reading",
			color.redBright(length + " files")
		);
		progressStream.render();
		progressStream.on("end", function() {
			var time = Math.round((Date.now() - start) / 100) / 10;
			console.log("Read complete in " + time + "s", "\n");
		});
	}));
}

function count(fn) {
	var stream = reduce(function(acc, data) {
		return acc + 1;
	}, 0);
	stream.on("data", fn);
	return stream;
}
