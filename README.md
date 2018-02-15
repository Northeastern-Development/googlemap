# googlemap
Northeastern Google Maps

Neoscape Google Maps
============================================

Copyright, Neoscape Inc. (http://neoscape.com)
Author: Sean Tierney





Change Log
============================================

v2.5.1 - 3/2/2017
--------------------------------------------
- change to allow zoom level root elements to appear even if a category has been selected to start open

v2.5.0 - 2/24/2017
--------------------------------------------
- fixed issue with multiple polylines in a category and improper validation of the symbols object on each line

v2.4.0 - 2/3/2017
--------------------------------------------
- the ability to specific custom symbols for polylines in svg path notation
- the ability to set a polyline opacity separately from the symbol so that it can be hidden

v2.3.1 - 1/6/2017
--------------------------------------------
- added better controls over the styling and generation of time rings
- fixed css issues with combined and separated map nav categories

v2.3.0 - 1/6/2017
--------------------------------------------
- added ability to specify center value for map per zoom level

v2.2.0 - 1/5/2017
--------------------------------------------
- added ability to specify whether a category of markers is clickable or not in the category declaration
- added ability to specify whether a marker is clickable or not in the marker declaration

v2.1.0 - 11/23/2016
--------------------------------------------
- added ability to have the level and category navigation live as separate items OR combined into one navigation using setting in config
- cleaned up and optimized the mapnav.php file to improve the speed that it runs and to make the code easier to work with
- cleaned up issue with cat nav item highlights on click
- added resize listener to clear up any open cats and nav elements to prevent weird issues when sizing the browser window

v2.0.0 - 11/11/2016
--------------------------------------------
- added ability to have different config and data files allowing for more than 1 map per site (different pages)
- moved creation of mapnav into an AJAX call, added config option to tell code where to add into DOM
- new init from project app.js file to allow for setting up multiple maps
- THIS UPDATE IS NOT BACKWARDS COMPATIBLE

v1.11.0 - 11/3/2016
--------------------------------------------
- added ability to set a category to immediately show in the nav as well as its markers, polylines, etc.

v1.10.0 - 11/2/2016
--------------------------------------------
- added ability to set a classes on individual markers as needed

v1.9.0 - 10/28/2016
--------------------------------------------
- added ability to set marker sizes per zoom level for better control and positioning

v1.6.3 - 9/6/2016
--------------------------------------------
- fixed issue with over-riding reserved .open browser functionality

v1.0.0 - 7/12/2016
--------------------------------------------
- markers with labels
- static image overlays
- option to center map on location other than property
- always on property marker
- ability to specify items to be retained when changing categories, but not between zoom levels
- option to specify vector shapes such as polygons
- option to specify polylines and add static (single or multi) or animated arrow heads (forward, reverse, etc.)
- ability to mix and match the above content types in one or multiple categories
- option to specify one or more levels of zoom, and categories or not at each
- improved JSON structure for faster reads
- added option to JSON data file to set panning bounds rather than in constructor
- added option to define the Google API key value in the constructor call
- define whether or not to show transit in JSON data
- set the size of any markers in JSON data





To Do
============================================
- re-factor portions of the code to improve loading and rendering speed as the level zoom is chugging
- smooth out the zoom animations
- add option to animate the appearance of markers when loaded
- add option to animate selected marker (maybe a bounce when selected)
- add the ability to specify at which levels transit should appear if it set to true for this project
- be sure that scrollbars within the accordion are reset as they are closed, or if the zoom is changed
- add the ability to specify markers styles by category (done) or individually





Summary, Configuration, And Options
============================================


MapsData JSON File

config{}
This chunk of the JSON file sets up some of the main configuration options for the maps implementation:
- api key
- target element within the HTML page (by ID)
- lat and lon to center the map on
- whether or not we want to allow users to pan the map, and the bounds for panning if allowed
- the zoom levels that we want to allow users to explore, also which is the starting level


styling{}
This chunk of the JSON file sets up styles for the map, markers, and other items:
- do we want to show the default transit layer provided by Google
- what types of marker flags are we going to use [lists = ordered lists|flags = clickable, no list|both]
- are we going to use a custom map style (requires style settings in mapstyles.js)
- the sizes of the markers that we will show on the map
- are we going to show a start marker for the location, which can be different from the map center


levels{}
This chunk will outline the levels that we want to allow users access to, and the categories and items to be shown  on each level:
- allows markers, raster overlays, svg, polygons, polylines
- can be specified per level, and then by category
- items can be flagged to be retained regardless of category being viewed, but not over levels
- see existing JSON file for samples of each type and functionality
