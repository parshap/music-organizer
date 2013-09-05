// jshint node:true
"use strict";

var level = require("levelup"),
	MemDOWN = require("memdown"),
	sublevel = require("level-sublevel"),
	assoclevel = require("level-assoc");

module.exports = function Database(fn) {
	if ( ! (this instanceof Database)) {
		return new Database(fn);
	}

	var db = sublevel(level("mem", {
			db: memdownFactory,
			valueEncoding: "json",
		})),
		assoc = assoclevel(db);

	assoc.add("file")
		.hasMany("tracks", [ "type", "track" ]);

	assoc.add("release")
		.hasMany("tracks", [ "type", "track"]);

	assoc.add("track")
		.belongsTo("release")
		.belongsTo("file");

	// -- Public API

	["get", "list", "live"].forEach(function(key) {
		this[key] = assoc[key].bind(assoc);
	}.bind(this));

	["createReadStream", "createWriteStream"].forEach(function(key) {
		this[key] = db[key].bind(db);
	}.bind(this));

	db.on("ready", fn);
};

function memdownFactory(location) {
	return new MemDOWN(location);
}
