// jshint node:true
"use strict";

var es = require("event-stream"),
	limit = require("./limit-stream");

module.exports.file = function() {
	return es.map(renameFile);
};

module.exports.dir = function() {
	return es.pipeline(
		limit(1),
		es.map(renameDir)
	);
};

function renameFile(data, callback, cb2) {
	var path = data.file.path,
		track = data.track;
	rebasename(path, track.fileName(), callback);
}

var path = require("path");
function renameDir(data, callback) {
	var release = data.track.release,
		dirPath = path.dirname(data.file.path);
	rebasename(dirPath, release.directoryName(), callback);
}

var path = require("path");
function renameDirectory(tags, callback) {
	var release = tags[0].track.release,
		newdirname = release.directoryName(),
		dirname = path.dirname(tags[0].file.path),
		dirdirname = path.dirname(dirname),
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
