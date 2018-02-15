<?php
  // grab the config and maps data based on the value we are being passed
  $c = json_decode(file_get_contents("../../_datastore/maps/".$_POST['config'].".json"),true);
  $d = json_decode(file_get_contents("../../_datastore/maps/".$_POST['data'].".json"),true);

  // set up the data object to be used all over this page to get specific information or config options
  $mapData = ["setup"=>$c,
              "data"=>$d,
              "lvlkeys"=>array_keys($d['levels']),
              "maxbeforescroll"=>5,
              "replacethese"=>array(" ","&amp;","&eacute;")];

  // this will hold the values to be returned when we are all done
  $return = ["lvlnav"=>"",
             "catnav"=>""];

  // if allowed, users can turn terrain on and off
  if($mapData['setup']['styling']['terraintoggle'] && $mapData['setup']['styling']['maptype'] != "terrain"){
    $return['lvlnav'] .= "<li class=\"neo__toggle js_toggle\" data-type=\"terrain\" title=\"Click here to toggle terrain on/off\">T</li>";
  }

  // loop through and build out the navigation to control the zoom level on the map
  foreach($mapData['lvlkeys'] as $lvl){
    $return['lvlnav'] .= buildLvlNav($lvl);
    if(!isset($mapData['setup']['config']['combinenav']) || !$mapData['setup']['config']['combinenav']){  // combine or not to combine
      $return['catnav'] .= buildCatNav($lvl);
    }
  }

  // set the return to JS
  setReturn();


  // this function will build out the zoom level nav elements
  function buildLvlNav($a=""){
    global $mapData;
    if(count($mapData['lvlkeys']) > 1){  // only if more than 1 is provided
      if(!isset($mapData['setup']['config']['combinenav']) || !$mapData['setup']['config']['combinenav']){ // separate level and cat nav
        $guide = "<li rel=\"%s\" title=\"Click here to zoom to the %s level\" class=\"js-mapzoom%s\"><p>%s</p></li>";
      }else{ // combined zoom and cat nav
        $guide = "<li rel=\"%s\" title=\"Click here to zoom to the %s level\" class=\"js-mapzoom%s combined\"><p>%s</p><div class=\"neo__map-categorynav js-mapcategorynav combined\">%s</div></li>";
      }
      return sprintf($guide,
                     $a,
                     $a,
                     (strtolower($mapData['setup']['config']['zooms']['start']) == strtolower(ucwords($a))?" active":""),
                     $a,
                     buildCatNav($a));
    }
  }




  // this function will build out the category nav items
  function buildCatNav($a=""){
    global $mapData;
    $return = "";
    $lvlData = $mapData['data']['levels'][$a];
    $mapStyles = $mapData['setup']['styling'];
    if(isset($lvlData['categories'])){
      $return .= "<ul id=\"level-".$a."\">";
      $catKeys = array_keys($lvlData['categories']);
      foreach($catKeys as $cat){
        $catItems = "";
        $cnt = 0;
        // let's tackle order item markers here
        $itemKeys = array_keys($lvlData['categories'][$cat]['markers']);
        if(!isset($lvlData['categories'][$cat]['usename']) || $lvlData['categories'][$cat]['usename'] == "false"){
            $catItems .= "<div><ol>";
            // loop through each item and build it out
            foreach($itemKeys as $item){
              $guide = "<li id=\"%s-%s\" title=\"%s\">%s</li>";
              $catItems .= sprintf($guide,
                                   str_replace($mapData['replacethese'],"",$cat),
                                   $cnt,
                                   $item,
                                   $item);
              $cnt++;
            }
            $catItems .= "</ol></div>";
        }

        // let's tackle polygons here as they will always need a key regardless of the flag setting
        if(isset($lvlData['categories'][$cat]['polygons']) && isset($mapStyles['polykey']) && $mapStyles['polykey'] === true){
          $itemKeys = array_keys($lvlData['categories'][$cat]['polygons']);
          $catItems = "<div><ul>";
          // loop through each item and build it out
          foreach($itemKeys as $item){
            $color = $lvlData['categories'][$cat]['polygons'][$item]['stroke'][0];
            $guide = "<li title=\"%s\"><span style=\"background:%s;\"></span><span>%s</span></li>";
            $catItems .= sprintf($guide,
                                 $item,
                                 $color,
                                 $item);
            $cnt++;
          }
          $catItems .= "</ul></div>";
        }
        $guide = "<li class=\"%s%s%s\"><h2 rel=\"%s\" title=\"Click to show/hide this category\" class=\"js-mapcategory neo__category-%s\">%s</h2>%s</li>";
        $return .= sprintf(
          $guide,
          ($catItems == ""?"nolist":""),
          (count($itemKeys) <= $mapData['maxbeforescroll']?" noscroll":""),
          (isset($lvlData['categories'][$cat]['startopen'])?" open":""),
          htmlentities($cat),
          $cat,
          ucwords($cat),
          $catItems
        );
      }

      // if allowed, users can toggle walk rings on and off
      if($mapStyles['ringstoggle']['show'] && isset($lvlData['timerings']['rings']) && $lvlData['timerings']['rings'] != ""){
        $itemKeys = array_keys($lvlData['timerings']['rings']);
        $catItems = "<div><ul>";

        // loop through each item and build it out
        foreach($itemKeys as $item){
          $color = $lvlData['timerings']['rings'][$item]['strokeColor'];
          $label = $lvlData['timerings']['rings'][$item]['label'];
          $guide = "<li title=\"%s\"><span style=\"background:%s;\"></span><span>%s</span></li>";
          $catItems .= sprintf(
            $guide,
            $item,
            $color,
            //str_replace("_"," ",$item)
            $label
          );
          $cnt++;
        }
        $catItems .= "</ul></div>";
        //die("ITEMS: ".$catItems);
        $guide = "<li class=\"neo__toggle js_toggle%s\" data-type=\"rings\" title=\"Click here to toggle %s rings on/off\"><h3>Show %s Times</h3>%s</li>";
        $return .= sprintf(
          $guide,
          (count($itemKeys) <= $mapData['maxbeforescroll']?" noscroll":""),
          $mapStyles['ringstoggle']['title'],
          $mapStyles['ringstoggle']['title'],
          $catItems
        );
      }

      // if allowed, users will be able to click to get directions from their current location
      if(isset($mapStyles['mylocation']) && $mapStyles['mylocation'] === true){
        $return .= "<li data-type=\"locator\" title=\"Click here to get directions from your current location\"><h3>Get Directions</h3></li>";
      }
      $return .= "</ul>";
    }
    return $return;
  }



  // this will actually return the data to the calling JS script so that the elements can be injected into the DOM
  function setReturn(){
    global $mapData,$return;
    if(!isset($mapData['setup']['config']['combinenav']) || !$mapData['setup']['config']['combinenav']){
      $guide = "<ul>%s</ul><div class=\"neo__map-categorynav js-mapcategorynav\">%s</div>";
    }else{
      $guide = "<ul class=\"combined\">%s</ul>";
    }
    echo sprintf($guide,
                 $return['lvlnav'],
                 $return['catnav']); // return to JS via AJAX
  }
?>
