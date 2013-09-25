// jshint node:true
"use strict";

// Attach event listener "before" other callbacks
// @TODO extract
module.exports = function(ee, event, callback) {
	var emit = ee.emit;
	ee.emit = function(e) {
		if (e === event) {
			callback.apply(null, arguments);
		}
		emit.apply(this, arguments);
	};
};
