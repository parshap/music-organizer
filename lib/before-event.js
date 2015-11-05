// jshint node:true
"use strict";

var before = require("./before-fn");

// Attach event listener "before" other callbacks
// @TODO extract
module.exports = function(ee, event, callback) {
  ee.emit = before(ee.emit, function(e) {
    if (e === event) {
      callback.apply(null, Array.prototype.slice.call(arguments, 1));
    }
  });
};
