# Music Organizer

Organizer music files using the [MusicBrainz Music
Database](http://musicbrainz.org/)

## Installation

```
npm install music-organizer
```
 * taglib (`brew install taglib`)
 * python + pip (`brew install python`)
 * `pip install cython`
 * `pip install pytaglib`

# Notes

 * "Crawl" input tracks
 * determine release present
	for all releases in all tracks
		if in all tracks
 * if no releases error
 * if multiple releases give choice
 * update tags based on info, warn when different from existing tags

 * File
	* path
	* tags
	* n Track
	* n Releases

 * Track
	* 1 File
	* 1 Release

 * Release
	* n Tracks
	* n Files

Pick Release
Get all files 
Sort files by number of unwritten tracks
for each file
	select from available tracks
	write track info
	mark tracked as used

# Reduce releases

 * has same data properties
 * has same tracks

# Reduce tracks

for each file in release
for each track
reduce if has same data properties
