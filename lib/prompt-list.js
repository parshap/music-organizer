// jshint node:true
"use strict";

var isInteger = require("is-integer"),
	consoleList = require("./console-list"),
	prompt = require("./prompt");

module.exports = function recursivePromptList(text, releases, options, callback) {
	promptList(text, releases, options, function(err, value) {
		if (err) return recursivePromptList(text, releases, callback);
		callback(null, value);
	});
};


function promptList(text, list, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = {};
	}

	var toString = options.hasOwnProperty("toString") ?
		options.toString :
		function(item) {
			return item.toString();
		};

	consoleList(list.map(toString));
	prompt(text, function(err, val) {
		var index = Number(val);
		if (isInteger(index) && index > 0 && index <= list.length) {
			callback(null, list[index - 1]);
		}
		else {
			callback(new Error("Invalid selection"));
		}
	});
}
