// jshint node:true
"use strict";

var test = require("tape"),
	es = require("event-stream");

var TEST_DATA = require("./data.json");

var parse = require("../lib/parse"),
	select = require("../lib/select");

var data;

test("select release", function(t) {
	es.readArray(TEST_DATA).pipe(parse(function(data) {
		select.release(data.releases, function(err, release) {
			t.ok(release);
			t.ifError(err);
			t.end();
		});
	}));
});
