// jshint node:true
"use strict";

var es = require("event-stream");

module.exports = function() {
	var db = createDatabase();

	return es.through(function(data) {
		var track = data.track,
			file = db.get(data.file.id),
			release = db.get(data.release.id),
			isNewFile = ! file,
			isNewRelease = ! release;

		if (isNewFile) {
			file = data.file;
		}

		if (isNewRelease) {
			release = data.release;
		}

		// -- Set object relationships

		track.file = file;
		track.release = release;
		release.tracks.push(track);
		file.tracks.push(track);

		// -- Emit new data

		if (isNewFile) {
			db.add(file);
			this.emit("data", file);
		}

		if (isNewRelease) {
			db.add(release);
			this.emit("data", release);
		}

		this.emit("data", track);
	});
};

function createDatabase() {
	var data = {};
	return {
		add: function(obj) {
			data[obj.id] = obj;
		},
		get: function(id) {
			return data[id];
		},
	};
}
