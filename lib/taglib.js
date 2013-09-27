// jshint node:true
"use strict";

var TAGLIBTOOL_PATH = require("path").join(__dirname, "../tools/taglibtool");

var taglibtool = require("child_process").execFile
	.bind(null, TAGLIBTOOL_PATH);

module.exports.read = function(path, callback) {
	function done(err, stdout, stderr) {
		if (err) return callback(err);
		callback(null, JSON.parse(stdout));
	}

	taglibtool([path], done);
};

module.exports.write = function(path, data, callback) {
	function done(err, stdout, stderr) {
		if (err) return callback(err);
		callback();
	}

	var cp = taglibtool(["--write", path], done);
	cp.stdin.end(JSON.stringify(data));
};
