// jshint node:true
"use strict";

var es = require("event-stream"),
	ffmetadata = require("ffmetadata");

var debug = console.info;

module.exports = function(files) {
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
};

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
	read({ prompt: text}, function(err, val) {
		if (err && err.message === "canceled") {
			process.exit();
		}
		callback(err, val);
	});
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
	var files = getReleaseFiles(release);
	async.series([
		tagRelease.bind(null, files, release),
		renameRelease.bind(null, files, release),
		renameDirectory.bind(null, files, release),
	], callback);
}

function tagRelease(files, release, callback) {
	var queue = files.slice(0);

	var written = {};
	function isNotWritten(track) {
		return ! written.hasOwnProperty(track.id);
	}

	function process(file, callback) {
		var tracks = file.tracks.filter(isNotWritten);
		if (tracks.length !== 1) {
			// @TODO Do a first pass to ensure all-or-nothing
			return callback(new Error("No track choice for file"));
		}
		file.track = tracks.shift();
		written[file.track.id] = true;
		writeFileTags(file, file.track, release, callback);
	}

	(function step() {
		if ( ! queue.length) {
			return callback();
		}

		queue.sort(function(a, b) {
			return a.tracks.filter(isNotWritten).length -
				b.tracks.filter(isNotWritten).length;
		});

		process(queue.shift(), function(err) {
			if (err) {
				return callback(err);
			}
			step();
		});
	})();
}

function renameRelease(files, release, callback) {
	async.forEach(files, function(file, callback) {
		rebasename(file.path, getFileName(file), callback);
	}, callback);
}

var path = require("path");
function renameDirectory(files, release, callback) {
	var dirname = path.dirname(files[0].path);
	rebasename(dirname, getDirectoryName(release), callback);
}

function writeFileTags(file, track, release, callback) {
	var data = {
		album: release.title,
		artist: getArtistString(track.artists),
		album_artist: getArtistString(release.artists),
		track: track.position + "/" + track.discTrackCount,
		title: track.title,
	};

	if (release.date) {
		data.date = [release.date.year, release.date.month, release.date.day]
			.join("-");
		// iTunes looks for "recording date" instead of release date so we will
		// spoof this. @TODO MP3-only
		data.TDRC = data.date;
	}

	if (release.discCount > 1) {
		data.disc = track.discPosition + "/" + release.discCount;
	}

	ffmetadata.write(file.path, data, callback);
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
function getFileName(file) {
	// {position}. {title}
	return pad(2, String(file.track.position), "0") + ". " + file.track.title;
}

function getDirectoryName(release) {
	var str = "";
	if (release.date) {
		str += release.date.year + " - ";
	}
	str += release.title;
	return str;
}

function getReleaseString(release) {
	var str = getArtistString(release.artists) +
		" / " +
		release.title;
	if (release.country) {
		str += " [" + release.country + "]";
	}
	if (release.mediums) {
		str += " [" + release.discCount + "x " +
			getMediumFormatString(release.mediums) + "]";
	}
	str += " (" + release.tracks.length + " of " +
		release.trackCount + " tracks)";
	return str;
}

function getMediumFormatString(mediums) {
	var formats = [];
	mediums.forEach(function(medium) {
		var format = medium.format;
		if (formats.indexOf(format) === -1) {
			formats.push(format);
		}
	});
	return formats.join("; ");
}

function getArtistString(artists) {
	var joinphrase, str = "";
	artists.forEach(function(artist) {
		if (joinphrase) {
			str += joinphrase;
		}
		str += artist.name;
		joinphrase = artist.joinphrase || "; ";
	});
	return str;
}

function createReleaseRepository() {
	var repo = es.through(function(file) {
		var sources = file.recordings.reduce(function(acc, cur) {
			return acc + cur.sources;
		}, 0);
		file.recordings.filter(function(recording) {
			return (recording.sources / sources) > 0.1 ||
				recording.sources > 10;
		}).forEach(function(recording) {
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
			rel.addTrack(createTrack(track, medium, rel, recording, file));
		});
	}

	function createTrack(track, medium, release, recording, file) {
		return {
			id: track.id,
			release: release,
			recording: recording,
			duration: recording.duration,
			artists: recording.artists,
			title: recording.title,
			format: medium.format,
			position: track.position,
			discTrackCount: medium.track_count,
			discPosition: medium.position,
			path: file.file,
			tags: file.tags,
		};
	}

	function createRelease(release, group, recording, file) {
		var rel = {
			id: release.id,
			title: group.title,
			type: group.type,
			secondaryTypes: group.secondarytypes,
			date: release.date,
			artists: group.artists,
			trackCount: release.track_count,
			discCount: release.medium_count,
			mediums: release.mediums,
			country: release.country,
			tracks: [],
		};
		rel.addTrack = function(aTrack) {
			if ( ! this.hasTrack(aTrack)) {
				this.tracks.push(aTrack);
			}
		};
		rel.hasTrack = function(aTrack) {
			return this.tracks.some(function(track) {
				return track.id === aTrack.id &&
					track.path === aTrack.path;
			});
		};
		rel.toString = function() {
			return getReleaseString(this);
		};
		return rel;
	}

	repo.data = {};
	return repo;
}

function getReleaseFiles(release) {
	var files = release.tracks.reduce(function(files, track) {
		(files[track.path] = files[track.path] || []).push(track);
		return files;
	}, {});
	return Object.keys(files).map(function(path) {
		return {
			path: path,
			tracks: files[path] || [],
		};
	});
}

// Map file paths to Track objects
function createTrackStream() {
	return es.map(getTrackData);
}

var async = require("async"),
	acoustid = require("acoustid");

// Get track data from track file path
function getTrackData(file, callback) {
	async.parallel({
		"tags": ffmetadata.read.bind(null, file),
		"acoustid": getAcoustID.bind(null, file),
	}, function(err, results) {
		var recordings = results.acoustid.reduce(function(acc, cur) {
			debug("Track", file, cur.id, cur.recordings ? cur.recordings.length : 0);
			if (cur.score > 0.5 && cur.recordings) {
				acc.push.apply(acc, cur.recordings);
			}
			return acc;
		}, []);
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
