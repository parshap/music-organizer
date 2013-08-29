// jshint node:true
"use strict";

var es = require("event-stream");

var files = process.argv.slice(2);

var trackStream = createTrackStream(),
	releaseRepo = createReleaseRepository();

es.readArray(files)
	.pipe(trackStream)
	.pipe(releaseRepo);

releaseRepo.on("end", function() {
	var releases = releaseRepo.toArray();
	// @TODO Reduce to groups of overlapping releases
	selectRelease(releases, function(err, release) {
		updateRelease(release, function(err) {
			console.log("done", err);
		});
	});
});

function selectRelease(releases, callback) {
	releases = releases.sort(function(a, b) {
		// Reverse by number of tracks
		return b.tracks.length - a.tracks.length;
	});
	console.log(releases.length + " Releases Found:");
	recursivePromptList("Select a release: ", releases, callback);
}

function recursivePromptList(text, releases, callback) {
	promptList(text, releases, function(err, value) {
		if (err) return recursivePromptList(text, releases, callback);
		callback(null, value);
	});
}

// ES6 isInteger Polyfill https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger#Polyfill
function isInteger(val) {
	return typeof val === "number" &&
		isFinite(val) &&
		val > -9007199254740992 &&
		val < 9007199254740992 &&
		Math.floor(val) === val;
}

var read = require("read");
function prompt(text, callback) {
	read({ prompt: text}, callback);
}

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

function consoleList(list) {
	list.forEach(function(item, i) {
		console.log("", (i+1) + ". ", item.toString());
	});
}

// Write metadata and rename files
function updateRelease(release, callback) {
	async.series([
		writeTags.bind(null, release),
		rename.bind(null, release),
	], callback);
}

function writeTags(release, callback) {
	var albumArtist = getArtistString(release.artists);
	async.eachLimit(release.tracks, 2, function(track, callback) {
		var artist = getArtistString(track.artists),
			isSameArtist = artist === albumArtist;
		ffmetadata.write(track.path, {
			album: release.title,
			artist: artist,
			album_artist: isSameArtist ? null : albumArtist,
			track: track.position + "/" + track.discTrackCount,
			disc: track.discPosition + "/" + release.discCount,
			title: track.title,
		}, callback);
	}, callback);
}

function rename(release, callback) {
	async.forEach(release.tracks, function(track, callback) {
		rebasename(track.path, getFileName(track), function(err, newPath) {
			if (err) return callback(err);
			track.path = newPath;
		});
	}, callback);
}

var path = require("path"),
	fs = require("fs");
// @TODO Extract
function rebasename(p, basename, callback) {
	var ext = path.extname(p),
		newName = basename + ext,
		dirname = path.dirname(p),
		newPath = path.join(dirname, newName);
	return fs.rename(p, newPath, function(err) {
		callback(err, newPath);
	});
}

var pad = require("pad");
function getFileName(track) {
	// {position}. {title}
	return pad(2, String(track.position), "0") + ". " + track.title;
}

function getReleaseString(release) {
	var str = getArtistString(release.artists) +
		" / " +
		release.title;
	if (release.country) {
		str += " [" + release.country + "]";
	}
	str += " (" + release.tracks.length + " of " +
		release.trackCount + " tracks)";
	return str;
}

function getArtistString(artists) {
	return artists.map(function(artist) {
		return artist.name;
	}).join("; ");
}

function createReleaseRepository() {
	var repo = es.through(function(file) {
		file.recordings.sort(function(a, b) {
			// Reverse by order of number of sources
			return b.sources - a.sources;
		}).slice(0, 1).forEach(function(recording) {
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
			recording: recording,
			path: file.file,
			tags: file.tags,
			// @TODO Recording & File path
		});
	}

	function createRelease(release, group, recording, file) {
		var rel = {
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
		rel.toString = function() {
			return getReleaseString(this);
		};
		return rel;
	}

	repo.data = {};
	return repo;
}

// Map file paths to Track objects
function createTrackStream() {
	return es.map(getTrackData);
}

var async = require("async"),
	ffmetadata = require("ffmetadata"),
	acoustid = require("acoustid");

// Get track data from track file path
function getTrackData(file, callback) {
	async.parallel({
		"tags": ffmetadata.read.bind(null, file),
		"acoustid": getAcoustID.bind(null, file),
	}, function(err, results) {
		var first = results.acoustid[0],
			recordings = first ? first.recordings : [];
		callback(err, {
			file: file,
			tags: results.tags,
			recordings: recordings,
		});
	});
}

function getAcoustID(file, callback) {
	acoustid(file, {
		key: "8XaBELgH",
		meta: "recordings releasegroups releases tracks sources",
	}, callback);
}
