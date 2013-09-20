// jshint node:true
"use strict";

var PACKAGE = require("./package.json");

var path = require("path"),
	es = require("event-stream"),
	color = require("cli-color"),
	reduce = require("stream-reduce"),
	findit = require("findit");

var createTrackStream = require("./lib/tracks"),
	createParseStream = require("./lib/parse"),
	createOrganizeStream = require("./lib/organize"),
	progress = require("./lib/stream-progress");

module.exports = function(path) {
	var fileStream = createFileStream(path),
		trackStream = createTrackStream(),
		parser = createParseStream(),
		organizer = createOrganizeStream();

	logIntro();
	logStart(fileStream, progress(trackStream));

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

function logStart(fileStream, progressStream) {
	var start = Date.now();
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

var AUDIO_EXTS = [
	"flac",
	"aac",
	"mp3",
	"m4a",
	"ogg",
	"rm",
	"ra",
	"wma",
];

function createFileStream(dirpath) {
	var stream = es.through();
	findit(dirpath)
		.on("file", function(file, stat) {
			var ext = path.extname(file).slice(1);
			if (AUDIO_EXTS.indexOf(ext) !== -1) {
				stream.emit("data", file);
			}
		})
		.on("end", function() {
			stream.emit("end");
		});
	return stream;
}

function count(fn) {
	var stream = reduce(function(acc, data) {
		return acc + 1;
	}, 0);
	stream.on("data", fn);
	return stream;
}
