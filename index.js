// jshint node:true
"use strict";

var PACKAGE = require("./package.json");

var createFileStream = require("./lib/files"),
	createTrackStream = require("./lib/tracks"),
	createParseStream = require("./lib/parse"),
	createDatabase = require("./lib/database"),
	createReleaseSelector = require("./lib/release-selector"),
	createTagStream = require("./lib/tag-picker"),
	createWriteStream = require("./lib/tag-writer"),
	createFileRenamer = require("./lib/rename").file,
	createDirRenamer = require("./lib/rename").dir,
	createBufferStream = require("./lib/buffer");

module.exports = function(path) {
	var fileStream = createFileStream(path),
		trackStream = createTrackStream(),
		parser = createParseStream(),
		db = createDatabase(),
		releaseSelector = createReleaseSelector(),
		tagPicker = createTagStream(),
		writer = createWriteStream(),
		fileRenamer = createFileRenamer(),
		dirRenamer = createDirRenamer(),
		buffer = createBufferStream();

	logIntro();
	logStart({
		files: fileStream,
		tracks: trackStream,
		writer: writer,
	});

	fileStream
		.pipe(trackStream)
		.pipe(parser)
		.pipe(db)
		.pipe(releaseSelector)
		.pipe(tagPicker)
		.pipe(writer);

	tagPicker.pipe(buffer);

	writer.on("end", function() {
		buffer.replay(fileRenamer);
	});

	fileRenamer.on("end", function() {
		buffer.replay(dirRenamer);
	});
};

// -- Logging

var progress = require("./lib/stream-progress"),
	color = require("cli-color");

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

var reduce = require("stream-reduce");
function count(fn) {
	var stream = reduce(function(acc) {
		return acc + 1;
	}, 0);
	stream.on("data", fn);
	return stream;
}
