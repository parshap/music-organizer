// jshint node:true
"use strict";

var test = require("tape"),
	taglib = require("../lib/taglib");

test("read", function(t) {
	taglib.read("test-album/01 999,999.mp3", function(err, data) {
		t.ifError(err);
		t.ok(data);
		console.log(data);
		t.end();
	});
});

test("write", function(t) {
	var data = {
		"ARTIST": ["bob"],
	};

	taglib.write("test-album/01 999,999.mp3", data, function(err) {
		t.ifError(err);
		t.end();
	});
});
