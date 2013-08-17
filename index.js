// jshint node:true
"use strict";

var FILES = [
	"test-album/01 999,999.mp3",
	"test-album/02 1,000,000.mp3",
	"test-album/03 Letting You.mp3",
];

var es = require("event-stream"),
	unique = require("unique-stream"),
	async = require("async"),
	taglib = require("taglib"),
	acoustid = require("acoustid");

var trackStream = createTrackStream();

var recordingStream = createPropertyStream("recordings"),
	releaseGroupStream = createPropertyStream("releasegroups"),
	releaseStream = createPropertyStream("releases");

es.readArray(FILES)
	.pipe(trackStream)
	.pipe(recordingStream)
	.pipe(releaseGroupStream)
	.pipe(releaseStream)
	.pipe(es.through(function(release) {
		var str = getArtistsString(release.artists) +
			" / " +
			release.title;
		if (release.country) {
			str += " [" + release.country + "]";
		}
		str += " (" + release.track_count + " tracks)";
		console.log(str);
	}));

function getArtistsString(artists) {
	return artists.map(function(artist) {
		return artist.name;
	}).join("; ");
}

function createPropertyStream(propName) {
	return es.pipeline(
		createArrayPropertyStream(propName),
		unique("id")
	);
}

function createArrayPropertyStream(propName) {
	return es.through(function(data) {
		var arr = data[propName];
		var emit = function(data) {
			this.emit("data", data);
		}.bind(this);
		if (arr) arr.forEach(emit);
	});
}

// Map file paths to Track objects
function createTrackStream() {
	return es.map(getTrackData);
}

// Get track data from track file path
function getTrackData(file, callback) {
	async.parallel({
		"tags": taglib.read.bind(null, file),
		"acoustid": getAcoustID.bind(null, file),
	}, function(err, results) {
		callback(err, {
			file: file,
			tags: results.tags[0],
			recordings: results.acoustid[0].recordings,
		});
	});
}

function getAcoustID(file, callback) {
	acoustid(file, {
		key: "8XaBELgH",
		meta: "recordings releasegroups releases tracks",
	}, callback);
}
