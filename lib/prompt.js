// jshint node:true
"use strict";

var read = require("read");

module.exports = function prompt(text, callback) {
	read({ prompt: text}, function(err, val) {
		if (err && err.message === "canceled") {
			process.exit();
		}
		callback(err, val);
	});
};

