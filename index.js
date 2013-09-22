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

	logger({
		files: fileStream,
		tracks: trackStream,
		tags: tagPicker,
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

var progress = require("./lib/stream-progress");

function logger(streams) {
	logIntro();
	logReading(streams);
	logWriting(streams);
}

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
