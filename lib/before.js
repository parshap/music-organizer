// jshint node:true
"use strict";

// Attach event listener "before" other callbacks
// @TODO extract
module.exports = function(ee, event, callback) {
	var emit = ee.emit;
	ee.emit = function(e) {
		if (e === event) {
			callback.apply(null, Array.prototype.slice.call(arguments, 1));
		}
		emit.apply(this, arguments);
	};
};
