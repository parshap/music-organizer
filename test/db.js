// jshint node:true
"use strict";

var test = require("tape"),
	JSONStream = require("JSONStream"),
	es = require("event-stream"),
	fs = require("fs"),
	path = require("path");

var DATA_FILE = path.join(__dirname, "data.json");

var parse = require("../lib/parse");

var data;

test("parse data", function(t) {
	fs.createReadStream(DATA_FILE)
		.pipe(JSONStream.parse("*"))
		.pipe(parse(function(d) {
			data = d;
			t.end();
		}));
});

test("10 files", function(t) {
	t.equal(data.files.length, 10);
	t.end();
});

test("8 releases", function(t) {
	t.equal(data.releases.length, 8);
	t.end();
});

test("some releases per file", function(t) {
	data.files.forEach(function(file) {
		t.ok(file.releases().length > 0);
	});
	t.end();
});

test("some tracks per file", function(t) {
	data.files.forEach(function(file) {
		t.ok(file.tracks.length > 0);
	});
	t.end();
});
