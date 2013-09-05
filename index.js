// jshint node:true
"use strict";

var es = require("event-stream"),
	async = require("async");

var createTrackStream = require("./lib/tracks"),
	pickTags = require("./lib/tags"),
	parse = require("./lib/parse"),
	update = require("./lib/update"),
	select = require("./lib/select");

module.exports = function(paths) {
	es.readArray(paths)
		.pipe(createTrackStream())
		.pipe(parse(function(data) {
			organize(data);
		}));
};

function organize(data) {
	async.waterfall([
		select.release.bind(null, data.releases),
		pickTags,
		update,
	], function(err) {
		console.log("done", err);
	});
}
