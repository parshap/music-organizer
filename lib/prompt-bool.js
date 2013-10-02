// jshint node:true
"use strict";

var prompt = require("./prompt");

module.exports = function(text, callback) {
	prompt(text + " [y/n]: ", function(err, val) {
		var result = val && "yes".slice(0, val.length) === val;
		callback(err, result);
	});
};
