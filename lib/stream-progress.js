// jshint node:true
"use strict";

var progress = require("./progress");

module.exports = function(stream, options) {
	var bar = progress(options);
	var write = stream.write;
	var complete = 0, total = 0;
	function update() {
		bar.set((complete / total) || 0);
	}
	stream.write = function() {
		write.apply(stream, arguments);
		total += 1;
		update();
	};
	stream.on("data", function() {
		complete += 1;
		update();
	});
	stream.on("end", function() {
		bar.terminate();
	});
	return stream;
};
