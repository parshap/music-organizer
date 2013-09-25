// jshint node:true
"use strict";

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

	// Return some of the streams for logging and introspection
	return {
		files: fileStream,
		release: releaseSelector,
		tracks: trackStream,
		tags: tagPicker,
		writer: writer,
	};
};
