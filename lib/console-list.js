// jshint node:true
"use strict";

module.exports = function(list) {
	list.forEach(function(item, i) {
		var number = i + 1,
			prefix = " " + number + ".";
		console.log(prefix, item);
	});
};
