// jshint node:true
"use strict";

// Return a new function that calls fn2 then fn1
// @TODO extract
module.exports = function(fn, beforeFn) {
	return function() {
		beforeFn.apply(this, arguments);
		return fn.apply(this, arguments);
	};
};
