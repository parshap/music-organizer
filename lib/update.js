// jshint node:true
"use strict";

var async = require("async"),
	ffmetadata = require("ffmetadata"),
	progress = require("./progress"),
	color = require("cli-color");

// Write metadata and rename files
module.exports = function(tags, callback) {
	async.series([
		writeTags.bind(null, tags),
		renameFiles.bind(null, tags),
		renameDirectory.bind(null, tags),
	], callback);
};

function writeTags(tags, callback) {
	console.log(
		"Writing",
		color.redBright(tags.length + " files")
	);

	var bar = progress();
	var complete = 0;
	var start = Date.now();

	async.forEachLimit(tags, 2, function(tag, callback) {
		writeTag(tag, function(err) {
			complete += 1;
			bar.set(complete / tags.length);
			callback(err);
		});
	}, function() {
		bar.terminate();
		var time = Math.round((Date.now() - start) / 100) / 10;
		console.log("Write complete in " + time + "s", "\n");
		callback();
	});
}

function writeTag(tag, callback) {
	var track = tag.track;
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

	ffmetadata.write(tag.file.path, data, callback);
}

function getDateString(date) {
	return [date.year, date.month, date.day]
		.join("-");
}

function renameFiles(tags, callback) {
	async.forEachLimit(tags, 2 ,function(tag, callback) {
		rebasename(tag.file.path, tag.track.fileName(), callback);
	}, callback);
}

var path = require("path");
function renameDirectory(tags, callback) {
	var release = tags[0].track.release,
		newdirname = release.directoryName(),
		dirname = path.dirname(tags[0].file.path),
		dirdirname = path.dirname(dirname),
		basename = path.basename(dirname),
		newpath = path.join(dirdirname, newdirname);
	fs.rename(dirname, newpath, callback);
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
