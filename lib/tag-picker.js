// jshint node:true
"use strict";

var es = require("event-stream"),
  limit = require("./limit-stream");

module.exports = function() {
  return es.pipeline(
    limit(1),
    createPickerStream()
  );
};

function createPickerStream() {
  return es.through(function(release) {
    var emit = this.emit.bind(this),
      emitData = this.emit.bind(this, "data");
    pickTags(release, function(err, tags) {
      if (err) return emit("error", err);
      tags.forEach(function(tag) {
        emitData(tag);
      });
      emit("end");
    });
  }, function() {});
}

var select = require("./select");

function pickTags(release, callback) {
  // Files to pick tags for
  var queue = release.files();

  // Info objects that we will eventually return
  var info = [];

  // Track tracks that have already been used
  var used = {};

  function isNotUsed(track) {
    return ! used.hasOwnProperty(track.id);
  }

  function isThisRelease(track) {
    return track.release === release;
  }

  function isValidTrack(track) {
    return isNotUsed(track) && isThisRelease(track);
  }

  function process(file, callback) {
    var tracks = file.tracks.filter(isValidTrack);

    if ( ! tracks.length) {
      return callback(new Error("No tracks for " + file.path));
    }

    select.track(tracks, function(err, track) {
      if (err) return callback(err);
      used[track.id] = true;
      info.push({
        file: file,
        track: track,
      });
      callback();
    });
  }

  (function step() {
    if ( ! queue.length) {
      return callback(null, info);
    }

    queue.sort(function(a, b) {
      return a.tracks.filter(isValidTrack).length -
        b.tracks.filter(isValidTrack).length;
    });

    process(queue.shift(), function(err) {
      if (err) return callback(err);
      step();
    });
  })();
}
