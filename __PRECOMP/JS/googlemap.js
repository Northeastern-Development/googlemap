/**************************************************
Neoscape Google Maps Engine
v2.1.0

Description:
This engine sets up a google maps instance and
provides access to set positioning and styles of
markers and other overlays

**************************************************/





// global vars to be used throughout the functions, etc. below
var _mapSettings;
var _mapData;
var _mapConfig;
var _cMarker = "";
var _googleMap = null;
var _jsonFiles = null;





/**************************************************
FUNCTION: ##configMap

Description:
This function will set the config and data files

Parameters:
a = the files object

Returns:
N/A

**************************************************/
configMap = function(a){  // a = the map settings on where to find config and data
  _jsonFiles = a;
  $.getJSON("_datastore/maps/"+_jsonFiles[0]+".json",function(data){
    _mapConfig = data;

    // in case there is something that we need to add as expansion, we can pass it in as an option var
    var gMapConfig = {}

    // call the init for the map now that we have all of the data collected
    $.getJSON("_datastore/maps/"+_jsonFiles[1]+".json",function(data){
      _mapData = data;

      // call the init for the map now that we have all of the data collected
      loadMap(gMapConfig);
    });
  });
}
/*************************************************/





/**************************************************
FUNCTION: ##loadMap

Description:
perform the initial map load if requested and then`
call the map init if all loaded properly

Parameters:
options: left for future additions, CNIU

Returns:
N/A

**************************************************/
loadMap = function(options){
  _mapSettings = {
     zoom:_mapConfig.config.zooms
    ,type:(options.type?options.type:"lists")
    ,level:_mapConfig.config.zooms.start
    ,inMotion:false
  };
  m = document.createElement("script");
  m.setAttribute("src","https://maps.googleapis.com/maps/api/js?key="+_mapConfig.config.apikey+"&callback=initMap");
  document.body.appendChild(m);
}
/*************************************************/





/**************************************************
FUNCTION: ##initMap

Description:
kick off adding the map to the page and handling
markers, etc. to attach them to the map object

Parameters:
N/A

Returns:
N/A

**************************************************/
initMap = function(){

  // build out the category and zoom level nav items and add them to the page
  $.post("_scripts/php/mapnav.php",{config:_jsonFiles[0],data:_jsonFiles[1]},function(result){
    $(_mapConfig.config.navtarget).prepend(result);
    if(_mapData.levels[_mapSettings.zoom.start].categories){
      showHideCategoryNav(true);
    }

    // set up inner scrolls on the accordion nav
    $("div.neo__map-container div.neo__map-categorynav > ul > li:not(.noscroll) div").mCustomScrollbar({
      axis:"y",
      scrollbarPosition:"inside",
      alwaysShowScrollbar: 1,
      mouseWheel:{
        enable:true,
        axis:"y"
      }
    });
  });

  // load in the marker with label script!!!
  mm = document.createElement("script");
  mm.setAttribute("src","_scripts/js/mapmarkerwithlabel.js");  // support for markers with labels
  document.body.appendChild(mm);

  // determine if there are any markers to be shown at the starting map level!
  _mapData.contentArrays = {markersArray:[],infoWindowArray:[],overlaysArray:[],polygonsArray:[],streetviewsArray:[],timeringsArray:[],retainArray:[],startMarkerArray:[]};

  // if a start marker has been defined, let's load it on to the map and make it imprevious to removal
  if(typeof(_mapConfig.styling.startmarker) != "undefined" && _mapConfig.styling.startmarker != ""){
    setTimeout(function(){setStartMarker();},1000);
  }

  // is there any category that is marked to start open?
  var catI = 0;
  var catKeys = null;
  if(_mapData.levels[_mapSettings.zoom.start].categories){
    var catKeys = Object.keys(_mapData.levels[_mapSettings.zoom.start].categories);
  }
  var startOpen = false;
  for(x in _mapData.levels[_mapSettings.zoom.start].categories){
    if(_mapData.levels[_mapSettings.zoom.start].categories[x].startopen && _mapData.levels[_mapSettings.zoom.start].categories[x].startopen === true){
      var thisCat = catKeys[catI];
      if(_mapData.levels[_mapSettings.level].categories[thisCat].markers){ // build markers
        setTimeout(function(){createContent("markers",thisCat);},1000);
      }
      if(_mapData.levels[_mapSettings.level].categories[thisCat].overlays){  // build overlays
        setTimeout(function(){createContent("overlays",thisCat);},1000);
      }
      if(_mapData.levels[_mapSettings.level].categories[thisCat].polygons){  // build polygons
        setTimeout(function(){createContent("polygons",thisCat);},1000);
      }
      if(_mapData.levels[_mapSettings.level].categories[thisCat].streetviews && _mapConfig.styling.streetview === true){  // build streetviews
        setTimeout(function(){createContent("streetviews",thisCat);},1000);
      }
      startOpen = true;
    }
    catI++;
  }

  // if there was nothing defined to start open, show anythign else that might need to be there
  //if(!startOpen){
    // this is where we can check to see if there are any markers of overlays that need to be shown as soon as the map loads
    if(typeof(_mapData.levels[_mapSettings.zoom.start].markers) != "undefined"){ // build markers
      setTimeout(function(){createContent("markers","");},1000);
    }
    if(typeof(_mapData.levels[_mapSettings.zoom.start].overlays) != "undefined"){  // build overlays
      setTimeout(function(){createContent("overlays","");},1000);
    }
    if(typeof(_mapData.levels[_mapSettings.zoom.start].polygons) != "undefined"){  // build polygons
      setTimeout(function(){createContent("polygons","");},1000);
    }
    if(typeof(_mapData.levels[_mapSettings.zoom.start].streetviews) != "undefined" && _mapConfig.styling.streetview === true){  // build streetviews
      setTimeout(function(){createContent("streetviews","");},1000);
    }
  //}



  // initialize a new google map object into the page
  _googleMap = new google.maps.Map(document.getElementById(_mapConfig.config.target),{
    center:_mapConfig.config.mapcenter,
    zoom:_mapSettings.zoom[_mapSettings.zoom.start],
    disableDefaultUI: true,
    scrollwheel: false,
    draggable:_mapConfig.config.dragbounds.allowdragging,
    disableDoubleClickZoom:true,
    scaleControl: (_mapConfig.config.showscale == true?true:false),
    mapTypeId:_mapConfig.styling.maptype  // can be: ROADMAP, SATELITE, HYBRID, TERRAIN
  });


  // if we want to add custom styling, load that now, but only if it exists so we don't get an error!
  if(_mapConfig.styling.customstyle && _mapConfig.styling.customstyle === true){
    var customMapType = new google.maps.StyledMapType(styleObject,{
      name: 'Custom Style'
    });
    _googleMap.mapTypes.set("custom_style", customMapType);
    _googleMap.setMapTypeId("custom_style");
  }


  // if we are going to allow streetview to be used
  if(_mapConfig.styling.streetview === true){
    $(".neo__map-container").prepend("<div id=\"streetviewcontainer\"><div class=\"close\" title=\"Click here to close streetview\">X</div></div>");
  }


  // show transit info? - does not always work with custom styled maps if required layer info isn't set
  if(_mapConfig.styling.showtransit === true) showTransit();


  // do we want to allow the user to drag the map, and if yes are there any limits on how far?
  if(_mapConfig.config.dragbounds.allowdragging == true){
    var allowedBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(_mapConfig.config.dragbounds.southwest),
      new google.maps.LatLng(_mapConfig.config.dragbounds.northeast)
    );

    // this is where we will set up the listener to see if the user is panning within the allowed bounds
    google.maps.event.addListener(_googleMap,'dragend',function(){
      if(allowedBounds.contains(_googleMap.getCenter())){
        return;
      }else{
        var c = _googleMap.getCenter();
        var x = c.lng();
        var y = c.lat();
        var maxX = allowedBounds.getNorthEast().lng();
        var maxY = allowedBounds.getNorthEast().lat();
        var minX = allowedBounds.getSouthWest().lng();
        var minY = allowedBounds.getSouthWest().lat();
        if (x < minX) x = minX;
        if (x > maxX) x = maxX;
        if (y < minY) y = minY;
        if (y > maxY) y = maxY;
        _googleMap.panTo(new google.maps.LatLng(y,x));
      }
    });
  }











  // block (or not) pinch and zoom gesture on devices
  // var tblock = function (e) {
  //   console.log("dfghdfghfghdfg");
  //   if (e.touches.length > 1) {
  //       e.preventDefault()
  //   }
  //
  //   return false;
// }

//document.addEventListener("touchmove", tblock, true);
// $().on
//
// $("#showmap").on("touchmove",function(e){
  //var touch = e.touches[0]
  // console.log(touches);
  // if (e.touches.length > 1) {
  //     e.preventDefault()
  // }
//
//   return false;
// });



document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var touch = e.touches[0];
    console.log(e.touches.length);
    //console.log(touch.pageX + " - " + touch.pageY);
    //alert(touch.pageX + " - " + touch.pageY);
    return false;
}, false);













  // set up the main start marker if one is defined
  function setStartMarker(){
    var image = {
      url: "_ui/maps/startmarkersmall.png",
      scaledSize: new google.maps.Size(_mapConfig.styling.markersizes[_mapConfig.config.zooms.start][0],_mapConfig.styling.markersizes[_mapConfig.config.zooms.start][1]),
    };
    var startMarker = new google.maps.Marker({
      position: new google.maps.LatLng(_mapConfig.styling.startmarker.position.lat,_mapConfig.styling.startmarker.position.lon),
      map: _googleMap,
      icon: image
    });
    _mapData.contentArrays.startMarkerArray.push(startMarker);
  }
} // end the map init function and methods!!!





// this is to prevent the ability to pinch and zoom on a mobile device
document.body.addEventListener("touchmove", tblock, true);
var tblock = function(e){
  if(e.touches.length > 1){
      e.preventDefault()
  }
  return false;
}





// set up a listener to toggle the terrain details on/off if allowed for this map
$(document).on("click",".js_toggle",function(e){
  if($(this).attr("data-type") == "terrain"){
    showHideTerrain($(this));
  }else if($(this).attr("data-type") == "rings"){
    showHideRings();
  }
});





// this will listen for the user to click to get directions from their current location on any device
$(document).on("click","li[data-type=locator]",function(e){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(getPos);
    function getPos(pos){
     window.location.href = "http://maps.google.com/maps?saddr="+pos.coords.latitude+","+pos.coords.longitude+"&daddr="+_mapConfig.styling.startmarker.position.lat+","+_mapConfig.styling.startmarker.position.lon;
    }
  }else{
    alert("I'm sorry, this feature is disabled or unsupported by your browser.");
  }
});






// this will turn the terrain on and off if the option is available to the user and they action it
// a = the object that was actioned
showHideTerrain = function(a){
  if(_googleMap.getMapTypeId() != "terrain"){
    a.addClass("active");
    _googleMap.setMapTypeId(google.maps.MapTypeId.TERRAIN);
  }else{
    a.removeClass("active");
    mapTypeId = "google.maps.MapTypeId."+(_mapConfig.styling.maptype).toUpperCase();
    _googleMap.setMapTypeId(eval(mapTypeId));
  }
}





// this will turn time rings on and off if the option is available to the user and they action it
showHideRings = function(){
  if(_mapData.contentArrays.timeringsArray.length > 0){
    $("li[data-type=rings]").removeClass("active");
    $("li[data-type=rings]").removeClass("open");
    for(var i = 0; i < _mapData.contentArrays.timeringsArray.length; i++){
      _mapData.contentArrays.timeringsArray[i].setMap(null);
    }
    _mapData.contentArrays.timeringsArray.length = 0;
  }else{

    $("li[data-type=rings]").addClass("active");
    $("li[data-type=rings]").addClass("open");

    // gather up all of the ring data that we will need to build
    var rings = _mapData.levels[_mapSettings.level].timerings.rings;


    // this function will build out the actual circle shape should it be requested
    function drawCircle(point, radius, dir){
      var d2r = Math.PI / 180;   // degrees to radians
      var r2d = 180 / Math.PI;   // radians to degrees
      var earthsradius = 3963; // 3963 is the radius of the earth in miles
      var bounds = new google.maps.LatLngBounds();

      var points = 60;

      // find the raidus in lat/lon
      var rlat = (radius / earthsradius) * r2d;
      var rlng = rlat / Math.cos(point.lat() * d2r);


      var extp = new Array();
      if (dir==1){
        var start=0;
        var end=points+1
      }else{
        var start=points+1;
        var end=0
      }
      for (var i=start; (dir==1 ? i < end : i > end); i=i+dir){
        var theta = Math.PI * (i / (points/2));
        ey = point.lng() + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
        ex = point.lat() + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
        extp.push(new google.maps.LatLng(ex, ey));
        bounds.extend(extp[extp.length-1]);
      }
      return extp;
    }

    // loop through all of the declared rings and build them
    for(x in rings){
      if(typeof(rings[x]['fillColor']) != "undefined" && rings[x]['fillColor'] != ""){  // this is a filled circle
        var ring = new google.maps.Circle({
          strokeColor:rings[x]['strokeColor'],
          strokeOpacity:rings[x]['strokeOpacity'],
          strokeWeight:rings[x]['strokeWeight'],
          fillColor:rings[x]['fillColor'],
          fillOpacity:rings[x]['fillOpacity'],
          map:_googleMap,
          center:{lat:_mapData.levels[_mapSettings.level].timerings.center.lat,lng:_mapData.levels[_mapSettings.level].timerings.center.lon},
          radius:(rings[x]['radius'] * 1000)
        });
      }else{  // a ring with no fill was requested
          var lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity:rings[x]['strokeOpacity'],
            strokeColor:rings[x]['strokeColor'],
            strokeWeight:rings[x]['strokeWeight'],
            scale: 4
          };

          var ring = new google.maps.Polyline({
            path: drawCircle(new google.maps.LatLng(_mapData.levels[_mapSettings.level].timerings.center.lat,_mapData.levels[_mapSettings.level].timerings.center.lon),rings[x]['radius'],1),
            strokeOpacity:(typeof(rings[x]['dashed']) != "undefined" && rings[x]['dashed'][0] != false?0:rings[x]['strokeOpacity']),
            strokeColor:rings[x]['strokeColor'],
            icons:(typeof(rings[x]['dashed']) != "undefined" && rings[x]['dashed'][0] != false?[{icon:lineSymbol,offset:rings[x]['dashed'][1],repeat: rings[x]['dashed'][2]+'px'}]:""),
            strokeWeight:rings[x]['strokeWeight'],
            map:_googleMap
         });
    }



      _mapData.contentArrays.timeringsArray.push(ring);
    }

    // need to expand the area that the key is contained within
    $("li[data-type=rings]").addClass("active");
  }
}





/**************************************************
FUNCTION: ##showHideCategoryNav

Description:
determine whether or not the category navigation
should be shown for the selected zoom level

Parameters:
N/A

Returns:
N/A

**************************************************/
showHideCategoryNav = function(a){
  $("#level-"+_mapSettings.level).css({"display":"block"});
  if(a){
    $(".js-mapcategorynav").delay(250).fadeIn(500);
  }else{
    $(".js-mapcategorynav").fadeOut(500,function(){
      $(".js-mapcategorynav > ul > li").removeClass("open");
      $(".js-mapcategory").removeClass("active");
      $(".js-mapcategorynav > ul").css({"display":"none"});
    });
  }
}
/*************************************************/





/**************************************************
LISTENER: ##mapZoom

Description:
will listen for the user to select a map zoom level

Parameters:
N/A

Returns:
N/A

**************************************************/
$(document).on("click",".js-mapzoom",function(e){
  target = $(this).attr("rel");
  $(".neo__map-container ul li:not([data-type=terrain])").removeClass("active");
  $(this).addClass("active");
  $("li.open div ol li").removeClass("active");
  if(_mapSettings.inMotion === false && target != _mapSettings.level){ // if we are already moving
    _mapSettings.inMotion = true;
    step = 1;
    clearMapContent("zoom");
    _googleMap.panTo(_mapConfig.config.mapcenter);

    // clear the start marker until we are back at the selected zoom level
    _mapData.contentArrays.startMarkerArray[0].setMap(null);
    _mapData.contentArrays.startMarkerArray.length = 0;

    animateZoom = function(){
      currentZoom = _googleMap.getZoom();
      if(_mapSettings.zoom[target] > currentZoom){
        _googleMap.setZoom(currentZoom += step);
      }else if(_mapSettings.zoom[target] < currentZoom){
        _googleMap.setZoom(currentZoom -= step);
      }

      // animate block until we hit the target
      if(_googleMap.getZoom() != _mapSettings.zoom[target]){
        animateZoom();
      }else{
        setTimeout(function(){zoomDone(target);},200);
      }
    }

    zoomDone = function(target){
      _mapSettings.inMotion = false;
      _mapSettings.level = target;
      var sizer = [_mapConfig.styling.markersizes[_mapSettings.level][0],_mapConfig.styling.markersizes[_mapSettings.level][1]];

      // do we need to re-center the map for this level?
      if(typeof(_mapData.levels[target].center) != "undefined" && (typeof(_mapData.levels[target].center.lat) != "undefined" && _mapData.levels[target].center.lat != "") && (typeof(_mapData.levels[target].center.lon) != "undefined" && _mapData.levels[target].center.lon != "")){
        _googleMap.setCenter(new google.maps.LatLng(_mapData.levels[target].center.lat,_mapData.levels[target].center.lon));
      }

      var image = {
        url: "_ui/maps/startmarkersmall.png",
        scaledSize: new google.maps.Size(sizer[0],sizer[1]),
      };
      var startMarker = new google.maps.Marker({
        position: new google.maps.LatLng(_mapConfig.styling.startmarker.position.lat,_mapConfig.styling.startmarker.position.lon),
        map: _googleMap,
        icon: image
      });
      _mapData.contentArrays.startMarkerArray.push(startMarker);

      // // are there category items to show and hence require the category nav to be visible?
      if(_mapData.levels[target].categories){
        setTimeout(function(){showHideCategoryNav(true);},150); // slight delay to make sure that things did indeed load properly
      }
      // if there are no categories, are there any markers that we want to show???????????????
      if(_mapData.levels[target].markers){ // build markers
        createContent("markers","");
      }
      if(_mapData.levels[target].overlays){  // build overlays
        createContent("overlays","");
      }
      if(_mapData.levels[target].polygons){  // build polygons
        createContent("polygons","");
      }
      if(_mapData.levels[target].streetviews && _mapConfig.styling.streetview === true){  // build streetviews
        createContent("streetviews","");
      }
      return;
    }







    // hide the category nav only if it is showing and then zoom
    if($(".js-mapcategorynav").css("display") == "block"){
      showHideCategoryNav(false);
      setTimeout(function(){animateZoom();},500);
    }else{
      animateZoom();
    }
  }
});
/*************************************************/





/**************************************************
LISTENER: ##showCategory

Description:
will listen for the user to select a category of
markers to be shown on the map

Parameters:
N/A

Returns:
N/A

**************************************************/
$(document).on("click",".js-mapcategory",function(e){
  clearMapContent("category");

  // do we need to re-center the map for this level?
  if(typeof(_mapData.levels[_mapSettings.level].center) != "undefined" && (typeof(_mapData.levels[_mapSettings.level].center.lat) != "undefined" && _mapData.levels[_mapSettings.level].center.lat != "") && (typeof(_mapData.levels[_mapSettings.level].center.lon) != "undefined" && _mapData.levels[_mapSettings.level].center.lon != "")){
    _googleMap.setCenter(new google.maps.LatLng(_mapData.levels[_mapSettings.level].center.lat,_mapData.levels[_mapSettings.level].center.lon));
  }else{
    _googleMap.panTo(_mapConfig.config.mapcenter);
  }

  $("li.open div ol li").removeClass("clickedme");
  $("div.neo__map-container > div.neo__map-categorynav > ul > li div").mCustomScrollbar("scrollTo",0,0);  // reset scrollbar
  if(_mapConfig.styling.flags == "lists" || _mapConfig.styling.flags == "both"){

    catopen = $(this).parent().hasClass("open");

    $(".js-mapcategorynav > ul > li").removeClass("open");
    $(".js-mapcategory").removeClass("active");
    if(!catopen){
      $(this).parent().addClass("open");
      $(this).addClass("active");
      if(_mapData.levels[_mapSettings.level].categories[$(this).attr("rel")].markers){ // build markers
        createContent("markers",$(this).attr("rel"));
      }
      if(_mapData.levels[_mapSettings.level].categories[$(this).attr("rel")].overlays){  // build overlays
        createContent("overlays",$(this).attr("rel"));
      }
      if(_mapData.levels[_mapSettings.level].categories[$(this).attr("rel")].polygons){  // build polygons
        createContent("polygons",$(this).attr("rel"));
      }
      if(_mapData.levels[_mapSettings.level].categories[$(this).attr("rel")].streetviews && _mapConfig.styling.streetview === true){  // build streetviews
        createContent("streetviews",$(this).attr("rel"));
      }
    }
  }else if(_mapConfig.styling.flags == "flags"){
    active = $(this).hasClass("active");
    $(".js-mapcategory").removeClass("active");
    if(!active){
      createMarkers($(this).attr("rel"));
      $(this).addClass("active");
    }
  }
});
/*************************************************/





/**************************************************
FUNCTION: ##createContent

Description:
Build out content to be shown on the map

Parameters:
a = type of content: overlay, polygon, marker, streetview
b = the category to add content from

Returns:
N/A

**************************************************/
createContent = function(a,b){
  _mapSettings.inMotion = true;
  if(_mapData.levels[_mapSettings.level].categories && b != ""){
    categories = _mapData.levels[_mapSettings.level].categories;
    category = categories[b];
    theseItems = category[a];
    keys = Object.keys(category[a]);
  }else if(_mapData.levels[_mapSettings.level][a]){
    category = _mapData.levels[_mapSettings.level];
    keys = Object.keys(_mapData.levels[_mapSettings.level][a]);
    theseItems = _mapData.levels[_mapSettings.level][a];
    b = _mapSettings.level;
  }
  cnt = 0;
  var runMe = window["add"+a];  // build a dynamic function call
  for(xx in theseItems){
    runMe(theseItems[xx],Array(category,b),keys[cnt]);
    cnt++;
  }
  _mapSettings.inMotion = false;
}
/*************************************************/





/**************************************************
FUNCTION: ##addStreetview

Description:
This will build out a marker to denote a that a
street view option is available

Parameters:
a = the polygon object from the data
b = the polygon category
c = name of the polygon

Returns:
N/A

**************************************************/
addstreetviews = function(a,b,c){
  var streetview = new MarkerWithLabel({
    position: {lat:a.lat,lng:a.lon},
    icon:{
        url:(a.image?"_ui/maps/"+a.image:"_ui/maps/emptymarker.png"),
        origin: new google.maps.Point(0,0)
    },
    labelContent:(b[0].usename == "true" && !a.image?c:((_mapConfig.styling.flags == "lists" || _mapConfig.styling.flags == "both") && !a.image && $(".js-mapcategorynav").css("display") == "block" ?String(_mapData.contentArrays.streetviewsArray.length + 1):"")),
    labelAnchor: new google.maps.Point((_mapConfig.styling.markersizes[_mapConfig.config.zooms.start][0] / 2),_mapConfig.styling.markersizes[_mapConfig.config.zooms.start][1]),
    labelClass: "neo__map-marker"+(b[0].class && b[0].class != "" && !a.image?" "+b[0].class:""),
    animation: null,
    draggable:false,
    raiseOnDrag:false,
    map: _googleMap,
    title: c,
    id:_mapData.contentArrays.streetviewsArray.length
  });

  streetview.addListener('click',function(e){
    $("#streetviewcontainer").css({"display":"block"});
    var panorama = new google.maps.StreetViewPanorama(
      document.getElementById('streetviewcontainer'), {
      position: {lat:a.lat,lng:a.lon},
      pov: {
        heading: 34,
        pitch: 10
      }
    });
        _googleMap.setStreetView(panorama);
  });

  // are we retaining this item even if we change categories?
  retain = (typeof(a.retain) != "undefined" && a.retain == true?true:false);
  if(retain == false){// push the new marker into the array so that we can use it later
    _mapData.contentArrays.streetviewsArray.push(streetview);
  }else{
    _mapData.contentArrays.streetviewsArray.push(streetview);
  }
}


/**************************************************
FUNCTION: ##closeStreetview

Description:
This will close the streetview overlay when close
is actioned

Parameters:

Returns:
N/A

**************************************************/
$(document).on("click","#streetviewcontainer > div.close",function(){
  $("#streetviewcontainer").css({"display":"none"});
});





/**************************************************
FUNCTION: ##addPolygon

Description:
This will build out a new polygon and add it to the
map so that it can be shown

Parameters:
a = the polygon object from the data
b = the polygon category
c = name of the polygon

Returns:
N/A

**************************************************/
addpolygons = function(a,b,c){
  if(a.type == "shape"){  // add a shape
    var polygon = new google.maps.Polygon({
       paths: a.path
      ,strokeColor: a.stroke[0]
      ,strokeOpacity: a.stroke[1]
      ,strokeWeight: a.stroke[2]
      ,fillColor: a.fill[0]
      ,fillOpacity: a.fill[1]
    });
    polygon.setMap(_googleMap);
  }else if(a.type == "svg"){  // add a shape
    var svg = {
       path: a.path
      ,strokeColor: a.stroke[0]
      ,strokeOpacity: a.stroke[1]
      ,strokeWeight: a.stroke[2]
      ,fillColor: a.fill[0]
      ,fillOpacity: a.fill[1]
      ,scale: a.scale
      ,rotation: (typeof(a.rotation) != "undefined" && a.rotation > 0?a.rotation:0)
    }
    var polygon = new google.maps.Marker({
       position: a.center
      ,icon: svg
      ,map: _googleMap
      ,title:c
    });
  }else if(a.type == "line"){ // add a line

    var showSymbols = [];

    // if(typeof(a.symbols) != "undefined" && a.symbols != "" && a.symbols[0] == true){
    if(typeof(a.symbol) != "undefined" && a.symbol != false){
      var spacing = (100 / a.symbols[1]);
      var usePath = "";
      var cnt = a.symbols[1] + (a.symbols[2][0] === false?0:-1);  // animated or not, to add final arrow to non animated line
      for(var i=0;i<=cnt;i++){
        if(a.symbol[0] != undefined && a.symbol[0].length > 1){ // this means that we have an arrow as it is an array of data
          if(a.symbols[2]=="open"){
            usePath = (a.symbol[1]=="forward"?google.maps.SymbolPath.FORWARD_OPEN_ARROW:google.maps.SymbolPath.BACKWARD_OPEN_ARROW);
          }else{
            usePath = (a.symbol[1]=="forward"?google.maps.SymbolPath.FORWARD_CLOSED_ARROW:google.maps.SymbolPath.BACKWARD_CLOSED_ARROW);
          }
        }else{  // this is a custom path
          usePath = a.symbol;
        }
        showSymbols[showSymbols.length] = {icon: {path:usePath,strokeColor:a.symbols[0][0],strokeOpacity:a.symbols[0][1],strokeWeight:a.symbols[0][2],fillColor:a.symbols[0][3],fillOpacity:a.symbols[0][4],scale:a.symbols[0][5]},offset: (spacing * i)+"%"};
      }
    }


    // set a dash on the line, cannot be used with animations
    if(typeof(a.stroke[3]) != "undefined" && a.stroke[3] != ""){
      var dash = {
         path: a.stroke[3][2]
        ,strokeOpacity: 1
        ,strokeColor: a.stroke[3][1]
        ,scale: 4
      }
      showSymbols[showSymbols.length] = {icon:dash,offset:0,repeat:a.stroke[3][0]+"px"}
    };

    var polygon = new google.maps.Polyline({
       path: a.path
      ,geodesic: true
      ,strokeColor: a.stroke[0]
      ,strokeOpacity: a.stroke[1]
      ,strokeWeight: a.stroke[2]
      ,icons:showSymbols
    });
    polygon.setMap(_googleMap);

    // animation can only occur with ONE icon
    if(typeof(a.symbols) != "undefined" && a.symbols[2][0] == true){
      var count = (a.symbols[2][2] == "backward"?200:0);
      var cnt = 0;
      var runCount = (typeof(a.symbols[2][3]) != "undefined" && a.symbols[2][3] > 0?a.symbols[2][3]:false);
      var animation;
      var speed = a.symbols[2][1];
      animation = window.setInterval(function(){
        if(a.symbols[2][2] == "backward" && count == 0){
          count = 200;
        }
        count = (a.symbols[2][2] == "forward"?((count + 1) % 200):((count - 1) % 200));
        var icons = polygon.get('icons');
        icons[0].offset = (count / 2) + '%';
        polygon.set('icons',icons);
        if(runCount != false && count == 199){  // if we are restricting how many times the animation will occur
          cnt++;
          if(cnt == runCount){
            clearInterval(animation);
          }
        }
      },speed);
    }
  }

  if(typeof(a.retain) != "undefined" && a.retain == true){  // prevent this item from being removed when content is cleared
    _mapData.contentArrays.retainArray.push(polygon);
  }else{  // we do not care if this is removed
    _mapData.contentArrays.polygonsArray.push(polygon);
  }
};
/*************************************************/





/**************************************************
FUNCTION: ##addOverlay

Description:
This will build out a new overlay and add it to the
map so that it can be shown

Parameters:
a = the overlay object from the data
b = the overlay category
c = name of the overlay

Returns:
N/A

**************************************************/
addoverlays = function(a,b,c){
  // set the overlay bounds that the item should fit inside
  var overlayBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(a.swlat,a.swlon),   //southwest
    new google.maps.LatLng(a.nelat,a.nelon)    // northeast
  );

  // build out a new overlay object
  mapOverlay.prototype = new google.maps.OverlayView();
  var overlay = new mapOverlay(
    overlayBounds,
    "_ui/maps/"+a.image,
    _googleMap,
    (typeof(a.retain) != "undefined" && a.retain == true?true:false)
  );

  // this is the main overlay constructor method
  function mapOverlay(overlayBounds, image, _googleMap, retain) {

    // Initialize all properties for the overlay
    this.bounds_ = overlayBounds;
    this.image_ = image;
    this.map_ = _googleMap;
    this.retain_ = retain

    // Define a property to hold the image's div
    this.div_ = null;

    // Explicitly call setMap on this overlay.
    this.setMap(_googleMap);
  }


  mapOverlay.prototype.onAdd = function(){

    var div = document.createElement('div');
    div.style.borderStyle = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';

    // Create the img element and attach it to the div.
    var img = document.createElement('img');
    img.src = this.image_;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.position = 'absolute';
    div.appendChild(img);
    this.div_ = div;

    // Add the element to the "overlayLayer" pane.
    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
    if(this.retain_ == false){  // if we don't care about holding on to the layer when clearing
      _mapData.contentArrays.overlaysArray.push(overlay);
    }else{  // if we want to make sure that the layer does not get cleared
      _mapData.contentArrays.retainArray.push(overlay);
    }
  };


  mapOverlay.prototype.draw = function(){

    // project the overlay on to the map
    var overlayProjection = this.getProjection();

    // Retrieve the south-west and north-east coordinates of this overlay
    var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
    var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

    // Resize the image's div to fit the indicated dimensions.
    var div = this.div_;
    div.style.left = sw.x + 'px';
    div.style.top = ne.y + 'px';
    div.style.width = (ne.x - sw.x) + 'px';
    div.style.height = (sw.y - ne.y) + 'px';
  };

  // this will allow us to remove the overlay from the map
  mapOverlay.prototype.onRemove = function(){
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  };
}
/*************************************************/





/**************************************************
FUNCTION: ##addMarker

Description:
This will build out a new marker and add it to the
map so that it can be shown and interacted with

Parameters:
a = the marker object from the data
b = the marker category
c = name of the marker

Returns:
N/A

**************************************************/
addmarkers = function(a,b,c){
  var marker = new MarkerWithLabel({
    position: {lat:a.lat,lng:a.lon},
    icon:{
        url:(a.image?"_ui/maps/"+a.image:"_ui/maps/emptymarker.png"),
        origin: new google.maps.Point(0,0)
    },
    labelContent:(b[0].usename == "true" && !a.image?c:((_mapConfig.styling.flags == "lists" || _mapConfig.styling.flags == "both") && !a.image && $(".js-mapcategorynav").css("display") == "block" ?String(_mapData.contentArrays.markersArray.length + 1):"")),
    labelAnchor: new google.maps.Point((_mapConfig.styling.markersizes[_mapConfig.config.zooms.start][0] / 2),_mapConfig.styling.markersizes[_mapConfig.config.zooms.start][1]),
    labelClass: "neo__map-marker"+(b[0].class && b[0].class != "" && !a.image?" "+b[0].class:"")+(a.class && a.class != ""?" "+a.class:""),
    animation: null,
    //animation: google.maps.Animation.DROP,
    draggable:false,
    raiseOnDrag:false,
    map: _googleMap,
    title: c,
    id:_mapData.contentArrays.markersArray.length
  });

  //marker.setAnimation(google.maps.Animation.DROP);


  // do we need to show an infowindow given the type of marker we are building?
  //console.log(a);
  if((_mapConfig.styling.flags == "flags" || _mapConfig.styling.flags == "both") && b[0].usename != "true"){
    if((typeof(b[0].clickable) === 'undefined' || b[0].clickable === true) && (typeof(a.clickable) === 'undefined' || a.clickable === true)){
      infoWindow = new google.maps.InfoWindow({
        maxWidth:200,
        id:_mapData.contentArrays.infoWindowArray.length
      });
      _mapData.contentArrays.infoWindowArray.push(infoWindow);
      thisInfo = _mapData.contentArrays.infoWindowArray[(_mapData.contentArrays.infoWindowArray.length - 1)];

      // add any other patterns to find and replace to match up to category nav items from php
      var thisCatItem = b[1].replace(/ |&amp;|&eacute;/g,"");

      // this function will build the info window content to be shown
      // a = the specific marker info
      // b = the title of the marker to be shown
      buildInfoWindow = function(a,b){

        // do we need to handle any transit options for this marker?
        var transit = false;
        if(typeof(a.transit) != "undefined"){
          transit = "<p>Public Transit:<br />";
          Object.keys(a.transit).forEach(function(key){
            transit += (typeof(a.transit[key].url) != "undefined" && a.transit[key].url != ""?"<a href=\""+a.transit[key].url+"\" title=\"View route and schedule\" target=\"_blank\">":"")+key+(typeof(a.transit[key].url) != "undefined" && a.transit[key].url != ""?"</a>":"")+"<br />";
          });
          transit += "</p>";
        }

        // prep the return value to appear in the info window
        // return "<div class=\"neo__map-markerinfo\"><h1>"+b+"</h1>"+(a.details && a.details != ""?"<p>"+a.details:"</p>")+(transit !== false ? transit:"")+(a.directions && a.directions == true?"<p><a href=\"http://maps.google.com/maps?saddr="+a.lat+","+a.lon+"&daddr="+_mapConfig.styling.startmarker.position.lat+","+_mapConfig.styling.startmarker.position.lon+"\" title=\"Click here to get directions to this location\" target=\"_blank\">GET DIRECTIONS</a></p>":"")+"</div>";
        return "<div class=\"neo__map-markerinfo\"><h1>"+b+"</h1>"+(a.details && a.details != ""?"<p>"+a.details:"</p>")+(a.directions && a.directions == true?"<p><a href=\"http://maps.google.com/maps?saddr="+a.lat+","+a.lon+"&daddr="+_mapConfig.styling.startmarker.position.lat+","+_mapConfig.styling.startmarker.position.lon+"\" title=\"Click here to get directions to this location\" target=\"_blank\">Get Directions -> </a></p>":"")+(a.website && a.website != ""?"<p><a href=\""+a.website+"\" title=\"Click here to get view this location website\" target=\"_blank\">View Website -> </a></p>":"")+(a.line && a.line != ""?"<p><a href=\""+a.line+"\" title=\"Click here to view the schedules and maps for this line\" target=\"_blank\">Schedules and Maps -> </a></p>":"")+"</div>";

      }

      // listen for the user to click on a marker to reveal the infowindow
      marker.addListener('click',function(e){
        _googleMap.panTo({lat:a.lat,lng:a.lon});
        thisInfo.setContent(buildInfoWindow(a,c));
        thisInfo.open(_googleMap,marker);
        _cMarker = marker.title;
        //animateMarker(marker);
        //console.log(e);
        //console.log(mapData.contentArrays.markersArray[marker.id]);
        //animateMe = marker;
        //marker.setAnimation(null);
        //(mapData.contentArrays.markersArray[marker.id]).setAnimation(google.maps.Animation.BOUNCE);
        //marker.setAnimation(google.maps.Animation.DROP);
        //mapData.contentArrays.markersArray[marker.id].setAnimation(google.maps.Animation.BOUNCE);
        // $(".js-mapcategorynav > ul > li.open > div ol > li").removeClass("active");
        // $("li.open div ol li").removeClass("active");
        // $("#"+thisCatItem+"-"+marker.id).addClass("active");
        $("li.open div ol li").removeClass("clickedme");
        $("#"+thisCatItem+"-"+marker.id).addClass("clickedme");
        if($("#"+thisCatItem+"-"+marker.id).parent().parent().hasClass("mCSB_container")){
          $(this).parent().parent().parent().mCustomScrollbar("scrollTo","#"+thisCatItem+"-"+marker.id);  // auto-scroll if not visible
        }
      });

      // this will animate the marker that is passed to it as a closure
      // a = the marker to be animated
      animateMarker = function(a){
        //console.log(a.animation);
        if (a.getAnimation() !== null) {
          a.setAnimation(null);
        } else {
          a.setAnimation(google.maps.Animation.BOUNCE);
        }
        //console.log(a.animation);
      }

      // listen for the user to close the infowindow using the close button
      infoWindow.addListener('closeclick',function(){
        $("li.open div ol li").removeClass("clickedme");
        $(this).parent().parent().parent().mCustomScrollbar("scrollTo","top");  // auto-scroll if not visible

        // do we need to re-center the map for this level?
        if(typeof(_mapData.levels[_mapSettings.level].center) != "undefined" && (typeof(_mapData.levels[_mapSettings.level].center.lat) != "undefined" && _mapData.levels[_mapSettings.level].center.lat != "") && (typeof(_mapData.levels[_mapSettings.level].center.lon) != "undefined" && _mapData.levels[_mapSettings.level].center.lon != "")){
          _googleMap.setCenter(new google.maps.LatLng(_mapData.levels[_mapSettings.level].center.lat,_mapData.levels[_mapSettings.level].center.lon));
        }else{
          _googleMap.panTo(_mapConfig.config.mapcenter);
        }
      });

      // set up a custom listener for when the user clicks on a list item in the category nav and highlight/active items
      $(document).off("click","#"+thisCatItem+"-"+_mapData.contentArrays.markersArray.length);
      $(document).on("click","#"+thisCatItem+"-"+_mapData.contentArrays.markersArray.length,function(){
        thisInfo.setContent(buildInfoWindow(a,c));
        $("li.open div ol li").removeClass("clickedme");
        for(x in _mapData.contentArrays.infoWindowArray){
          _mapData.contentArrays.infoWindowArray[x].close();
          _mapData.contentArrays.infoWindowArray[x].isVisible == false;
        }
        if(marker.title != _cMarker){
          $(this).addClass("clickedme");
          _cMarker = marker.title;
          thisInfo.open(_googleMap, marker);
          _googleMap.panTo({lat:a.lat,lng:a.lon});
        }else{  // closing the marker
          _cMarker = "";

          // do we need to re-center the map for this level?
          if(typeof(_mapData.levels[_mapSettings.level].center) != "undefined" && (typeof(_mapData.levels[_mapSettings.level].center.lat) != "undefined" && _mapData.levels[_mapSettings.level].center.lat != "") && (typeof(_mapData.levels[_mapSettings.level].center.lon) != "undefined" && _mapData.levels[_mapSettings.level].center.lon != "")){
            _googleMap.setCenter(new google.maps.LatLng(_mapData.levels[_mapSettings.level].center.lat,_mapData.levels[_mapSettings.level].center.lon));
          }else{
            _googleMap.panTo(_mapConfig.config.mapcenter);
          }
        }
      });
    }
  }

  // are we retaining this item even if we change categories?
  retain = (typeof(a.retain) != "undefined" && a.retain == true?true:false);
  if(retain == false){// push the new marker into the array so that we can use it later
    _mapData.contentArrays.markersArray.push(marker);
  }else{
    _mapData.contentArrays.retainArray.push(marker);
  }
}
/*************************************************/





/**************************************************
FUNCTION: ##clearMapContent

Description:
Clear out any markers, info windows, overlays, etc.
that may have been added to the map...zoom will
clear ALL markers even if set to retain, category
will clear  only those not set to retain true as
the user changes categories

Parameters:
a = zoom | category

Returns:
N/A

**************************************************/
clearMapContent = function(a){
  $(".js-mapcategorynav ul li ol li").removeClass("active");

  var clearThese = ["markersArray","infoWindowArray","overlaysArray","polygonsArray","streetviewsArray"];
  for(x in clearThese){
    for(i = 0; i < _mapData.contentArrays[clearThese[x]].length; i++){
      _mapData.contentArrays[clearThese[x]][i].setMap(null);
    }
    _mapData.contentArrays[clearThese[x]].length = 0;
  }
  if(a == "zoom"){  // clear everything when we change zoom levels!!!
    var clearThese = ["retainArray","timeringsArray"];
    for(x in clearThese){
      for(i = 0; i < _mapData.contentArrays[clearThese[x]].length; i++){
        _mapData.contentArrays[clearThese[x]][i].setMap(null);
      }
      _mapData.contentArrays[clearThese[x]].length = 0;
    }
  }
}
/*************************************************/





/**************************************************
LISTENER: ##resize

Description:
Listen for the browser window to be re-sized

Parameters:
N/A

Returns:
N/A

**************************************************/
$(window).resize(function(){
  if(_googleMap){  // only do this if a map object exists!!!
    $("li.open div ol li").removeClass("clickedme");
    $(".js-mapcategorynav > ul > li").removeClass("open");
    $(".js-mapcategory").removeClass("active");
    $("div.neo__map-container > div.neo__map-categorynav > ul > li div").mCustomScrollbar("scrollTo",0,0);
    clearMapContent();
    // _googleMap.panTo(_mapConfig.config.mapcenter);
    //_googleMap.panTo(_mapConfig.config.mapcenter);



    // do we need to re-center the map for this level?
    if(typeof(_mapData.levels[_mapSettings.level].center) != "undefined" && (typeof(_mapData.levels[_mapSettings.level].center.lat) != "undefined" && _mapData.levels[_mapSettings.level].center.lat != "") && (typeof(_mapData.levels[_mapSettings.level].center.lon) != "undefined" && _mapData.levels[_mapSettings.level].center.lon != "")){
      _googleMap.panTo(new google.maps.LatLng(_mapData.levels[_mapSettings.level].center.lat,_mapData.levels[_mapSettings.level].center.lon));
    }else{
      _googleMap.panTo(_mapConfig.config.mapcenter);
    }





  }
});
/*************************************************/





/**************************************************
FUNCTION: ##showTransit

Description:
Toggle the transit layer on/off if desired

Parameters:
N/A

Returns:
N/A

**************************************************/
showTransit = function(){
  var transitLayer = new google.maps.TransitLayer();
  transitLayer.setMap(_googleMap);
}
/*************************************************/






/**************************************************
FUNCTION: ##checkPosition

Description:
Check on scroll to see if the map content area is
still visible on the screen, and if no collapse it
and hide any layers of content that may be open to
reset the map for another use

Parameters:
N/A

Returns:
N/A

**************************************************/
checkPosition = function(){

}
/*************************************************/

$("a[rel="+$("body").attr("id")+"]").addClass("active");

// $('#nu__campuses ul li').click(function(){
//   $(this).addClass('trent');
// })
