// jshint node:true
"use strict";

var async = require("async"),
	es = require("event-stream"),
	pickTags = require("./tags"),
	update = require("./update"),
	select = require("./select");

module.exports = function organize(data) {
	return es.map(function(data, callback) {
		async.waterfall([
			select.release.bind(null, data.releases),
			pickTags,
			update,
		], callback);
	});
};
