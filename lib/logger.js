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
  console.log(PACKAGE.name, "v" + PACKAGE.version);
}

function logReading(streams) {
  var prog = progress(streams.tracks);
  var counter = streams.files.pipe(count());
  streams.files.on("end", function() {
    console.log();
    console.log("Reading", counter.count, "files");
    prog.start();
  });
}

function logWriting(streams) {
  var prog = progress(streams.writer);
  var counter = streams.tags.pipe(count());
  start(streams.writer, function() {

    console.log();
    console.log("Writing", counter.count, "files");
    prog.start();
  });
}

var es = require("event-stream");
function count() {
  var stream = es.through(function() {
    this.count += 1;
  });
  stream.count = 0;
  return stream;
}

var before = require("./before-fn");
function start(stream, fn) {
  stream.write = before(stream.write, once(fn));
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
