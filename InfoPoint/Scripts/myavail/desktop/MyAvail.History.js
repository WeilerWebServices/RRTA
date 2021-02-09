MyAvail.History = {

    init: function () {
        this.initState();
    },

    initState: function () {
        //RESTORE APP STATE FROM URL HASH PARAMS IF APPLICABLE
        if (window.location.search) {
            //ACTIVATE LOADING PANEL
            MyAvail.Desktop.initLoading();

            //GIVE TIME FOR SITE TO FINISH LOADING
            setTimeout(function () {
                //RESTORE STATE FROM URL
                MyAvail.History.restoreFromUrl();

                //DEACTIVATE LOADING PANEL
                MyAvail.Desktop.exitLoading();
            }, 3000);
        }
    },

    getCurrentState: function () {
        return {
            fullscreen: function () {
                return MyAvail.Desktop.isFullScreen();
            },
            routes: {
                selected: function () {
                    return MyAvail.Route.getSelectedRouteIDs().join(',');
                },
                search: function () {
                    return MyAvail.Route.searchBox.val();
                }
            },
            stops: {
                active: function () {
                    return MyAvail.Desktop.getActiveFromPanelBar().index() == 1;
                },
                search: function () {
                    return MyAvail.Stop.searchBox.val();
                },
                filter: {
                    routedirs: MyAvail.Map.overlaysFilter.routeDirs
                }
            },
            messages: {
                active: function () {
                    return MyAvail.Desktop.getActiveFromPanelBar().index() == 4;
                },
                filter: MyAvail.Message.isRouteFilterActive
            },
            map: {
                filter: {
                    routes: MyAvail.Map.overlaysFilter.showRoutes,
                    stops: MyAvail.Map.overlaysFilter.showAllStops,
                    buses: MyAvail.Map.overlaysFilter.showBuses
                }
            }
        }
    },

    getCurrentStateUrl: function () {
        //RETURN URL HASH STRING FROM CURRENT STATE OBJECT
        return $.param.querystring(window.location.href.split('?')[0], this.getCurrentState());
    },

    getUrlQueryStringParams: function () {
        return $.deparam.querystring();
    },

    getUrlHashParams: function () {
        return $.deparam.fragment();
    },

    restoreFromUrl: function () {
        //PARAMETERS:
        //&fullscreen=false
        //&routes[selected]=9,10
        //&routes[search]=oo
        //&stops[active]=true
        //&stops[search]=ave
        //&stops[filter][routedirs]=4|northbound,5|eastbound
        //&messages[active]=false
        //&messages[filter]=true
        //&map[filter][routes]=true
        //&map[filter][stops]=false
        //&map[filter][buses]=true

        //GET HASH PARAMETERS FROM URL
        var newState = this.getUrlQueryStringParams();

        //RESTORE FROM STATE OBJECT
        this.restoreAllStates(newState);
    },

    restoreAllStates: function (newState) {
        var me = this;

        //RESTORE FULL APP STATE
        if (newState) {
            this.restoreRoutes(newState.routes);
            //GIVE TIME FOR ROUTES AND ASSOCIATED TO BE SELECTED
            setTimeout(function () {
                me.restoreStops(newState.stops);
                me.restoreMessages(newState.messages);
                me.restoreMap(newState.map);
                me.restoreFullScreen(newState.fullscreen);
                me.restoreIframe(newState.iframe);
            }, 1500);
        }
    },

    restoreMap: function (mapState) {
        var showRoutes, showAllStops, showBuses;

        //HANDLE MAP OVERLAY FILTERS IF APPLICABLE
        if (mapState && mapState.filter) {
            //GET THE SPECIFIED FILTERS
            showRoutes = MyAvail.isDefined(mapState.filter.routes)
                ? MyAvail.convertToBoolean(mapState.filter.routes) : null;
            showAllStops = MyAvail.isDefined(mapState.filter.stops)
                ? MyAvail.convertToBoolean(mapState.filter.stops) : null;
            showBuses = MyAvail.isDefined(mapState.filter.buses)
                ? MyAvail.convertToBoolean(mapState.filter.buses) : null;
        }

        //APPLY OVERLAYS FILTER ON MAP
        MyAvail.Map.applyOverlaysFilter(showRoutes, showAllStops, showBuses);
    },

    restoreRoutes: function (routesState) {
        //RESELECT ROUTES IF APPLICABLE
        if (routesState) {
            //SELECT ROUTES IF APPLICABLE
            if (!MyAvail.isNullOrEmpty(routesState.selected))
                MyAvail.Route.selectRouteIDs(routesState.selected.split(','));

            //APPLY SEARCH IF APPLICABLE
            if (!MyAvail.isNullOrEmpty(routesState.search))
                MyAvail.Route.grid.applyFilter(routesState.search);
        }
    },

    restoreStops: function (stopsState) {
        if (stopsState) {
            //EXPAND STOPS PANEL IF APPLICABLE
            if (MyAvail.convertToBoolean(stopsState.active))
                MyAvail.Desktop.expandPanelBar(1);

            //APPLY STOP FILTERS IF APPLICABLE
            if (stopsState.filter
                && stopsState.filter.routedirs
                && stopsState.filter.routedirs.length > 0) {
                //STORE ROUTE DIRECTIONS FOR LATER USE
                var routeDirs = stopsState.filter.routedirs;

                //UPDATE STOPS DATA AND UI
                MyAvail.Stop.updateByFilter(routeDirs);
            }

            //APPLY SEARCH IF APPLICABLE
            if (!MyAvail.isNullOrEmpty(stopsState.search)) {
                MyAvail.Stop.searchBox.val(stopsState.search);
                MyAvail.Stop.searchButton.click();
            }
        }
    },

    restoreMessages: function (messagesState) {
        if (messagesState) {
            //EXPAND MESSAGES PANEL IF APPLICABLE
            if (MyAvail.convertToBoolean(messagesState.active))
                MyAvail.Desktop.expandPanelBar(4);

            //SELECT MESSAGES PANEL VIEW IF APPLICABLE
            if (MyAvail.convertToBoolean(messagesState.filter))
                MyAvail.Message.selectedButton.click();
        }
    },

    restoreFullScreen: function (fullscreenState) {
        if (MyAvail.isDefined(fullscreenState))
            MyAvail.Desktop.toggleFullScreen(MyAvail.convertToBoolean(fullscreenState));
    },

    restoreIframe: function (iframeState) {
        if (MyAvail.isDefined(iframeState))
            MyAvail.Desktop.toggleIframe(MyAvail.convertToBoolean(iframeState));
    }
};

//INITIALIZE
$(function () {
    MyAvail.History.init();
});

