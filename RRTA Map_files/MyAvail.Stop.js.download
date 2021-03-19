MyAvail.Stop = {

    stopIcon: MyAvail.resolveUrl('~/Content/images/stopsPointIcon.png'),
    timedStopIcon: MyAvail.resolveUrl('~/Content/images/timePointIcon.png'),
    searchBox: null,
    searchButton: null,
    searchHeader: null,
    searchStatus: null,
    searchClear: null,
    filterButton: null,
    routeDirsFilterCheckboxes: null,
    isSearchMode: false,

    init: function () {
        this.initOverrides();
        this.initSearch();
        this.initFilterStatus();
        this.initFilterTooltip();
    },

    initOverrides: function () {
        //INITIALIZE MAP CONFIGURATIONS
        MyAvail.Map.stopIcon = this.stopIcon;
        MyAvail.Map.timedStopIcon = this.timedStopIcon;
        MyAvail.Map.onStopMarkerClick = this.onMarkerClick;
    },

    initSearch: function () {
        var me = MyAvail.Stop;

        //CACHE ELEMENTS FOR LATER USE
        this.searchBox = $('#stops_grid_wrapper .search-container input[type=text]');
        this.searchButton = $('#stops_grid_wrapper .search-container input[type=submit]');
        this.searchHeader = $('#stops_grid_wrapper .filter-container.selected-routes .filter-header');
        this.searchStatus = $('#stops_grid_wrapper .filter-container.selected-routes .filter-status');
        this.searchClear = $('#stops_grid_wrapper .search-container button.clear-x');

        //ROUTE SEARCH HANDLER
        this.searchButton.click(function () {
            var query = me.searchBox.val();
            if (MyAvail.isNullOrEmpty(query)) {
                query = undefined;
            }
            if (me.isSearchMode) me.updateBySearch(query);
            else me.grid.applyFilter(query);
        });

        //SIMULATE CLICK IF ENTER PRESSED IN SEARCH
        this.searchBox.keypress(function (e) {
            var keycode = e.keyCode || e.which;
            if (keycode == 13) {
                //STOP DEFAULT BEHAVIOR OF FORM SUBMISSION
                e.preventDefault();
                //PASS ACTION TO SUBMIT BUTTON FOR HANDLING
                me.searchButton.click();
            }
        });

        //ROUTE CLEAR HANDLER
        this.searchClear.click(function () {
            if (me.isSearchMode) me.updateBySearch();
            else me.grid.clearFilter();
        });
    },

    initFilterStatus: function () {
        var me = MyAvail.Stop;

        //CLEAR SELECTED ROUTES HANDLER
        $('#stops_grid_wrapper .filter-container.selected-routes .filter-clear').click(function () {
            me.updateBySearch();
        });

        //CLEAR SELECTED FILTERS HANDLER
        $('#stops_grid_wrapper .filter-container.selected-filters .filter-clear').click(function () {
            if (me.isSearchMode) me.updateBySearch();
            else me.updateBySelectedRoutes();
        });
    },

    initFilterTooltip: function () {
        var me = this;
        var filterOptionsSelector = '#stops_grid_wrapper .search-container .filter-options';

        //HANDLE FILTER OPTIONS TOOLTIP WITH UPDATES
        $(filterOptionsSelector).click(function () {
            //DETERMINE FILTER URL BASED ON MODE
            var filterUrl = MyAvail.resolveUrl('~/Stops/FilterOptions?routeIDs=');
            if (!me.isSearchMode) filterUrl += MyAvail.Route.getSelectedRouteIDs().join(',');

            //UPDATE TOOLTIP AJAX URL TO GET LATEST ROUTE SELECTIONS
            $(this).qtip('option', {
                'content.ajax.url': filterUrl
            });

            //SHOW TOOLTIP
            $(this).qtip('show');
        });

        //INITIALIZE FILTER TOOLTIP
        MyAvail.Tooltip.load({
            selector: filterOptionsSelector,
            url: '~/Stops/FilterOptions',
            cssClass: 'ui-tooltip-filter-options',
            position: {
                my: 'left top',
                at: 'bottom right',
                viewport: $(window),
                effect: false,
                adjust: {
                    x: 2,
                    y: -30
                }
            },
            show: {
                event: false,
                solo: true
            },
            tipStyle: {
                width: 35,
                height: 16,
                offset: 8,
                mimic: 'left center'
            },
            fnLoad: function (tooltip, contentElement) {
                var me = MyAvail.Stop;

                //REFERENCE NEEDED ELEMENTS
                me.routeDirsFilterCheckboxes = $('.route-filters input[type=checkbox]', contentElement);

                //STYLE RADIO BUTTONS
                $('input[type=checkbox], input[type=radio]', contentElement).checkBox();

                //INITIALIZE TOGGLE CHECKBOX LINKS
                $('.select-deselect .select-all', contentElement).click(function (e) {
                    e.preventDefault();
                    me.routeDirsFilterCheckboxes.checkBox('changeCheckStatus', true);
                });
                $('.select-deselect .deselect-all', contentElement).click(function (e) {
                    e.preventDefault();
                    me.routeDirsFilterCheckboxes.checkBox('changeCheckStatus', false);
                });

                //RESTORE SELECTED ROUTE DIRECTION FILTERS
                if (MyAvail.Map.overlaysFilter.routeDirs.length > 0) {
                    //CLEAR ALL SELECTIONS FIRST
                    me.routeDirsFilterCheckboxes.checkBox('changeCheckStatus', false);

                    //CHECK ONLY SELECTED ITEMS
                    $.each(MyAvail.Map.overlaysFilter.routeDirs, function () {
                        $('#filter_routes_' + this.RouteId + this.Direction, contentElement)
                            .checkBox('changeCheckStatus', true);
                    });
                }

                //HANDLE FILTERING OPTIONS
                me.filterButton = $('input[type=submit]#filter_options_submit', contentElement);
                me.filterButton.click(function () {
                    var routeDirs = [];

                    //BUILD ROUTE DIRECTIONS FROM SELECTED CHECKBOXES
                    if (me.routeDirsFilterCheckboxes) {
                        me.routeDirsFilterCheckboxes.filter(':checked').each(function () {
                            //EXTRACT VALUES FROM CHECKBOX
                            var values = $(this).val().split('|');
                            routeDirs.push({
                                RouteId: parseInt(values[0]),
                                Direction: values[1]
                            });
                        });
                    }

                    //UPDATE STOPS DATA AND UI
                    me.updateByFilter(routeDirs);

                    //HIDE LAYER POPUP AFTER FILTER SUBMISSION
                    tooltip.hide();
                });

                $('input[type=submit]#filter_options_clear', contentElement).click(function () {
                    //HANDLE CLEAR FILTER OF GRID
                    $('#stops_grid_wrapper .filter-container.selected-filters .filter-clear').click();

                    //HIDE LAYER POPUP AFTER FILTER SUBMISSION
                    tooltip.hide();
                });
            }
        });
    },

    selectStop: function (stop, row) {
        //HANDLE MAP BASED ON CURRENT STOP SELECTION
        MyAvail.Map.showMarkerByStop(stop);

        //HANDLE GRID SELECTION
        if (row) this.grid.addSelection(row);
    },

    updatePanel: function () {
        var selectedRouteIDs = MyAvail.Route.getSelectedRouteIDs();
        if (selectedRouteIDs.length > 0) this.updateBySelectedRoutes(selectedRouteIDs);
        else this.updateBySearch();
    },

    updateBySelectedRoutes: function (routeIDs) {
        //GET SELECTED ROUTES IF APPLICABLE
        if (!routeIDs) routeIDs = MyAvail.Route.getSelectedRouteIDs();

        //DETERMINE WEB SERVICE URL BASED ON SELECTED ROUTES
        if (routeIDs.length > 0) {
            //SAVE STATE OF STOPS PANEL
            this.isSearchMode = false;

            //CLEAR FILTER OPTIONS
            this.clearFilterOptions();

            //UPDATE GRID DATA WITH SELECTED ROUTES REST URL
            this.grid.updateDataUrl(MyAvail.getStopsByRoutesRestUrl(routeIDs));

            //ASSIGN GRID PANEL SEARCH HEADER
            this.searchHeader.text('Stops for:');

            //DETERMINE GRID PANEL SEARCH STATUS
            this.searchStatus.text(routeIDs.length == 1
                ? MyAvail.Route.getSelectedRoutes()[0].LongName
                : 'Selected Routes');

            //REAPPLY SEARCH TO NEW FILTER IF APPLICABLE
            if (this.searchBox.val() != '') this.searchButton.click();
        } else {
            //DEFAULT TO SEARCH MODE
            this.updateBySearch();
        }
    },

    updateBySearch: function (query) {
        //SAVE STATE OF STOPS PANEL
        this.isSearchMode = true;

        //CLEAR FILTER OPTIONS
        this.clearFilterOptions();

        //UPDATE GRID DATA WITH SELECTED ROUTES REST URL
        this.grid.updateDataUrl(MyAvail.getStopsBySearchRestUrl(query));

        //ASSIGN GRID PANEL SEARCH HEADER
        this.searchHeader.text('Search stops:');

        //DETERMINE GRID PANEL SEARCH STATUS
        this.searchStatus.text(MyAvail.isNullOrEmpty(query) ? 'None' : query);

        //CLEAR SEARCH BOX IF APPLICABLE
        if (MyAvail.isNullOrEmpty(query)) this.searchBox.val('');
    },

    updateByFilter: function (routeDirs) {
        if (routeDirs && routeDirs.length > 0) {
            //UPDATE GRID DATA
            this.grid.updateDataUrl(MyAvail.getStopsByRouteDirsRestUrl(), {
                routeDirs: routeDirs
            });

            //APPLY STOP FILTER TO MAP
            MyAvail.Map.applyStopFilter(routeDirs);

            //UPDATE GRID PANEL HEADER TEXT
            $('#stops_grid_wrapper .filter-container.selected-filters .filter-status').text('Active');
        } else {
            //CLEAR FILTER OPTIONS
            this.clearFilterOptions();
        }
    },

    clearFilterOptions: function () {
        //SELECT ALL ROUTE DIRECTIONS
        if (this.routeDirsFilterCheckboxes)
            this.routeDirsFilterCheckboxes.checkBox('changeCheckStatus', true);

        //UPDATE GRID PANEL HEADER TEXT
        $('#stops_grid_wrapper .filter-container.selected-filters .filter-status').text('None');

        //CLEAR PREVIOUS STOP FILTERS IF APPLICABLE
        MyAvail.Map.clearStopFilter();
    },

    mapByRoute: function (route) {
        MyAvail.getStopsByRouteID(route.RouteId, function (data) {
            MyAvail.Map.drawStops(data.Stops, route);
        });
    },

    onMarkerClick: function (marker, event, data) {
        var me = MyAvail.Map;

        //CENTER MAP ON MARKER WITH OFFSET
        me.recenterMap(marker.getPosition(), 275, 0);

        //GET PIXEL COORDINATES FROM MARKER
        var pixel = me.getPixelFromLatLng(marker.getPosition());

        //INITIALIZE TOOLTIP
        MyAvail.Tooltip.load({
            url: '~/Stops/Detail',
            data: {
                stop: marker.myAvail.stop,
                selectedRoutes: MyAvail.Route.getSelectedRoutes()
            },
            cssClass: 'ui-tooltip-map-stop',
            position: {
                my: 'middle right',
                at: 'middle left',
                target: pixel,
                container: $('#' + MyAvail.Map.mapElementId),
                viewport: $('#content .inner-content'),
                adjust: {
                    x: -7,
                    y: -6
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
            },
            fnLoad: function (tooltip, contentElement) {
                //INITIALIZE KENDO GRIDS
                $('.departures-grid', contentElement).kendoGrid({
                    columns: [
                        {
                            field: 'Route',
                            width: 160
                        },
                        {
                            field: 'Direction',
                            width: 35
                        },
                        {
                            field: 'Bus',
                            width: 55
                        },
                        {
                            field: 'Destination'
                        },
                        {
                            field: 'SDT',
                            width: 75
                        },
                        {
                            field: 'EDT',
                            width: 65
                        }
                    ],
                    width: '100%'
                });

                $('.loops-grid', contentElement).kendoGrid({
                    width: '100%',
                    height: 95
                });

                // IF THERE ARE SELECTED ROUTES OR SELECTED LOOP ROUTES, COLLAPSE 'OTHER ROUTES'
                if ($('#selected_routes', contentElement).length != 0 || $('#selected_loop_routes', contentElement).length != 0) {
                    $('#other_routes .grid-wrapper', contentElement).hide();
                    $('#loop_routes .grid-wrapper', contentElement).hide();
                }
                //ENABLE COLLAPSIBLE GRIDS
                $('.departures .heading', contentElement).click(function () {
                    var heading = $(this);
                    $(this).next('.grid-wrapper').slideToggle('fast', function () {
                        if (heading.hasClass('collapse')) heading.removeClass('collapse');
                        else heading.addClass('collapse')

                        //REPOSITION TOOLTIP AFTER GRID TOGGLE
                        tooltip.reposition();
                    });
                });

                //ADD TOOLTIPS TO GRID HEADERS
                var headerTipPositionMy = 'bottom right';
                var headerTipPositionAt = 'top middle';
                var headerTipStyle = {
                    classes: 'ui-tooltip-light grid-header-toolip',
                    tip: {
                        width: 15,
                        height: 8,
                        offset: 8,
                        mimic: 'bottom center'
                    }
                };
                $('.grid-header-edt', contentElement).qtip({
                    content: 'EDT = Estimated Departure Time',
                    position: {
                        my: headerTipPositionMy,
                        at: headerTipPositionAt,
                        adjust: {
                            x: 18,
                            y: 9
                        }
                    },
                    style: headerTipStyle
                });
                $('.grid-header-sdt', contentElement).qtip({
                    content: 'SDT = Scheduled Departure Time',
                    position: {
                        my: headerTipPositionMy,
                        at: headerTipPositionAt,
                        adjust: {
                            x: 24,
                            y: 9
                        }
                    },
                    style: headerTipStyle
                });
            }
        });
    },

    grid: {

        currentGrid: null, //CACHE GRID REFERENCE FOR REUSE
        tempSelected: [], //USED FOR RESELECT ON GRID REBINDS

        schema: {
            //ROUTE MODEL MATCHING SERVER
            model: {
                id: "StopId",
                fields: {
                    StopId: { type: 'number' },
                    Name: { type: 'string' },
                    Description: { type: 'string' },
                    Latitude: { type: 'number' },
                    Longitude: { type: 'number' },
                    IsTimePoint: { type: 'boolean' }
                }
            }
        },

        dataSource: {
            transport: {
                read: {
                    url: MyAvail.getStopsRestUrl(),
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json'
                },
                parameterMap: function (options) {
                    return JSON.stringify(options);
                }

            },
            schema: this.schema,
            sort: {
                field: 'Name',
                dir: 'asc'
            },
            pageSize: 17
        },

        init: function () {
            //INITIALIZE KENDO GRID WIH ROUTES
            this.currentGrid = $('#stops_grid').kendoGrid({
                columns: [
                    {
                        field: 'Name',
                        title: 'Stop',
                        template: '<div class="name#if (IsTimePoint) {# time#}#">#= Name #</div>'
                    },
                    {
                        field: 'StopId',
                        title: 'Stop #',
                        template: '<div class="stop-id">#= StopId #</div>',
                        width: 55
                    }
                ],
                height: this.calculateGridHeight(),
                selectable: 'row',
                sortable: true,
                pageable: {
                    buttonCount: 9,
                    info: false
                },
                dataSource: this.dataSource,
                change: this.onChange
            }).data('kendoGrid');
        },

        getDataRead: function () {
            //RETURN CURRENT READ OR STORE FOR LATER GRID RENDER
            if (this.currentGrid) return this.currentGrid.dataSource.transport.options.read;
            else return this.dataSource.transport.read
        },

        updateDataUrl: function (url, data) {
            //ASSIGN NEW VALUES IN CURRENT READ
            var read = this.getDataRead();
            read.url = url;
            if (data) read.data = data;

            //INITIALIZE GRID DATA IF APPLICABLE
            if (this.currentGrid) this.currentGrid.dataSource.read();
            else this.init(); //OR INITIALIZE ENTIRE GRID
        },

        getSelectedRows: function () {
            return this.currentGrid.tbody.find(' > tr.selected-row');
        },

        getRowByUID: function (uid) {
            return this.currentGrid.tbody.find('tr[data-uid="' + uid + '"]');
        },

        addSelection: function (row) {
            //ADD ROW SELECT IDENTIFIER
            row.addClass('selected-row');
        },

        clearSelection: function (row) {
            //REMOVE ROW SELECT IDENTIFIER
            row.removeClass('selected-row');
        },

        clearAllSelections: function () {
            var me = this;

            //CLEAR GRID ROWS
            this.getSelectedRows().each(function (index, row) {
                me.clearSelection($(row));
            });
        },

        applyFilter: function (value) {
            if (this.currentGrid) {
                //FILTER ROUTES GRID BASED ON VALUE
                this.currentGrid.dataSource.filter([
                    {
                        field: "Name",
                        operator: "contains",
                        value: value
                    }
                ]);
            }

            //HANDLE SEARCH BOX IF APPLICABLE
            if (MyAvail.Stop.searchBox.val() != value)
                MyAvail.Stop.searchBox.val(value);
        },

        clearFilter: function () {
            //CLEAR GRID FILTER
            this.currentGrid.dataSource.filter({});

            //CLEAR SEARCH INPUT
            MyAvail.Stop.searchBox.val('');
        },

        isRowSelected: function (row) {
            return row.hasClass('selected-row');
        },

        resizeGrid: function () {
            if (this.currentGrid) {
                var gridElement = this.currentGrid.element;
                var dataArea = gridElement.find('.k-grid-content');

                var newGridHeight = this.calculateGridHeight();
                var newDataAreaHeight = newGridHeight - 10;

                dataArea.height(newDataAreaHeight);
                gridElement.height(newGridHeight);

                this.currentGrid.refresh();
            }
        },

        calculateGridHeight: function () {
            //GET HEIGHT OF ALL CONTAINERS OUTSIDE
            var miscContainerHeights = 82;

            //SUBTRACT SEARCH AND FILTER CONTAINERS
            return MyAvail.Desktop.calculatePanelContentHeight() - miscContainerHeights;
        },

        onChange: function (e) {
            var me = MyAvail.Stop.grid;

            //PERFORM SELECT
            var row = this.select();

            if (!me.isRowSelected(row)) {
                var stop = this.dataItem(row);

                //CLEAR PREVIOUS SELECTION
                me.clearAllSelections();

                //DETERMINE AND HANDLE SELECTED STOP
                if (stop) MyAvail.Stop.selectStop(stop, row);
            }
        }
    }
};

//INITIALIZE
$(function () {
    MyAvail.Stop.init();
});