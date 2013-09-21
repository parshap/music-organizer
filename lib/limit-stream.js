// jshint node:true
"use strict";

var es = require("event-stream");

module.exports = function(limit) {
	var count = 0;

	return es.through(function(data) {
		if (count < limit) {
			count += 1;
			this.emit("data", data);
		}
		else {
			this.end();
		}
	});
};
