$(window).load(function(){

  // this will prep the settings for one or more maps that can be added to the site and allow them to have different configurations as well as different data sources
  var googleMaps = {
    "location":["mapsconfig-charlotte","mapsdata-charlotte"]  // map name: config file name, data file name
  };

  configMap(googleMaps.location);  // initialize the map that you need per page like this

});
