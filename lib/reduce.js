// jshint node:true
"use strict";

module.exports.tracks = function(tracks) {
  return reduce(tracks, getTrackID);
};

module.exports.releases = function(releases) {
  return reduce(releases, getReleaseID, mergeReleases);
};

function reduce(array, idfn, mergefn) {
  var retval = [], seen = {};
  array.forEach(function(item) {
    var id = idfn(item);
    // New item
    if ( ! seen[id]) {
      retval.push(item);
      seen[id] = true;
    }
    // Already seen this item, merge the two
    else if (mergefn) {
      mergefn(seen[id], item);
    }
  });
  return retval;
}

function getTrackID(track) {
  return JSON.stringify(track.data());
}

function getReleaseID(release) {
  var data = release.data();
  data.tracks = release.tracks.slice(0)
    .map(getTrackID)
    // Sort tracks in consistent manner
    .sort(function(a, b) {
      return a.localeCompare(b);
    });
  return JSON.stringify(data);
}

function mergeReleases(release1, release2) {
  // Use earlier date
  if ( ! release1.date) {
    release1.date = release2.date;
  }
  else if (release2.date && compareDates(release1.date, release2.date) > 0) {
    release1.date = release2.date;
  }
}

function compareDates(date1, date2) {
  var dyear = date1.year - date2.year,
    dmonth = date1.month - date2.month,
    dday = date1.day - date2.day;
  if (dyear !== 0) {
    return dyear;
  }
  if (dmonth !== 0) {
    return dmonth;
  }
  return dday;
}
