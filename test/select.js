// jshint node:true
"use strict";

var test = require("tape"),
	es = require("event-stream");

var TEST_DATA = require("./data.json");

var parse = require("../lib/parse"),
	createDatabase = require("../lib/database"),
	select = require("../lib/select");

test("select release", function(t) {
	var db = es.readArray(TEST_DATA)
		.pipe(parse())
		.pipe(createDatabase());

	var files;
	db.pipe(createFilter("file"))
		.pipe(es.writeArray(function(err, array) {
			files = array;
		}));

	db.pipe(createFilter("release"))
		.pipe(es.writeArray(function(err, releases) {
			select.release(releases, files, function(err, release) {
				t.ok(release);
				t.ifError(err);
				t.end();
			});
		}));
});

var filter = require("stream-filter");
function createFilter(type) {
	return filter(function(data) {
		return data.type === type;
	});
}
