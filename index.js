// jshint node:true
"use strict";

var PACKAGE = require("./package.json");

var es = require("event-stream"),
	async = require("async");

var createTrackStream = require("./lib/tracks"),
	pickTags = require("./lib/tags"),
	parse = require("./lib/parse"),
	update = require("./lib/update"),
	select = require("./lib/select"),
	progress = require("./lib/stream-progress"),
	color = require("cli-color");

module.exports = function(paths) {
	var trackStream = createTrackStream();

	console.log(
		color.red("album-organizer"),
		color.redBright("v" + PACKAGE.version),
		"\n"
	);

	console.log(
		"Reading",
		color.redBright(paths.length + " files")
	);

	var start = Date.now();
	progress(trackStream)
		.on("end", function() {
			var time = Math.round((Date.now() - start) / 100) / 10;
			console.log("Read complete in " + time + "s", "\n");
		});

	es.readArray(paths)
		.pipe(trackStream)
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
		if (err) {
			return console.error(err);
		}
		console.log("Complete");
	});
}
