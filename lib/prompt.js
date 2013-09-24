// jshint node:true
"use strict";

module.exports = function recursivePromptList(text, releases, options, callback) {
	promptList(text, releases, options, function(err, value) {
		if (err) return recursivePromptList(text, releases, callback);
		callback(null, value);
	});
};

var read = require("read");
function prompt(text, callback) {
	read({ prompt: text}, function(err, val) {
		if (err && err.message === "canceled") {
			process.exit();
		}
		callback(err, val);
	});
}

var isInteger = require("is-integer");
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

var color = require("cli-color");
function consoleList(list) {
	list.forEach(function(item, i) {
		var number = i + 1,
			prefix = color.white(" " + number + ". ");
		console.log(prefix, item);
	});
}
