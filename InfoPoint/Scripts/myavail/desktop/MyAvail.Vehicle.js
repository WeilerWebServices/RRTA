MyAvail.Vehicle = {

    init: function () {
        this.initOverrides();
        this.initPolling();
    },

    initOverrides: function () {
        //INITIALIZE MAP CONFIGURATIONS
        MyAvail.Map.getVehicleIcon = this.getVehicleIcon;
        MyAvail.Map.onVehicleMarkerClick = this.onMarkerClick;
    },

    initPolling: function () {
        //POLL VEHICLES FOR SELECTED ROUTES
        //POLLING TECHNIQUE: http://techoctave.com/c7/posts/60-simple-long-polling-example-with-javascript-and-jquery
        (function poll() {
            //GET REFRESH RATE FROM CONFIG IF APPLICABLE
            var timeout = (MyAvail.transitAuthorityConfig.VehicleRefreshInterval || 5) * 1000;

            setTimeout(function () {
                //GET SELECTED ROUTES
                var routeIDs = MyAvail.Route.getSelectedRouteIDs();

                //GET UPDATED VEHICLES FROM SERVER IF APPLICABLE
                if (routeIDs && routeIDs.length > 0) {
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: MyAvail.getVehiclesByRoutesRestUrl(routeIDs),
                        success: MyAvail.Vehicle.updatePositions,
                        complete: poll
                    });
                } else {
                    //POLL AGAIN LATER
                    poll();
                }
            }, timeout);
        })();
    },

    mapByRoute: function (route) {
        MyAvail.getVehiclesByRouteID(route.RouteId, function (data) {
            MyAvail.Map.drawVehicles(data, route);
        });
    },

    updatePositions: function (vehicles) {
        //ONLY MAP IF BUS FILTER ALLOWS
        if (!MyAvail.isDefined(MyAvail.Map.overlaysFilter.showBuses) || MyAvail.Map.overlaysFilter.showBuses) {
            if (vehicles && vehicles.length > 0) {
                var routes = MyAvail.Route.getSelectedRoutes();
                var markers = MyAvail.Map.getMarkerVehicles();

                //CLEAR REMOVED VEHICLES FROM MAP
                $.each(markers, function () {
                    var vehicle = MyAvail.findByProperty(vehicles, 'VehicleId', this.myAvail.vehicle.VehicleId);
                    if (!vehicle) MyAvail.Map.clearMarker(this);
                });

                //HANDLE VEHICLE MARKERS ON MAP
                $.each(vehicles, function () {
                    var route = MyAvail.findByProperty(routes, 'RouteId', this.RouteId) || { RouteId: 0 };

                    //FIND MATCHED MARKER
                    var marker;
                    for (i = 0; i < markers.length; i++) {
                        //PROCESS ONLY CUSTOM DATA AVAILABLE
                        if (markers[i].myAvail && markers[i].myAvail.vehicle) {
                            if (markers[i].myAvail.vehicle.VehicleId == this.VehicleId) {
                                //FOUND MARKER TO REPOSITION
                                marker = markers[i];
                                break;
                            }
                        }
                    }

                    //ADD OR UPDATE MARKER ON MAP
                    if (marker) MyAvail.Map.updateVehicleMarker(marker, this, route);
                    else MyAvail.Map.addVehicleMarker(this, route);
                });
            }
        }
    },

    getVehicleIcon: function (color, direction) {
        return MyAvail.resolveUrl('~/IconFactory.ashx')
            + '?library=busIcons%5Cmobile&colortype=hex&color='
            + color
            + '&bearing='
            + direction;
    },

    onMarkerClick: function (marker, event, data) {
        var me = MyAvail.Map;

        //CENTER MAP ON MARKER WITH OFFSET
        me.recenterMap(marker.getPosition(), 165, 0);

        //GET PIXEL COORDINATES FROM MARKER
        var pixel = me.getPixelFromLatLng(marker.getPosition());

        //INITIALIZE TOOLTIP
        MyAvail.Tooltip.load({
            url: '~/Vehicles/Detail',
            data: {
                vehicle: marker.myAvail.vehicle,
                route: marker.myAvail.route
            },
            cssClass: 'ui-tooltip-map-vehicle vehicle-' + marker.myAvail.vehicle.VehicleId,
            position: {
                my: 'middle right',
                at: 'middle left',
                target: pixel,
                container: $('#' + MyAvail.Map.mapElementId),
                viewport: $('#content .inner-content'),
                adjust: {
                    x: -11,
                    y: -30
                },
                effect: false
            },
            tipStyle: {
                width: 35,
                height: 16
            },
            reposition: true,
            show: {
                ready: true,
                event: false,
                solo: true
            }
        });
    }
};

//INITIALIZE
$(function () {
    MyAvail.Vehicle.init();
});