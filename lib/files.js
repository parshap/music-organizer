// jshint node:true
"use strict";

var path = require("path"),
  findit = require("findit"),
  es = require("event-stream");

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

module.exports = function(dirpath) {
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
};
