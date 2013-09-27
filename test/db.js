// jshint node:true
"use strict";

var test = require("tape"),
	es = require("event-stream");

var TEST_DATA = require("./data.json");

var parse = require("../lib/parse"),
	db = require("../lib/database");

test("parse data", function(t) {
	es.readArray(TEST_DATA)
		.pipe(parse())
		.pipe(db())
		.on("end", function() {
			t.end();
		});
});

// 10 files

// 8 releases

// some releases per file

// some tracks per file
