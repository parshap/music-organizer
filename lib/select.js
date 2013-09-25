// jshint node:true
"use strict";

var prompt = require("./prompt"),
	reduce = require("./reduce");

module.exports.track = function(tracks, callback) {
	// Remove equivalent tracks
	tracks = reduce.tracks(tracks);

	if (tracks.length === 1) {
		return callback(null, tracks[0]);
	}

	// Sort by number of sources
	tracks.sort(function(a, b) {
		return b.sources - a.sources;
	});

	// Prompt user
	console.log();
	console.log(tracks.length + " Tracks:");
	prompt("Select a track: ", tracks, callback);
};

module.exports.release = function(releases, files, callback) {
	// Remove equivalent releases
	releases = reduce.releases(releases);

	var options = {};
	var complete = releases.filter(function(release) {
		return release.isComplete() &&
			release.files().length === files.length;
	});

	if (complete.length === 1) {
		return callback(null, complete[0]);
	}
	else if (complete.length) {
		releases = complete;
	}
	else {
		options.toString = function(item) {
			return item.toString() + " (incomplete!)";
		};
	}

	// Sort by number of files used by release
	releases.sort(function(a, b) {
		// Reverse by number of tracks
		return b.files().length - a.files().length;
	});

	// Prompt user
	console.log();
	console.log(releases.length + " Releases:");
	prompt("Select a release: ", releases, options, callback);
};
