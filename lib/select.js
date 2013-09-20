// jshint node:true
"use strict";

module.exports.track = function selectTrack(tracks, callback) {
	if (tracks.length === 1) {
		return callback(null, tracks[0]);
	}

	tracks.sort(function(a, b) {
		return b.sources - a.sources;
	});

	console.log(tracks.length + " Tracks:");
	recursivePromptList("Select a track: ", tracks, callback);
};

module.exports.release = function selectRelease(releases, callback) {
	var mostFiles = Math.max.apply(null, releases.map(function(release) {
		return release.files().length;
	}));

	var completeReleases = releases.filter(function(release) {
		return release.isComplete() &&
			release.files().length === mostFiles;
	});

	if (completeReleases.length) {
		releases = completeReleases;
	}

	releases = releases.sort(function(a, b) {
		// Reverse by number of tracks
		return b.files().length - a.files().length;
	});

	console.log(releases.length + " Releases:");
	recursivePromptList("Select a release: ", releases, callback);
};

function recursivePromptList(text, releases, callback) {
	promptList(text, releases, function(err, value) {
		if (err) return recursivePromptList(text, releases, callback);
		callback(null, value);
	});
}

var read = require("read");
function prompt(text, callback) {
	read({ prompt: text}, function(err, val) {
		if (err && err.message === "canceled") {
			process.exit();
		}
		callback(err, val);
	});
}

var isInteger = require("is-integer");
function promptList(text, list, callback) {
	consoleList(list);
	prompt(text, function(err, val) {
		var index = Number(val);
		if (isInteger(index) && index > 0 && index <= list.length) {
			callback(null, list[index - 1]);
		}
		else {
			callback(new Error("Invalid selection"));
		}
	});
}

var color = require("cli-color");
function consoleList(list) {
	list.forEach(function(item, i) {
		var number = i + 1,
			prefix = color.white(" " + number + ". ");
		console.log(prefix, item.toString());
	});
}
