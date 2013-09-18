// jshint node:true
"use strict";

var progress = require("./progress");

module.exports = function(stream, options) {
	var complete = 0, total = 0;

	function update() {
		stream.emit("progress", (complete / total) || 0);
	}

	var write = stream.write;
	stream.write = function() {
		write.apply(stream, arguments);
		total += 1;
		update();
	};

	stream.on("data", function() {
		complete += 1;
		update();
	});

	stream.render = function() {
		var bar = progress(options);
		stream.on("progress", bar.set.bind(bar));
		stream.on("end", bar.terminate.bind(bar));
	};

	return stream;
};
