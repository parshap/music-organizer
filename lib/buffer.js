// jshint node:true
"use strict";

var through = require("event-stream").through;

module.exports = function() {
	var stream = through(function(data) {
		this.buffer.push(data);
	});
	stream.replay = function(stream) {
		this.buffer.forEach(function(data) {
			stream.write(data);
		});
		stream.end();
	};
	stream.buffer = [];
	return stream;
};
