MyAvail.Message = {

    publicMessageHashCode: null,
    isRouteFilterActive: false,
    allButton: null,
    selectedButton: null,
    myRoutesButton: null,

    init: function () {
        $('#messages_none').hide();
        this.listView.init();
        this.initRouteFilter();
        this.initPolling();
    },

    initRouteFilter: function () {
        var me = this;
        this.allButton = $('#messages_all_button');
        this.selectedButton = $('#messages_selected_button');
        this.myRoutesButton = $('#messages_myroutes_button');

        //ROUTE CLEAR HANDLER
        this.allButton.click(function (e) {
            e.preventDefault();
            me.isRouteFilterActive = false;
            me.allButton.addClass('selected');
            me.selectedButton.removeClass('selected');
            me.myRoutesButton.removeClass('selected');
            me.listView.clearFilter();
        });

        //ROUTE SEARCH HANDLER
        this.selectedButton.click(function (e) {
            e.preventDefault();
            me.isRouteFilterActive = true;
            me.selectedButton.addClass('selected');
            me.allButton.removeClass('selected');
            me.myRoutesButton.removeClass('selected');
            me.listView.applyFilter(MyAvail.Route.getSelectedRouteIDs());
        });

        //MY ROUTE SEARCH HANDLER
        this.myRoutesButton.click(function (e) {
            e.preventDefault();
            me.isRouteFilterActive = true;
            me.myRoutesButton.addClass('selected');
            me.allButton.removeClass('selected');
            me.selectedButton.removeClass('selected');

            // Update MyRoutes based on subscriptions
            MyAvail.Message.handleRouteSubscriptionChange();
        });
    },

    initPolling: function () {
        //POLL VEHICLES FOR PUBLIC MESSAGES
        //POLLING TECHNIQUE: http://techoctave.com/c7/posts/60-simple-long-polling-example-with-javascript-and-jquery

        //GET PUBLIC MESSAGES HASHCODE FROM SERVER TO CHECK FOR CHANGES
        //RUN IMMEDIATELY, THEN POLL
        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: MyAvail.getPublicMessageHashCodeRestUrl(),
            success: MyAvail.Message.checkHashCode
        });

        (function poll() {
            setTimeout(function () {

                //GET PUBLIC MESSAGES HASHCODE FROM SERVER TO CHECK FOR CHANGES
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: MyAvail.getPublicMessageHashCodeRestUrl(),
                    success: MyAvail.Message.checkHashCode,
                    complete: poll
                });
            }, 10000); // Set Public Message polling interval here
        })();
    },

    handleRouteChange: function () {
        if (this.isRouteFilterActive) this.listView.applyFilter(MyAvail.Route.getSelectedRouteIDs());
    },

    handleRouteSubscriptionChange: function () {
        if (MyAvail.Account.userProfile) {
            var routeIDs = [];
            $.each(MyAvail.Account.userProfile.RouteSubscriptions, function (index, value) {
                // Only show subscribed routes
                if (value.IsSubscribedToMessages) {
                    routeIDs.push(value.Route.RouteId);
                }
            });
            this.listView.applyFilter(routeIDs);
        }
    },

    checkHashCode: function (hashcode) {
        var me = MyAvail.Message;

        //The HashCode matches the stored me.publicMessageHashCode value.  There are no changes so exit the function.
        if (MyAvail.isDefined(me.publicMessageHashCode) && me.publicMessageHashCode == hashcode)
            return;

        me.publicMessageHashCode = hashcode;

        //THE HASHCODE HAS CHANGED; GET UPDATED PUBLIC MESSAGES FROM SERVER
        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: MyAvail.getPublicMessagesRestUrl(),
            success: me.updateDataSource
        });
    },

    updateDataSource: function (messages) {
        var me = MyAvail.Message;

        // Swap elements to show NO messages
        if (messages == null || messages.length == 0) {
            $('#message_count_container').hide();
            $('#messages_list').hide();
            $('#messages_none').show();

            return;
        } else {
            $('#message_count_container').show();
            $('#messages_list').show();
            $('#messages_none').hide();
        }

        // Update the ListView DataSource
        me.listView.currentList.dataSource.data(messages);
    },

    listView: {

        currentList: null, //CACHE GRID REFERENCE FOR REUSE

        schema: {
            //PUBLIC MESSAGE MODEL MATCHING SERVER
            model: {
                id: 'MessageId',
                fields: {
                    MessageId: { type: 'number' },
                    Message: { type: 'string' },
                    FromDate: { type: 'date' },
                    ToDate: { type: 'date' },
                    FromTime: { type: 'date' },
                    ToTime: { type: 'date' },
                    Priority: { type: 'number' },
                    Routes: { type: 'string' }
                }
            },
            type: 'json'
        },

        dataSource: {
            schema: this.schema
        },

        init: function () {
            //INITIALIZE KENDO LISTVIEW WITH MESSAGES
            this.currentList = $('#messages_list').kendoListView({
                height: this.calculateGridHeight,
                selectable: 'row',
                filterable: true,
                scrollable: true,
                dataSource: this.dataSource,
                template: kendo.template($('#message_template').html()),
                altTemplate: kendo.template($('#message_template').html()
                    .replace('class="message-row row"', 'class="message-row alt-row"')), //REUSE EXISTING TEMPLATE
                dataBound: this.onDataBound,
                change: this.onChange
            }).data('kendoListView');
        },

        applyFilter: function (listOfRoutes) {
            if (listOfRoutes) {
                // Set -1 placeholder array if no Routes are selected
                if (!MyAvail.isDefined(listOfRoutes) || listOfRoutes.length < 1) listOfRoutes = [-1];

                //Filter Public Messages in the ListView based on selected routes
                this.currentList.dataSource.filter([
                    {
                        field: 'Routes',
                        operator: function (items, filterValue) {

                            // Custom filtering function. Return TRUE for Routes that are in the SelectedRoutes array.
                            if (!MyAvail.isDefined(items))
                                return false;

                            // Intersection of Message.Routes and SelectedRoutes
                            var intersect = MyAvail.getIntersect(items, listOfRoutes);
                            if (intersect.length > 0) return true;

                            return false;
                        },
                        value: listOfRoutes
                    }
                ]);
            }
        },

        clearFilter: function () {
            //Clear ListView Filter
            this.currentList.dataSource.filter({});
        },

        onDataBound: function (e) {
            var me = MyAvail.Message;

            // Reset Public Message Alert Count class (red -> normal)
            $('#message_count').removeClass('message-priority');

            // Set the Message Count in the UI
            if (me.listView.currentList != null) {
                $('#message_count').html(me.listView.currentList.dataSource.total());

                // Set the Message Count to an alert color class if any of the messages have Priority == 0
                $.each(me.listView.currentList.dataSource.view(), function (key, item) {
                    if (item.Priority == 0) {
                        $('#message_count').addClass('message-priority');
                        return false;
                    }
                });
            }
        },

        onChange: function (e) {
            //GET CONTENT FOR TOOLTIP
            var index = this.select().index();
            var data = this.dataSource.view()[index];
            var content = kendo.render(kendo.template($('#message_tooltip_template').html()), [data]);

            //INITIALIZE TOOLTIP
            MyAvail.Tooltip.load({
                selector: this.select(),
                itemId: 'public_message_detail',
                text: content,
                cssClass: 'ui-tooltip-actions-messagedetail',
                position: {
                    my: 'left top',
                    at: 'right center',
                    viewport: $(window),
                    effect: false,
                    adjust: {
                        x: 2,
                        y: -14
                    }
                },
                tipStyle: {
                    width: 35,
                    height: 16,
                    offset: 10,
                    mimic: 'left center'
                }
            });
        }
    },

    toggleViews: function (authenticated) {
        if (authenticated) MyAvail.Message.myRoutesButton.show();
        else MyAvail.Message.myRoutesButton.hide();
    }
};

//INITIALIZE
$(function () {
    MyAvail.Message.init();
});
