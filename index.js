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

var trackStream = createTrackStream(),
	releaseRepo = createReleaseRepository();

es.readArray(FILES)
	.pipe(trackStream)
	.pipe(releaseRepo)
	.pipe(es.through(null, function() {
		releaseRepo.createReadStream()
			.pipe(es.through(logRelease));
	}));

function logRelease(release) {
	var str = getArtistsString(release.artists) +
		" / " +
		release.title;
	if (release.country) {
		str += " [" + release.country + "]";
	}
	str += " (" + release.tracks.length + " of " +
		release.trackCount + " tracks)";
	console.log(str);
}

function createReleaseRepository() {
	var repo = es.through(function(file) {
		file.recordings.forEach(function(recording) {
			parseRecording(recording, file);
		});
	});

	repo.get = function(id) {
		return repo.data[id];
	};

	repo.add = function(data) {
		repo.data[data.id] = data;
		repo.emit("data", data);
	};

	repo.createReadStream = function() {
		return es.readArray(repo.toArray());
	};

	repo.toArray = function() {
		return Object.keys(repo.data).map(function(id) {
			return repo.data[id];
		});
	};

	function parseRecording(recording, file) {
		recording.releasegroups.forEach(function(releasegroup) {
			parseGroup(releasegroup, recording, file);
		});
	}

	function parseGroup(group, recording, file) {
		group.releases.forEach(function(release) {
			parseRelease(release, group, recording, file);
		});
	}

	function parseRelease(release, group, recording, file) {
		// Get existing release or create new one
		var rel = repo.get(release.id);
		if ( ! rel) {
			rel = createRelease(release, group, recording, file);
			repo.add(rel);
		}

		release.mediums.forEach(function(medium) {
			parseMedium(medium, rel, group, recording, file);
		});
	}

	function parseMedium(medium, rel, group, recording, file) {
		medium.tracks.forEach(function(track) {
			parseTrack(track, medium, rel, group, recording, file);
		});
	}

	function parseTrack(track, medium, rel, group, recording, file) {
		rel.tracks.push({
			id: track.id,
			recordingId: recording.id,
			duration: recording.duration,
			artists: recording.artists,
			title: recording.title,
			format: medium.format,
			position: track.position,
			discTrackCount: medium.track_count,
			discPosition: medium.position,
			// @TODO Recording & File path
		});
	}

	function createRelease(release, group, recording, file) {
		return {
			id: release.id,
			title: group.title,
			type: group.type,
			secondaryTypes: group.secondarytypes,
			artists: group.artists,
			trackCount: release.track_count,
			discCount: release.medium_count,
			country: release.country,
			tracks: [],
		};
	}

	repo.data = {};
	return repo;
}

function getArtistsString(artists) {
	return artists.map(function(artist) {
		return artist.name;
	}).join("; ");
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
