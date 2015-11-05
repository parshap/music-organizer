// jshint node:true
"use strict";
var es = require("event-stream");

module.exports = function(mapStream, limit) {
  var waiting = 0, ended = false, buffer = [];

  var stream = es.through(write, function() {
    ended = true;
    maybeEnd();
  });

  function write(data) {
    if (waiting >= limit) {
      buffer.push(data);
    }
    else {
      waiting += 1;
      mapStream.write(data);
    }
  }

  function unbuffer() {
    if (buffer.length && waiting < limit) {
      write(buffer.shift());
    }
  }

  function maybeEnd() {
    if (ended && waiting === 0) {
      stream.queue(null);
    }
  }

  mapStream.on("data", function(data) {
    stream.queue(data);
    waiting -= 1;
    unbuffer();
    maybeEnd();
  });

  return stream;
};
