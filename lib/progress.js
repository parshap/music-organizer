// Based on https://github.com/visionmedia/node-progress
// jshint node:true
"use strict";

var readline = require("readline");

var DEFAULT_OPTIONS = {
	width: 40,
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
	rl.input.on("data", function() {
		render(lastString);
	});
	rl.on("SIGINT", function() {
		process.kill(process.pid, "SIGINT");
	});
	rl.render = function(value, width) {
		var complete = Math.round(value * width),
			string = createString(complete, width);
		if (string !== lastString) {
			lastString = string;
			render(string);
		}
	};
	rl.terminate = function() {
		this.resume();
		this.close();
		this.output.write("\n");
	};

	function render(string) {
		rl.clearLine();
		rl.write(string);
	}

	return rl;
}

function createString(complete, width) {
	return "[" +
		new Array(complete + 1).join("=") +
		new Array(width - complete + 1).join("-") +
		"]";
}
