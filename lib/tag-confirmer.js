// jshint node:true
"use strict";

var es = require("event-stream"),
	buffer = require("./buffer"),
	prompt = require("./prompt-bool"),
	consoleList = require("./console-list");

module.exports = function() {
	var sink = es.through(noop, noop),
		output = es.through(),
		tags = buffer();

	tags.on("end", function() {
		confirmTags(tags.buffer, function(err, confirm) {
			if (err) return output.emit("error", err);
			if (confirm) {
				tags.replay(output);
			}
			else {
				output.end();
			}
		});
	});

	return es.pipeline(tags, sink, output);
};

function noop() {}

function confirmTags(tags, callback) {
	tags.sort(cmpTracks);
	var descTracks = tags.map(getTrackDesc),
		descRelease = getReleaseDesc(tags);

	console.log();
	console.log("Metadata:");
	console.log();
	console.log(descRelease);
	console.log();
	consoleList(descTracks);

	prompt("Do you want to write meta data?", callback);
}

function cmpTracks(a, b) {
	return a.track.fileName().localeCompare(b.track.fileName());
}

function getReleaseDesc(tags) {
	var track = tags[0].track,
		release = track.release;
	return tagDef("Title", release.title) + "\n" +
		tagDef("Artist", release.artist()) + "\n" +
		tagDef("Date", release.dateString());
}

var TAB = "    ";
function getTrackDesc(tag) {
	var tags = tag.track.tags(), str;

	// File path
	str = tag.file.path + "\n";

	// Title line
	str += TAB + tagDef("Title", tags.title) + "\n";

	// Artist line
	if (tags.albumArtist) {
		str += TAB + tagDef("Artist", tags.artist) + "\n";
	}

	// Track & Disc line
	str += TAB + tagDef("Track", tags.track);
	if (tags.disc) {
		str += TAB + tagDef("Disc", tags.disc);
	}
	str += "\n";

	return str;
}

function tagDef(name, value) {
	return name + ": " + value;
}
