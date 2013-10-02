// jshint node:true
"use strict";

var es = require("event-stream");

module.exports = function() {
	return es.through(function(fileData) {
		var file = new File(fileData),
			emit = this.emit.bind(this, "data");

		parseTracks(fileData.acoustid, function(track, medium, release, group, recording) {
			emit({
				file: file,
				release: new Release(release, group),
				track: new Track(track, medium, recording),
			});
		});
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

	fileName: function() {
		// {position} {title}
		return sanitizeFilename(
			padTrackNumber(this.position) +
			" " + this.title);
	},

	data: function() {
		return {
			title: this.title,
			artist: this.artists,
			position: this.position,
			discTrackCount: this.discTrackCount,
			discPosition: this.discPosition,
		};
	},

	tags: function() {
		var albumArtist = this.release.artist();

		var data = {
			album: this.release.title,
			artist: this.artist(),
			track: this.position + "/" + this.discTrackCount,
			title: this.title,
		};

		if (albumArtist !== data.artist) {
			data.albumArtist = albumArtist;
		}

		if (this.release.date) {
			data.date = this.release.dateString();
		}

		if (this.release.discCount > 1) {
			data.disc = this.discPosition + "/" + this.release.discCount;
		}

		return data;
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

	dateString: function() {
		if (this.date) {
			return getDateString(this.date);
		}
	},

	directoryName: function() {
		var str = "";
		if (this.date) {
			str += this.date.year + " - ";
		}
		str += this.title;
		return sanitizeFilename(str);
	},

	data: function() {
		return {
			title: this.title,
			artists: this.artists,
			trackCount: this.trackCount,
			discCount: this.discCount,
		};
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

function getDateString(date) {
	return [date.year, date.month, date.day]
		.join("-");
}
