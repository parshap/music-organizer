// jshint node:true
"use strict";

module.exports.track = function(tracks, callback) {
	if (tracks.length === 1) {
		return callback(null, tracks[0]);
	}

	tracks.sort(function(a, b) {
		return b.sources - a.sources;
	});

	console.log(tracks.length + " Tracks:");
	recursivePromptList("Select a track: ", tracks, callback);
};

module.exports.release = function(releases, files, callback) {
	var options = {};
	var complete = releases.filter(function(release) {
		return release.isComplete() &&
			release.files().length === files.length;
	});

	if (complete.length) {
		releases = complete;
	}
	else {
		options.toString = function(item) {
			return item.toString() + " (incomplete!)";
		};
	}

	releases = releases.sort(function(a, b) {
		// Reverse by number of tracks
		return b.files().length - a.files().length;
	});

	console.log(releases.length + " Releases:");
	recursivePromptList("Select a release: ", releases, options, callback);
};

function recursivePromptList(text, releases, options, callback) {
	promptList(text, releases, options, function(err, value) {
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
function promptList(text, list, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = {};
	}

	var toString = options.hasOwnProperty(toString) ?
		options.toString :
		function(item) {
			return item.toString();
		};

	consoleList(list.map(toString));
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
		console.log(prefix, item);
	});
}
