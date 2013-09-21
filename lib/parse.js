// jshint node:true
"use strict";

var es = require("event-stream");

module.exports = function() {
	var releases = createDatabase(),
		files = [];

	return es.through(function(fileData) {
		var file = new File(fileData);

		files.push(file);

		parseTracks(fileData.acoustid, function(track, medium, release, group, recording) {
			var oRelease = releases.get(release.id),
				oTrack = new Track(track, medium, recording);

			if ( ! oRelease) {
				oRelease = new Release(release, group);
				releases.add(oRelease);
			}

			oTrack.file = file;
			oTrack.release = oRelease;
			oRelease.tracks.push(oTrack);
			file.tracks.push(oTrack);
		});
	}, function() {
		this.emit("data", {
			releases: releases.toArray(),
			files: files,
		});
		this.emit("end");
	});
};

// Get tracks from given acoustid data
function parseTracks(data, fn) {
	getRecordings(data).forEach(function(recording) {
		(recording.releasegroups || []).forEach(function(group) {
			(group.releases || []).forEach(function(release) {
				(release.mediums || []).forEach(function(medium) {
					(medium.tracks || []).forEach(function(track) {
						fn(track, medium, release, group, recording);
					});
				});
			});
		});
	});
}

// Get viable recordings from given acoustid results
function getRecordings(acoustid) {
	// Filter acoustid results by score
	acoustid = acoustid.filter(function(result) {
		return result.score > 0.5;
	});

	// Get all recordings from the acoustid results
	var recordings = acoustid.reduce(function(acc, cur) {
		acc.push.apply(acc, cur.recordings);
		return acc;
	}, []);

	// Count the total number of sources for all recordings
	var totalSources = recordings.reduce(function(acc, cur) {
		return acc + cur.sources;
	}, 0);

	// Filter recordings by number of sources
	recordings = recordings.filter(function(recording) {
		return (recording.sources / totalSources) > 0.1 ||
			recording.sources > 10;
	});

	return recordings;
}

function createDatabase() {
	var data = {};
	return {
		add: function(obj) {
			data[obj.id] = obj;
		},
		get: function(id) {
			return data[id];
		},
		toArray: function() {
			return Object.keys(data).map(function(id) {
				return data[id];
			});
		},
	};
}

function createSet() {
	var set = [];
	set.push = function(el) {
		if (set.indexOf(el) === -1) {
			Array.prototype.push.call(set, el);
		}
	};
	return set;
}

var sanitizeFilename = require("sanitize-filename");

function Track(track, medium, recording) {
	this.id = track.id;
	this.type = "track";
	this.duration = recording.duration;
	this.sources = recording.sources;
	this.artists = track.artists;
	this.title = track.title;
	this.format = medium.format;
	this.position = track.position;
	this.discTrackCount = medium.track_count;
	this.discPosition = medium.position;
}

Track.prototype = {
	artist: function() {
		return getArtistString(this.artists);
	},

	fileName: function(track) {
		// {position} {title}
		return sanitizeFilename(
			padTrackNumber(track.position) +
			" " + track.title);
	},

	toString: function() {
		return padTrackNumber(this.position) + ". " +
			getArtistString(this.artists) + " / " +
			this.title +
			" (" + this.sources + " sources)";
	},
};

function Release(release, group) {
	this.id = release.id;
	this.type = "release";
	this.title = group.title;
	this.releaseType = group.type;
	this.secondaryTypes = group.secondarytypes;
	this.date = release.date;
	this.artists = group.artists;
	this.trackCount = release.track_count;
	this.discCount = release.medium_count;
	this.mediums = release.mediums;
	this.country = release.country;
	this.tracks = [];
}

Release.prototype = {
	isComplete: function() {
		return this.files().length == this.trackCount;
	},

	files: function() {
		return this.tracks.reduce(function(acc, track) {
			acc.push(track.file);
			return acc;
		}, createSet());
	},

	artist: function() {
		return getArtistString(this.artists);
	},

	directoryName: function(release) {
		var str = "";
		if (release.date) {
			str += release.date.year + " - ";
		}
		str += release.title;
		return sanitizeFilename(str);
	},

	toString: function() {
		var str = getArtistString(this.artists) +
			" / " +
			this.title;
		if (this.country) {
			str += " [" + this.country + "]";
		}
		if (this.mediums) {
			str += " [" + this.discCount + "x " +
				getMediumFormatString(this.mediums) + "]";
		}
		str += " (" + this.files().length + " of " +
			this.trackCount + ")";
		return str;
	},
};

function File(data) {
	this.id = data.path;
	this.type = "file";
	this.path = data.path;
	this.tags = data.tags;
	this.tracks = [];
}

File.prototype = {
	releases: function() {
		return this.tracks.map(function(track) {
			return track.release;
		}).reduce(function(acc, release) {
			acc.push(release);
			return acc;
		}, createSet());
	},
};

var pad = require("pad");
function padTrackNumber(number) {
	return pad(2, String(number), "0");
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
