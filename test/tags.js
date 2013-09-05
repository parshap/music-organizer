// jshint node:true
"use strict";

var test = require("tape"),
	es = require("event-stream");

var TEST_DATA = require("./data.json");

var parse = require("../lib/parse"),
	pickTags = require("../lib/tags");

var data;

test("parse data", function(t) {
	es.readArray(TEST_DATA).pipe(parse(function(data) {
		pickTags(data.releases[4], function(err, tags) {
			t.equal(tags.length, 10);
			t.ifError(err);
			t.end();
		});
	}));
});
