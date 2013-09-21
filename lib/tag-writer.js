// jshint node:true
"use strict";

var es = require("event-stream"),
	ffmetadata = require("ffmetadata");

var limit = require("./limit-map-stream");

module.exports = function() {
	return limit(createStream(), 2);
};

function createStream() {
	return es.map(function(data, callback) {
		var path = data.file.path,
			track = data.track,
			tags = getTagData(track);
		ffmetadata.write(path, tags, callback);
	});
}

function getTagData(track) {
	var data = {
		album: track.release.title,
		artist: track.artist(),
		album_artist: track.release.artist(),
		track: track.position + "/" + track.discTrackCount,
		title: track.title,
	};

	if (track.release.date) {
		data.date = getDateString(track.release.date);
		// iTunes looks for "recording date" instead of release date so we
		// use this field as well. ffmpeg passes "TDRC" as a raw text frame,
		// this probably only works with MP3s
		data.TDRC = data.date;
	}

	if (track.release.discCount > 1) {
		data.disc = track.discPosition + "/" + track.release.discCount;
	}

	return data;
}

function getDateString(date) {
	return [date.year, date.month, date.day]
		.join("-");
}
