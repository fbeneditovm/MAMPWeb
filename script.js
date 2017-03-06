/**
 * Created by fbeneditovm on 01/03/17.
 */
var map; /** The map. */
var markers = []; /** The markers (points) selected on screen. */
var geometry = null; /** The polygon drawn on screen. */

var modal = document.getElementById('gml-modal'); /** The modal which will content the gml. */

/**
 * Draws the map.
 */
function initMap() {
    //The map
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -2.531962,
            lng: -44.293368
        },
        zoom: 13,
        draggable: true
    });

    /***************User Position***************/
    var posInfoWindow = new google.maps.InfoWindow({map: map});
    var defaultPos = {
        lat: -2.531962,
        lng: -44.293368
    };

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            posInfoWindow.setPosition(pos);
            posInfoWindow.setContent('You are here!');
            map.setCenter(pos);
        }, function() {
            posInfoWindow.setPosition(defaultPos);
            posInfoWindow.setContent('Not able to get your location!');
        });
    } else {
        // Browser doesn't support Geolocation
        posInfoWindow.setPosition(defaultPos);
        posInfoWindow.setContent('Your browser is not compatible with this application!');
    }

    //Adds a marker on click
    map.addListener('click', function(event) {
        addMarker(event.latLng);
    });
}

/**
 * Adds a marker to the map and push to the array.
 * @param location a latLng with the position to add the marker
 */
function addMarker(location) {
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true
    });
    markers.push(marker);
}

var angularDistance = function(p1, p2){
    var dist = Math.pow((p1.lat() - p2.lat()), 2);
    dist += Math.pow((p1.lng() - p2.lng()), 2);
    return Math.sqrt(dist);
};

/**
 * Draws the polygon at the screen and generates the GML.
 */
function generateGML(){
    var gml = null; /** The gml representing the geometry. */

    //If there is a previous geometry draw
    if(geometry != null){
        //Remove it
        geometry.setMap(null);
        geometry = null;
    }

    //Draws the polygon according to the number of markers on screen
    switch (markers.length){
        case 0:
        case 1:
            alert('At least two points are necessary to draw an area!');
            break;

        //Two markers construct a circle: the center and an external point
        case 2:
            //The first marker is the center of the cicle
            var centerPoint = markers[0].getPosition();
            //The second marker will be the first external point
            var extPoint1 = markers[1].getPosition();

            //The linear distance between the center point and the second point (the radius)
            var linDist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, extPoint1);

            var angDist = angularDistance(centerPoint, extPoint1);

            //Calculating the second external point
            var extPoint2 = new google.maps.LatLng({lat: centerPoint.lat(), lng: centerPoint.lng()+angDist});
            //The second external point can not be equal to the first one
            if(extPoint1.equals(extPoint2)){
                extPoint2 = new google.maps.LatLng({lat: centerPoint.lat(), lng: centerPoint.lng()-angDist});
            }

            //Calculating the third external point
            var extPoint3 = new google.maps.LatLng({lat: centerPoint.lat()+angDist, lng: centerPoint.lng()});
            //The third external point can not be equal to the first one
            if(extPoint1.equals(extPoint3)){
                extPoint3 = new google.maps.LatLng({lat: centerPoint.lat()-angDist, lng: centerPoint.lng()});
            }

            gml = '<p>&lt;gml:Circle&gt;</p>'
                + '&lt;gml:center&gt;'+centerPoint.lat()+','+centerPoint.lng()+'&lt;gml:center&gt;'
                + '<p>&lt;gml:coordinates&gt;';

            gml += ''+extPoint1.lat()+','+extPoint1.lng()+' '
                + ''+extPoint2.lat()+','+extPoint2.lng()+' '
                + ''+extPoint3.lat()+','+extPoint3.lng();

            gml += '&lt;/gml:coordinates&gt;</p>'
                + '<p>&lt;/gml:Circle&gt;</p>';

            //Draws the circle
            geometry = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: map,
                center: centerPoint,
                radius: linDist
            });
            break;

        //More than 2 markers construct a general straight-sided polygon (triangle, quadrilateral, ....)
        default:
            //The coordinates of the points
            var polygonCoords = [];
            gml = '<p>&lt;gml:Polygon&gt;</p>'
                + '<p>&lt;gml:outerBoundaryIs&gt;</p>'
                + '<p>&lt;gml:LinearRing&gt;</p>'
                + '<p>&lt;gml:coordinates&gt;';

            for (var i = 0; i < markers.length; i++) {
                var latlgn = markers[i].getPosition();
                polygonCoords.push(latlgn);
                gml += ''+latlgn.lat()+','+latlgn.lng()+' ';
            }
            gml += ''+polygonCoords[0].lat()+','+polygonCoords[0].lat();
            gml += '&lt;/gml:coordinates&gt;</p>'
                + '<p>&lt;/gml:LinearRing&gt;</p>'
                + '<p>&lt;/gml:outerBoundaryIs&gt;</p>'
                + '<p>&lt;/gml:Polygon&gt;</p>';


            geometry = new google.maps.Polygon({
                paths: polygonCoords,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35
            });
            break;

    }
    geometry.setMap(map);
    document.getElementById('gml-text').innerHTML ='<h2>Generated GML:</h2>';
    document.getElementById('gml-text').innerHTML += gml;
    //Shows the GML after 1.5 second
    window.setTimeout(function() {
        modal.style.display = 'block';
    }, 1500);
}
function removeLastPoint(){
    markers[markers.length-1].setMap(null);
    markers.pop();
}
function removeAllPoints(){
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    if(geometry != null){
        geometry.setMap(null);
    }
}

function closeModal(){
    modal.style.display = "none";
}