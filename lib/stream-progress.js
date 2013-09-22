// jshint node:true
"use strict";

var through = require("event-stream").through,
	progress = require("./progress");

module.exports = function(stream, options) {
	var start = Date.now();
	var complete = 0, total = 0;
	var retval = through();

	function update() {
		retval.emit("data", (complete / total) || 0);
	}

	var write = stream.write;
	stream.write = function() {
		write.apply(stream, arguments);
		total += 1;
		update();
	};

	stream.on("end", retval.end.bind(retval));
	stream.on("data", function() {
		complete += 1;
		update();
	});

	retval.render = function() {
		var bar = progress(options);
		retval.on("data", bar.set.bind(bar));
		retval.on("end", function() {
			bar.terminate();
			var time = Math.round((Date.now() - start) / 100) / 10;
			console.log("Complete in " + time + "s", "\n");
		});
	};

	return retval;
};
