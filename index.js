// jshint node:true
"use strict";

var createFileStream = require("./lib/files"),
  createTrackStream = require("./lib/tracks"),
  createParseStream = require("./lib/parse"),
  createDatabase = require("./lib/database"),
  createReleaseSelector = require("./lib/release-selector"),
  createTagStream = require("./lib/tag-picker"),
  createTagConfirmer = require("./lib/tag-confirmer"),
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
    tagConfirmer = createTagConfirmer(),
    writer = createWriteStream();

  fileStream
    .pipe(trackStream)
    .pipe(parser)
    .pipe(db)
    .pipe(releaseSelector)
    .pipe(tagPicker)
    .pipe(tagConfirmer)
    .pipe(writer);

  var tags = createBufferStream(),
    fileRenamer = createFileRenamer(),
    dirRenamer = createDirRenamer();

  tagPicker.pipe(tags);

  writer.on("end", function() {
    tags.replay(fileRenamer);
  });

  fileRenamer.on("end", function() {
    tags.replay(dirRenamer);
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
