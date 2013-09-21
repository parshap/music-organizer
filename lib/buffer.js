// jshint node:true
"use strict";

var through = require("event-stream").through;

module.exports = function() {
	var buffer = [];
	var stream = through(function(data) {
		buffer.push(data);
	}, function() {});
	stream.replay = function(stream) {
		buffer.forEach(function(data) {
			stream.write(data);
		});
		stream.end();
	};
	return stream;
};
