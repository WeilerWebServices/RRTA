MyAvail.Route = {

    searchBox: null,

    init: function () {
        this.initSearch();
        this.grid.init();
    },

    initSearch: function () {
        var me = this;

        //CACHE SEARCH BOX FOR FURTHER PROCESSING
        this.searchBox = $('#routes_grid_wrapper .search-container input[type=text]');

        //ROUTE SEARCH HANDLER
        var searchButton = $('#routes_grid_wrapper .search-container input[type=submit]');
        searchButton.click(function () {
            me.grid.applyFilter(me.searchBox.val());
        });

        //SIMULATE CLICK IF ENTER PRESSED IN SEARCH
        this.searchBox.keypress(function (e) {
            var keycode = e.keyCode || e.which;
            if (keycode == 13) {
                //STOP DEFAULT BEHAVIOR OF FORM SUBMISSION
                e.preventDefault();
                //PASS ACTION TO SUBMIT BUTTON FOR HANDLING
                searchButton.click();
            }
        });

        //ROUTE CLEAR HANDLER
        $('#routes_grid_wrapper .search-container button.clear-x').click(function () {
            me.grid.clearFilter();
        });
    },

    selectRoute: function (route, row) {
        //HANDLE MAP BASED ON CURRENT ROUTE SELECTION
        this.mapByRoute(route);

        //HANDLE GRID SELECTION
        if (row) this.grid.addSelection(row);

        //CLEAR FILTER OPTIONS
        MyAvail.Stop.clearFilterOptions();

        //UPDATE PUBLIC MESSAGES
        MyAvail.Message.handleRouteChange();
    },

    selectRouteList: function (routes) {
        for (i = 0; i < routes.length; i++) {
            var route = routes[i];

            //GET GRID ROW BY ROUTE
            var row = this.grid.getRowByUID(route.uid);
            if (!row) row = this.grid.currentGrid.getRowByRouteID(route.RouteId);

            this.selectRoute(route, row);
        }
    },

    selectRouteIDs: function (routeIDs) {
        for (i = 0; i < routeIDs.length; i++) {
            var id = routeIDs[i];
            var row = this.grid.getRowByRouteID(id);
            var route = this.grid.currentGrid.dataItem(row);
            this.selectRoute(route, row);
        }
    },

    clearRoute: function (route, row) {
        //REMOVE ROUTE BASED ON CURRENT ROUTE SELECTION
        MyAvail.Map.clearOverlaysByTag(route.RouteId);

        //HANDLE GRID SELECTION
        if (row) this.grid.clearSelection(row);

        //CLEAR FILTER OPTIONS
        MyAvail.Stop.clearFilterOptions();

        //UPDATE PUBLIC MESSAGES
        MyAvail.Message.handleRouteChange();
    },

    getSelectedRoutes: function () {
        var routes = [];

        var rows = this.grid.getSelectedRows();
        for (i = 0; i < rows.length; i++) {
            routes.push(this.grid.currentGrid.dataItem(rows[i]));
        }

        return routes;
    },

    getSelectedRouteIDs: function () {
        var routeIDs = [];

        var rows = this.grid.getSelectedRows();
        for (i = 0; i < rows.length; i++) {
            routeIDs.push(this.grid.currentGrid.dataItem(rows[i]).RouteId);
        }

        return routeIDs;
    },

    mapByRoute: function (route) {
        if (route) {
            //DROP STOP POINTS
            MyAvail.Stop.mapByRoute(route);

            //DROP VEHICLE POINTS
            MyAvail.Vehicle.mapByRoute(route);

            //DRAW ROUTE TRACE
            var kml = MyAvail.getKmlFile(route.RouteTraceFilename);
            MyAvail.Map.drawKml(kml, route.RouteId, route.Color);
        }
    },

    grid: {

        currentGrid: null, //CACHE GRID REFERENCE FOR REUSE
        tempSelected: [], //USED FOR RESELECT ON GRID REBINDS

        schema: {
            //ROUTE MODEL MATCHING SERVER
            model: {
                id: "RouteId",
                fields: {
                    RouteId: { type: 'number' },
                    ShortName: { type: 'string' },
                    LongName: { type: 'string' },
                    RouteAbbreviation: { type: 'string' },
                    IvrDescription: { type: 'string' },
                    Color: { type: 'string' },
                    TextColor: { type: 'string' },
                    IsVisible: { type: 'boolean' },
                    Group: { type: 'string' },
                    SortOrder: { type: 'number' },
                    RouteTraceFilename: { type: 'string' }
                }
            }
        },

        dataSource: {
            transport: {
                read: {
                    url: MyAvail.getRoutesRestUrl(),
                    dataType: 'json'
                }
            },
            schema: this.schema
        },

        init: function () {
            //INITIALIZE KENDO GRID WIH ROUTES
            this.currentGrid = $('#routes_grid').kendoGrid({
                columns: [
                    {
                        field: 'LongName',
                        title: 'Name',
                        template: '<div class="name">#= LongName #</div>'
                    },
                    {
                        field: 'RouteAbbreviation',
                        title: 'Number',
                        template: '<div class="route-id-container"><div class="route-abbr" style="background-color: \\##= Color #; color: \\##= TextColor #;">#= RouteAbbreviation #</div></div>',
                        width: 65
                    }
                ],
                height: this.calculateGridHeight,
                selectable: 'row',
                sortable: true,
                dataSource: this.dataSource,
                dataBinding: this.onDataBinding,
                dataBound: this.onDataBound,
                change: this.onChange,
                detailTemplate: kendo.template('<div class="route-buses"></div>'),
                //detailInit: this.onDetailInit,
                detailExpand: this.onDetailExpand
            }).data('kendoGrid');
        },

        getSelectedRows: function () {
            return this.currentGrid.tbody.find(' > tr.selected-row');
        },

        getRowByUID: function (uid) {
            return this.currentGrid.tbody.find('tr[data-uid="' + uid + '"]');
        },

        getRowByRouteID: function (routeID) {
            var me = this;
            var row = null;

            //VALIDATE BEFORE PROCESSING
            if (this.currentGrid && routeID) {
                //EXTRACT DATA MODEL FROM EACH GRID ROW AND MATCH PROPERTY
                $.each(this.currentGrid.tbody.children('tr'), function (index, item) {
                    var route = me.currentGrid.dataItem(this);

                    //DETERMINE AND HANDLE SELECTED ROUTE
                    if (route && route.RouteId == routeID) {
                        row = $(this);
                        return false;
                    }
                });
            }

            return row;
        },

        addSelection: function (row) {
            //ADD ROW SELECT IDENTIFIER
            row.addClass('selected-row');
        },
        
        colorRow: function (row, color, textColor) {
            //UPDATE BACKGROUND AND TEXT COLOR
            $('.route-abbr', row).css('background-color', '#' + color || '000').css('color', '#' + textColor || 'fff');
        },

        clearSelection: function (row) {
            //REMOVE ROW SELECT IDENTIFIER
            row.removeClass('selected-row');

            //REMOVE UNUSED KENDO SELECTOR SINCE USING CUSTOM MULTI SELECT
            row.removeClass('k-state-selected');

            //REMOVE SELECTION STYLE
            //$('.route-abbr', row).css('background-color', '');

            //COLLAPSE ROW IF APPLICABLE
            this.currentGrid.collapseRow(row);
        },

        clearAllSelections: function () {
            var me = this;

            //CLEAR GRID ROWS
            this.getSelectedRows().each(function (index, row) {
                me.clearSelection($(row));
            });
        },

        applyFilter: function (value) {
            //FILTER ROUTES GRID BASED ON VALUE
            this.currentGrid.dataSource.filter([
                {
                    field: "LongName",
                    operator: "contains",
                    value: value
                }
            ]);

            //HANDLE SEARCH BOX IF APPLICABLE
            if (MyAvail.Route.searchBox.val() != value)
                MyAvail.Route.searchBox.val(value);
        },

        clearFilter: function () {
            //CLEAR GRID FILTER
            this.currentGrid.dataSource.filter({});

            //CLEAR SEARCH INPUT
            MyAvail.Route.searchBox.val('');
        },

        isRowSelected: function (row) {
            return row.hasClass('selected-row');
        },

        isHierarchyClick: function (e) {
            //TODO: EVENT NOT DEFINED IN FIREFOX
            if ($.browser.mozilla || $.browser.msie) return false;

            //GET TRIGGER SOURCE TO DETERMINE IF HIERARCHY CLICKED
            var eventTarget = (event.target) ? $(event.target) : $(event.srcElement);
            return eventTarget.parent().hasClass('k-hierarchy-cell');
        },

        resizeGrid: function () {
            if (this.currentGrid) {
                var gridElement = this.currentGrid.element;
                var dataArea = gridElement.find('.k-grid-content');

                var newGridHeight = this.calculateGridHeight();
                var newDataAreaHeight = newGridHeight - 20;

                dataArea.height(newDataAreaHeight);
                gridElement.height(newGridHeight);

                this.currentGrid.refresh();
            }
        },

        calculateGridHeight: function () {
            //GET HEIGHT OF ALL CONTAINERS OUTSIDE
            var miscContainerHeights = 35;

            //SUBTRACT SEARCH CONTAINER
            return MyAvail.Desktop.calculatePanelContentHeight() - miscContainerHeights;
        },

        onDataBinding: function (e) {
            //GET CURRENTLY SELECTED ROUTES FOR SELECTING LATER
            MyAvail.Route.grid.tempSelected = MyAvail.Route.getSelectedRoutes();
        },

        onDataBound: function (e) {
            var me = MyAvail.Route.grid;

            //RESELECT ROUTE IF APPLICABLE
            if (me.tempSelected.length > 0) {
                //GET FILTERED ROUTES IF APPLICABLE
                var filteredRoutes = me.currentGrid.dataSource.view();

                //GET INTERSECTED ROUTES TO RESELECT FROM NEW VIEW
                var intersectedRoutes = MyAvail.getIntersect(filteredRoutes, me.tempSelected);

                //RESELECT FROM NEW SET IF APPLICABLE
                if (intersectedRoutes.length != me.tempSelected.length) {
                    //CLEAR MAP TO REMOVE IRRELEVANT ROUTES
                    MyAvail.Map.clearOverlays(true);

                    //RESELECT FROM GRID AND DRAW ON MAP
                    MyAvail.Route.selectRouteList(intersectedRoutes);

                    //RECENTER MAP ON SELECTED OVERLAYS WITH DELAY FOR DRAW FINISHED
                    setTimeout(function () { MyAvail.Map.applyAutoFit(); }, 1000);
                } else {
                    //RESELECT FROM GRID AND LEAVE MAP INTACT
                    for (i = 0; i < me.tempSelected.length; i++) {
                        var route = me.tempSelected[i];
                        var row = me.getRowByUID(route.uid);
                        me.addSelection(row);
                    }
                }
            }
        },

        onChange: function (e) {
            var me = MyAvail.Route.grid;

            //PERFORM SELECT ONLY IF NOT A DETAIL EXPAND
            if (!me.isHierarchyClick(e)) {
                var row = this.select();
                var route = this.dataItem(row);

                //DETERMINE AND HANDLE SELECTED ROUTE
                if (route) {
                    //TODO: USE NATIVE MULTIPLE GRID SELECT WHEN MORE STABLE
                    if (me.isRowSelected(row)) MyAvail.Route.clearRoute(route, row);
                    else MyAvail.Route.selectRoute(route, row);
                }
            }
        },

        onDetailInit: function (e) {
            //// RELOAD ON EVERY EXPAND, NOT JUST INIT
            //var dataItem = e.data;
            //var detailRow = e.detailRow;
            //var detailHTML = detailRow.find('.route-buses');

            ////ADD BUSES HEADING TO DETAIL AREA
            //var vehicleWrapper = '<div class="buses-heading">Bus #:</div>';
            //detailHTML.append(vehicleWrapper);

            ////GET VEHICLES FOR VIEW
            //MyAvail.getVehiclesByRouteID(dataItem.RouteId, function (data) {
            //    //CONSTRUCT VEHICLE CELLS
            //    var vehiclesHTML = $('<div class="buses-items"></div>');
            //    if (data.length > 0) {
            //        for (i = 0; i < data.length; i++) {
            //            var itemHTML = '<div class="vehicle-cell" onclick="'
            //                + 'MyAvail.Map.showMarkerByVehicleID(' + data[i].VehicleId + ');">'
            //                + data[i].VehicleId
            //                + '</div>';

            //            vehiclesHTML.append(itemHTML);
            //        }
            //    } else {
            //        vehiclesHTML.append('&nbsp;&nbsp;n/a');
            //    }

            //    //ADD VEHICLE CELLS TO DETAIL AREA
            //    detailHTML.append(vehiclesHTML);
            //});
        },

        onDetailExpand: function (e) {
            var me = MyAvail.Route.grid;
            var masterRow = e.masterRow;

            //ENSURE ROW SELECTED AFTER EXPAND
            if (!me.isRowSelected(masterRow)) {
                var route = this.dataItem(masterRow);
                MyAvail.Route.selectRoute(route, masterRow);
            }

            // Reload vehicles for this route to handle changing vehicles
            var dataItem = MyAvail.Route.grid.currentGrid.dataItem(e.masterRow);
            var detailRow = e.detailRow;
            var detailHTML = detailRow.find('.route-buses');

            //ADD BUSES HEADING TO DETAIL AREA
            var vehicleWrapper = '<div class="buses-heading">Bus #:</div>';
            detailHTML.html(vehicleWrapper);

            //GET VEHICLES FOR VIEW
            MyAvail.getVehiclesByRouteID(dataItem.RouteId, function (data) {
                //CONSTRUCT VEHICLE CELLS
                var vehiclesHTML = $('<div class="buses-items"></div>');
                if (data.length > 0) {
                    for (i = 0; i < data.length; i++) {
                        var itemHTML = '<div class="vehicle-cell" onclick="'
                            + 'MyAvail.Map.showMarkerByVehicleID(' + data[i].VehicleId + ');">'
                            + data[i].Name
                            + '</div>';

                        vehiclesHTML.append(itemHTML);
                    }
                } else {
                    vehiclesHTML.append('&nbsp;&nbsp;n/a');
                }

                //ADD VEHICLE CELLS TO DETAIL AREA
                detailHTML.append(vehiclesHTML);
            });
        }
    }
};

//INITIALIZE
$(function () {
    MyAvail.Route.init();
});