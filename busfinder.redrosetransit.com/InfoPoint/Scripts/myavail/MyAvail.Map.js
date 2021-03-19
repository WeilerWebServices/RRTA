MyAvail.Map = {

    googlemap: null,
    map: null,
    mapElementId: 'map_canvas',
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapStyles: [{
        featureType: 'transit',
        stylers: [{
            visibility: 'off'
        }]
    }],
    center: {
        lat: parseFloat(MyAvail.transitAuthorityConfig.StartLatitude),
        lng: parseFloat(MyAvail.transitAuthorityConfig.StartLongitude)
    },
    zoom: parseInt(MyAvail.transitAuthorityConfig.StartZoom),
    trafficLayer: new google.maps.TrafficLayer(),
    overlay: null,
    overlaysFilter: {
        showRoutes: null,
        showAllStops: null,
        showBuses: null,
        routeDirs: []
    },
    //BELOW PROPERTIES SHOULD BE OVERRIDEN BY MOBILE OR DESKTOP
    stopIcon: null,
    timedStopIcon: null,
    getVehicleIcon: null,
    onStopMarkerClick: null,
    onVehicleMarkerClick: null,

    init: function () {
        this.initMap();
    },

    initMap: function () {
        //STORE MAP ELEMENT FOR LATER USE
        this.map = $('#' + this.mapElementId);

        //INITIALIZE GMAP3 ON CANVAS
        this.map.gmap3({
            action: 'init',
            options: {
                mapTypeId: this.mapTypeId,
                styles: this.mapStyles,
                center: this.center,
                zoom: this.zoom
            }
        });

        //STORE GOOGLE MAP FOR LATER USE
        this.googlemap = this.map.gmap3('get');

        //CREATE DUMMY OVERLAY FOR PIXEL CONVERSION LATER FOR CUSTOM MARKER TOOLTIP
        //TODO: REFACTOR WHEN BUG FIXED IN V3 (http://code.google.com/p/gmaps-api-issues/issues/detail?id=2342)
        this.overlay = new google.maps.OverlayView();
        this.overlay.draw = function () { };
        this.overlay.setMap(this.googlemap);

        //INITIALIZE TRAFFIC LAYER CONTROL
        this.initTrafficControl()
    },

    drawKml: function (url, tag, color) {
        var me = this;

        //HANDLE ACCORDING TO RELATIVE OR ABSOLUTE URL
        if (!MyAvail.isExternalUrl(url)) {
            //PARSE KML TO CREATE POLYLINE FOR MORE CONTROL
            this.parseKml(url, function (doc) {
                var placemarks = doc[0].placemarks;
                var options = {
                    strokeColor: '#' + color || '000',
                    strokeOpacity: 1.0,
                    strokeWeight: 7
                }

                //ADD EACH POLYLINE PATH TO MAP
                for (i = 0; i < placemarks.length; i++) {
                    
                    if (placemarks[i].coordinates != null) {
                        me.map.gmap3({
                            action: 'addPolyline',
                            options: options,
                            path: placemarks[i].coordinates,
                            tag: tag
                        });
                    } else if (MyAvail.isDefined(placemarks[i].LineString)) {
                        // Try LineString collection
                        for (j = 0; j < placemarks[i].LineString.length; j++) {
                            me.map.gmap3({
                                action: 'addPolyline',
                                options: options,
                                path: placemarks[i].LineString[j].coordinates,
                                tag: tag
                            });
                        }
                    }
                }

                //RETAIN MAP OVERLAYS FILTER IF APPLICABLE
                if (MyAvail.isDefined(me.overlaysFilter.showRoutes))
                    me.applyOverlaysFilter(me.overlaysFilter.showRoutes, null, null);
            });
        } else {
            //CROSS DOMAIN RESTRICTIONS REQUIRE KML LAYERING
            //THIS WILL LOOSE CUSTOM ROUTE COLORING
            this.map.gmap3({
                action: 'addKmlLayer',
                url: url,
                tag: tag
            });

            //RETAIN MAP OVERLAYS FILTER IF APPLICABLE
            this.applyOverlaysFilter(this.overlaysFilter.showRoutes, null, null);
        }
    },

    parseKml: function (url, fnLoad) {
        //USE GEOXML TO PARSE KML FOR POLYLINE OVERLAY
        //BEWARE OF CROSS DOMAIN RESTRICTIONS
        var geoParser = new geoXML3.parser({ afterParse: fnLoad });
        geoParser.parse(url);
    },

    drawStops: function (stops, route) {
        var me = this;
        var gmapHandle = this.googlemap;
        var bounds = new google.maps.LatLngBounds();

        numberOfStopsDrawn = 0;

        //ADD EACH MARKER TO MAP
        $.each(stops, function (key, item) {
            bounds.extend(new google.maps.LatLng(item.Latitude, item.Longitude));
            me.addStopMarker(item, route, me.stopMarkerCallback(gmapHandle, bounds, stops.length));
        });

		// Moved the call to fitBounds to the addStopMarker callback function.
		// Apparently some browsers were jumping to this call before all of the calls to addStopMarker
		// were complete for each marker.
        //FIT BOUNDS FOR VIEW
        //this.googlemap.fitBounds(bounds);

        //RETAIN MAP OVERLAYS FILTER IF APPLICABLE
        this.applyOverlaysFilter(null, this.overlaysFilter.showAllStops, null, this.overlaysFilter.routeDirs);
    },

    stopMarkerCallback: function (refToGoogleMap, bounds, numberOfStops) {
		// We check to see how many times this callback has been called, in relation to the
		// number of stops being drawn.  Once we've reached the last stop, we want to call the fitBounds
		// function on the GoogleMap object to recenter our map on our new list of stops.
        numberOfStopsDrawn++;
        if (numberOfStopsDrawn >= numberOfStops) {
            refToGoogleMap.fitBounds(bounds);
			// The panBy function was added as a workaround for a minor bug with the fitBounds call.
			// The call to fitBounds wasn't enforcing a consistent redraw of our markers, so we pan the
			// map 1 pixel east to force a redraw.
            refToGoogleMap.panBy(1,0);
        }
    },

    drawVehicles: function (vehicles, route) {
        var me = this;

        //ADD EACH MARKER TO MAP
        $.each(vehicles, function (key, item) {
            me.addVehicleMarker(item, route);
        });

        //RETAIN MAP OVERLAYS FILTER IF APPLICABLE
        this.applyOverlaysFilter(null, null, this.overlaysFilter.showBuses);
    },

    addStopMarker: function (stop, route, fnLoad) {
        var markerIcon = stop.IsTimePoint
            ? this.timedStopIcon
            : this.stopIcon;

        this.map.gmap3({
            action: 'addMarker',
            lat: stop.Latitude,
            lng: stop.Longitude,
            marker: {
                options: {
                    icon: markerIcon,
                    myAvail: {
                        stop: stop,
                        route: route
                    },
                    optimized: false
                },
                tag: route.RouteId,
                events: {
                    click: this.onStopMarkerClick
                },
                callback: fnLoad
            }
        });
    },

    addVehicleMarker: function (vehicle, route, fnLoad) {
        var markerIcon = this.getVehicleIcon(route.Color, vehicle.Heading);

        this.map.gmap3({
            action: 'addMarker',
            lat: vehicle.Latitude,
            lng: vehicle.Longitude,
            marker: {
                options: {
                    icon: markerIcon,
                    myAvail: {
                        vehicle: vehicle,
                        route: route
                    },
                    optimized: false
                },
                tag: route.RouteId,
                events: {
                    click: this.onVehicleMarkerClick
                },
                callback: fnLoad
            }
        });
    },

    updateVehicleMarker: function (marker, vehicle, route) {
        var markerIcon = this.getVehicleIcon(route.Color, vehicle.Heading);
        var position = new google.maps.LatLng(vehicle.Latitude, vehicle.Longitude);

        //UPDATE MARKER PROPERTIES
        if (!marker.getPosition().equals(position)) {
            marker.setPosition(position);

            //UPDATE TOOLTIP POSITION IF APPLICABLE
            var tooltip = $('.ui-tooltip-map-vehicle.vehicle-' + vehicle.VehicleId);
            if (tooltip.length) {
                //GET UPDATED POSITION
                var pixels = this.getPixelFromLatLng(position);

                //UDPATE TOOLTIP POSITION AND REFRESH CONTENT
                tooltip.qtip('option', {
                    'position.target': pixels,
                    'content.ajax.url': tooltip.qtip('option', 'content.ajax.url')
                });
            }
        }
        if (marker.getIcon() != markerIcon) marker.setIcon(markerIcon);
        marker.myAvail = {
            vehicle: vehicle,
            route: route
        };
    },

    recenterMap: function (latlng, offsetx, offsety) {
        var point1 = this.googlemap.getProjection().fromLatLngToPoint(latlng);
        var point2 = new google.maps.Point(
            ((offsetx || 0) / Math.pow(2, this.googlemap.getZoom())) || 0,
            ((offsety || 0) / Math.pow(2, this.googlemap.getZoom())) || 0
        );
        this.googlemap.setCenter(this.googlemap.getProjection().fromPointToLatLng(new google.maps.Point(
            point1.x - point2.x,
            point1.y + point2.y
        )));
    },

    getPixelFromLatLng: function (latlng) {
        //TODO: REFACTOR WHEN BUG FIXED IN V3 (http://code.google.com/p/gmaps-api-issues/issues/detail?id=2342)
        var pixel = this.overlay.getProjection().fromLatLngToContainerPixel(latlng);
        return [pixel.x, pixel.y];
    },

    showMarkerByStop: function (stop) {
        var me = this;
        var marker = this.getMarkerByStopID(stop.StopId);

        //DISPLAY BUBBLE FOR FOUND STOP IF APPLICABLE
        if (!marker) {
            //ADD STOP TO MAP
            this.addStopMarker(stop, { RouteId: 0 }, function (data) {
                //DISPLAY MARKER ON MAP AFTER ADDED
                me.onStopMarkerClick(data);
            });
        } else {
            //DISPLAY MARKER ON MAP
            this.onStopMarkerClick(marker);
        }
    },

    showMarkerByVehicleID: function (vehicleID, routeID) {
        var me = this;
        var marker = this.getMarkerByVehicleID(vehicleID);

        //DISPLAY MARKER ON MAP IF APPLICABLE
        if (marker) {
            this.onVehicleMarkerClick(marker);
        } else if (routeID) {
            //HANDLE MISSING VEHICLES
            if (MyAvail.Desktop) {
                var selectedRoutes = MyAvail.Route.getSelectedRouteIDs();

                //SHOW ROUTE ON MAP IF NOT SELECTED ALREADY
                if (selectedRoutes.indexOf(routeID) == -1) {
                    //START LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    MyAvail.Route.selectRouteIDs([routeID]);

                    //DISPLAY MARKER ON MAP AFTER SELECTION
                    setTimeout(function () {
                        //TRY TO GET MARKER AGAIN
                        marker = me.getMarkerByVehicleID(vehicleID);

                        if (marker) me.onVehicleMarkerClick(marker);

                        //EXIT LOADING PANEL
                        MyAvail.Desktop.exitLoading();
                    }, 1500);
                }
            }
        }
    },

    getMarkerByStopID: function (stopID) {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: 'marker',
            all: true
        });

        //FIND MATCHED MARKER
        var marker;
        $.each(layers, function (index, item) {
            //RETURN MATCHED STOP IF APPLICABLE
            if (me.isMarkerStop(item) && item.myAvail.stop.StopId == stopID) {
                marker = item;
                return false;
            }
        });

        return marker;
    },

    getMarkerByVehicleID: function (vehicleID) {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: 'marker',
            all: true
        });

        //FIND MATCHED MARKER
        var marker;
        $.each(layers, function (index, item) {
            //RETURN MATCHED VEHICLE IF APPLICABLE
            if (me.isMarkerVehicle(item) && item.myAvail.vehicle.VehicleId == vehicleID) {
                marker = item;
                return false;
            }
        });

        return marker;
    },

    getMarkerVehicles: function () {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: 'marker',
            all: true
        });

        var markers = [];
        $.each(layers, function (index, item) {
            //STORE VEHICLE IF APPLICABLE
            if (me.isMarkerVehicle(item)) markers.push(item);
        });

        return markers;
    },

    getMarkerStops: function () {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: 'marker',
            all: true
        });

        var markers = [];
        $.each(layers, function (index, item) {
            //STORE STOP IF APPLICABLE
            if (me.isMarkerStop(item)) markers.push(item);
        });

        return markers;
    },

    updateMarkerStops: function (fnUpdate) {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: 'marker',
            all: true
        });

        $.each(layers, function (index, item) {
            //UPDATE STOP IF APPLICABLE
            if (me.isMarkerStop(item)) fnUpdate(item);
        });
    },

    updateMarkerVehicles: function (fnUpdate) {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: 'marker',
            all: true
        });

        $.each(layers, function (index, item) {
            //UPDATE VEHICLE IF APPLICABLE
            if (me.isMarkerVehicle(item)) fnUpdate(item);
        });
    },

    isMarkerStop: function (marker) {
        return marker.myAvail && marker.myAvail.stop;
    },

    isMarkerTimeStop: function (marker) {
        return MyAvail.Map.isMarkerStop(marker) && marker.myAvail.stop.IsTimePoint;
    },

    isMarkerNonTimeStop: function (marker) {
        return MyAvail.Map.isMarkerStop(marker) && !marker.myAvail.stop.IsTimePoint;
    },

    isMarkerVehicle: function (marker) {
        return marker.myAvail && marker.myAvail.vehicle;
    },

    getGeocodedAddress: function (address, fnLoad) {
        //USE GEOCODE SERVICE TO CLEAN ADDRESS
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': address }, function (results, status) {
            //VALIDATE RETURNED DATA
            if (status == google.maps.GeocoderStatus.OK && results && results[0])
            //PASS ADDRESS TO FUNCTION PARAMETER
                fnLoad(results[0].formatted_address);
            else fnLoad(address);
        });
    },

    //REMOVES THE OVERLAYS FROM THE MAP AND DESTROYS IN MEMORY
    clearOverlays: function (reset) {
        var clearTasks = { action: 'clear' };

        //CLEAR ALL
        if (reset) {
            //RESET MAP TO DEFAULT VALUES
            this.googlemap.setCenter(new google.maps.LatLng(this.center.lat, this.center.lng));
            this.googlemap.setZoom(this.zoom);

            //HANDLE DESKTOP IF APPLICABLE
            if (MyAvail.Desktop) {
                //CLEAR ROUTES GRID
                MyAvail.Route.grid.clearAllSelections();

                //CLOSE FULL SCREEN IF APPLICABLE
                MyAvail.Desktop.toggleFullScreen(false);
            }
        }

        //CLEAR WITH SPECIFIED TASKS
        this.map.gmap3(clearTasks);
    },

    clearOverlaysByLayer: function (layerName, comparer) {
        var me = this;

        //CLEAR ALL LAYERS IF APPLICABLE
        if (!comparer) {
            this.map.gmap3({
                action: 'clear',
                name: layerName
            });
        } else {
            var layers = this.map.gmap3({
                action: 'get',
                name: layerName,
                all: true
            });

            //ONLY CLEAR LAYERS THAT MATCH COMPARER
            $.each(layers, function (index, item) {
                //HANDLE IF COMPARER MATCHES
                if (comparer(item)) me.clearMarker(item);
            });
        }
    },

    clearOverlaysByTag: function (tagName) {
        this.map.gmap3({
            action: 'clear',
            tag: tagName
        });
    },

    clearVehicles: function (tagName) {
        this.clearOverlaysByLayer('marker', this.isMarkerVehicle);
    },

    clearMarker: function (marker) {
        marker.setMap(null);
        marker.myAvail = null;
        //TODO: REMOVE FROM MEMORY DOES NOT WORK
        marker = null;
    },

    toggleOverlaysByLayer: function (layerName, visible, comparer) {
        var me = this;

        var layers = this.map.gmap3({
            action: 'get',
            name: layerName,
            all: true
        });

        $.each(layers, function (index, item) {
            //HANDLE VISIBILITY IF COMPARER NOT PASSED IN OR TRUE
            if (!comparer || comparer(item)) {
                item.setVisible(visible);
            }
        });
    },

    toggleOverlaysByTag: function (tagName, visible, comparer) {
        var me = this;

        var tags = this.map.gmap3({
            action: 'get',
            tag: tagName,
            all: true
        });

        $.each(tags, function (index, item) {
            //HANDLE VISIBILITY IF COMPARER NOT PASSED IN OR TRUE
            if (!comparer || comparer(item)) {
                item.setVisible(visible);
            }
        });
    },

    toggleOverlaysByKml: function (visible, comparer) {
        this.toggleOverlaysByLayer('kmllayer', visible, comparer);
    },

    toggleOverlaysByPolyline: function (visible, comparer) {
        this.toggleOverlaysByLayer('polyline', visible, comparer);
    },

    toggleOverlaysByMarker: function (visible, comparer) {
        this.toggleOverlaysByLayer('marker', visible, comparer);
    },

    applyOverlaysFilter: function (showRoutes, showAllStops, showBuses, routeDirs) {
        //HANDLE ROUTE TRACE VISIBILITY
        if (MyAvail.isDefined(showRoutes)) {
            this.toggleOverlaysByPolyline(showRoutes);
            this.toggleOverlaysByKml(showRoutes);

            //SAVE FOR NEW OVERLAYS
            this.overlaysFilter.showRoutes = showRoutes;
        }

        //HANDLE STOP VISIBILITY
        if (MyAvail.isDefined(showAllStops)) {
            this.toggleOverlaysByMarker(showAllStops, this.isMarkerNonTimeStop);

            //SAVE FOR NEW OVERLAYS
            this.overlaysFilter.showAllStops = showAllStops;
        }

        //HANDLE BUS VISIBILITY
        if (MyAvail.isDefined(showBuses)) {
            this.toggleOverlaysByMarker(showBuses, this.isMarkerVehicle);

            //SAVE FOR NEW OVERLAYS
            this.overlaysFilter.showBuses = showBuses;
        }

        //HANDLE STOP FILTERS IF APPLICABLE
        this.applyStopFilter(routeDirs);
    },

    applyStopFilter: function (routeDirs) {
        var me = this;

        //VALIDATE INPUT
        routeDirs = routeDirs || this.overlaysFilter.routeDirs;

        //GET ACTIVE STOPS IF APPLICABLE
        if (routeDirs && routeDirs.length > 0) {
            //SAVE FOR LATER USE
            this.overlaysFilter.routeDirs = routeDirs;

            MyAvail.getStopsByRouteDirs(routeDirs, function (data) {
                //VALIDATE RESULT
                if (data) {
                    var stopIDs = _.pluck(data, 'StopId');

                    //ONLY SHOW ACTIVE STOPS
                    me.updateMarkerStops(function (marker) {
                        //GET MAPPED STOP FROM GRID DATA
                        var foundStop = stopIDs.indexOf(marker.myAvail.stop.StopId) > -1;

                        //DETERMINE VISIBILITY AND TAKE MAP FILTERS INTO CONSIDERATION
                        var visible = foundStop
                            && (!MyAvail.isDefined(me.overlaysFilter.showAllStops)
                            || me.overlaysFilter.showAllStops
                            || (!me.overlaysFilter.showAllStops
                            && marker.myAvail.stop.IsTimePoint));

                        //HIDE MAPPED STOP THAT DOES NOT EXIST IN GRID
                        marker.setVisible(visible);
                    });
                }
            });
        }
    },

    clearStopFilter: function () {
        var me = this;

        if (this.overlaysFilter.routeDirs.length > 0) {
            //CLEAR STORED FILTERED STOPS
            this.overlaysFilter.routeDirs = [];

            //SHOW FILTERED STOPS ON MAP
            this.updateMarkerStops(function (marker) {
                //TAKE EXISTING MAP FILTERS INTO CONSIDERATION
                var visible = !MyAvail.isDefined(me.overlaysFilter.showAllStops)
                    || me.overlaysFilter.showAllStops
                    || (!me.overlaysFilter.showAllStops
                    && marker.myAvail.stop.IsTimePoint);

                //HIDE MAPPED STOP THAT DOES NOT EXIST IN GRID
                marker.setVisible(visible);
            });
        }
    },

    applyAutoFit: function () {
        this.refreshMap();

        //RECENTER AND ZOOM ON CURRENT OVERLAYS
        this.map.gmap3({
            action: 'autofit'
        });
    },

    refreshMap: function () {
        //TRIGGER RESIZE EVENT FOR MAP
        google.maps.event.trigger(this.googlemap, 'resize');
    },

    toggleTrafficOverlay: function (show) {
        //DETERMINE TOGGLE STATE IF APPLICABLE
        if (!MyAvail.isDefined(show))
            show = this.trafficLayer.map == null;

        //SHOW/HIDE ON MAP
        this.trafficLayer.setMap(show ? this.googlemap : null);

        //RETURN STATE
        return show;
    },

    initTrafficControl: function () {
        var me = this;
        var controlDiv = document.createElement('div');

        // Set CSS styles for the DIV containing the control
        // Setting padding to 5 px will offset the control
        // from the edge of the map
        controlDiv.style.padding = '5px';

        // Set CSS for the control border
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = 'white';
        controlUI.style.borderColor = '#777';
        controlUI.style.borderStyle = 'solid';
        controlUI.style.borderWidth = '1px';
        controlUI.style.cursor = 'pointer';
        controlUI.style.textAlign = 'center';
        controlUI.style.padding = '1px';
        controlUI.style.boxShadow = '0px 2px 5px #888888';
        controlUI.title = 'Click to toggle traffic';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior
        var controlText = document.createElement('div');
        controlText.style.fontFamily = 'Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.paddingLeft = '6px';
        controlText.style.paddingRight = '6px';
        controlText.innerHTML = 'Traffic';
        controlUI.appendChild(controlText);

        // Setup the click event listeners
        google.maps.event.addDomListener(controlUI, 'click', function () {
            var show = me.toggleTrafficOverlay();

            //DISPLAY STATE OF BUTTON
            this.style.backgroundColor = show ? '#ddd' : '#fff';
        });

        // add to map
        controlDiv.index = 1;
        this.googlemap.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
    },

    openTransit: function (data) {
        //CONSTRUCT URL
        var url = 'http://maps.google.com/maps?' + data;
        window.open(url);
        return url;
    }
};

//INITIALIZE
$(function () {
	// This var is being used to track the number of callbacks made from
	// the addStopMarker function.
    var numberOfStopsDrawn = 0;
    MyAvail.Map.init();
});