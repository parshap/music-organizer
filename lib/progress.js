// Based on https://github.com/visionmedia/node-progress
// jshint node:true
"use strict";

var readline = require("readline"),
	color = require("cli-color");

var DEFAULT_OPTIONS = {
	width: 30,
};

module.exports = function(options) {
	options = parseOptions(options);

	var rl = createInterface(options);
	rl.render(0, options.width);

	return {
		set: function(value) {
			rl.render(value, options.width);
		},
		terminate: function() {
			rl.terminate();
		},
	};
};

function parseOptions(options) {
	options = options || {};
	Object.keys(DEFAULT_OPTIONS).forEach(function(key) {
		if ( ! options.hasOwnProperty(key)) {
			options[key] = DEFAULT_OPTIONS[key];
		}
	});
	return options;
}

function createInterface(options) {
	var rl = readline.createInterface({
		input: process.stdin,
		output: options.stream || process.stdout
	});
	rl.setPrompt('', 0);
	rl.clearLine = function() {
		this.write(null, {ctrl: true, name: 'u'});
	};
	var lastString;
	rl.render = function(value, width) {
		var complete = Math.round(value * width);
		var string = createString(complete, width);
		if (string !== lastString) {
			lastString = string;
			rl.clearLine();
			rl.write(createString(complete, width));
		}
	};
	rl.terminate = function() {
		this.resume();
		this.close();
		this.output.write("\n");
	};
	return rl;
}

function createString(complete, width) {
	return color.bgBlack.white("[") +
		color.bgBlack.white(new Array(complete).join("=")) +
		color.black(new Array(width - complete).join("-")) +
		color.bgBlack.white("]");
}
