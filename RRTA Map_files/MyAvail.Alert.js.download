MyAvail.Alert = {
    form: null,
	
	hasHeadway: false,
	
    init: function () {
        var me = this;

        //INITIALIZE VARIABLES
        this.form = $('#set_alert_form');
        var alertWrapper = $('#set_alert_wrapper');
        var alertForm = $('#set_alert_form');
        var alertSubmit = $('input.set-alert', alertWrapper);
        var alertRoute = $('select#alert_route', alertWrapper);
        var alertDirection = $('select#alert_direction', alertWrapper);
        var alertStop = $('select#alert_stop', alertWrapper);
        var alertDepartFrom = $('input#alert_depart_from', alertWrapper);
        var alertDepartTo = $('input#alert_depart_to', alertWrapper);
        var alertNotifyBefore = $('input#alert_notify_before', alertWrapper);
        var alertNotifyBeforeMins = $('input#alert_notify_before_mins', alertWrapper);
        var alertNotifyDuring = $('input#alert_notify_during', alertWrapper);
        var alertNotifyDuringMins = $('input#alert_notify_during_mins', alertWrapper);
        var alertEmail = $('input#alert_email', alertWrapper);
        var alertNotifyEmail = $('input#alert_notify_email', alertWrapper);
        var alertNotifySms = $('input#alert_notify_sms', alertWrapper);
        var alertInfoHelper = $('a.info-helper', alertWrapper);

        //STYLE CHECKBOXES
        alertNotifyBefore.checkBox();
        alertNotifyDuring.checkBox();
        alertNotifyEmail.checkBox();
        alertNotifySms.checkBox();

        //DETERMINE WIDTHS BASED ON RESOLUTION
        var resolutionOffset = 0;
        if (navigator.platform.indexOf('Win') != -1 && $(window).height() < 600) {
            resolutionOffset = 10;
        }

        //HIDE PHONE OPTIONS IF NOT VALIDATED
        MyAvail.getUserProfile(function (data) {
            if (data && !data.IsPhoneValidated)
                alertNotifySms.checkBox('disable');
        });

        //CONVERT INPUTS TO KENDO INPUTS
        alertDepartFrom.width(82 - resolutionOffset).kendoTimePicker({
            value: moment().add('h', 1).minutes(0).format('h:mm a'),
            interval: 15,
            min: moment().minutes(0).toDate(),
            change: function (e) {
                //ENSURE END TIME IS AHEAD OF START TIME
                var time = this.value();
                if (time) {
                    time = new Date(time);
                    time.setMinutes(time.getMinutes() + this.options.interval);
                    //alertDepartTo.data('kendoTimePicker').min(time);
                    alertDepartTo.data('kendoTimePicker').value(time);
                }
            }
        });
        alertDepartTo.width(82 - resolutionOffset).kendoTimePicker({
            value: moment().add('h', 2).minutes(0).format('h:mm a'),
            interval: 15,
            min: moment().minutes(0).toDate()
        });
        alertNotifyBeforeMins.width(90 - resolutionOffset).kendoNumericTextBox({ value: 10, format: '#', decimals: 0 });
        alertNotifyDuringMins.width(90 - resolutionOffset).kendoNumericTextBox({ value: 10, format: '#', decimals: 0 });
        alertRoute.width('100%').kendoComboBox({
            placeholder: !$.browser.msie ? 'Select route' : '', //IE CONFLICT WITH VALIDATION SINCE PLACEHOLDERS ARE NOT SUPPORTED IN IE
            dataTextField: 'LongName',
            dataValueField: 'RouteId',
            //template: '#= RouteId # - #= LongName #',
            dataSource: {
                transport: {
                    read: {
                        url: MyAvail.getRoutesRestUrl(),
                        dataType: 'json'
                    }
                },
                sort: {
                    field: 'SortOrder',
                    dir: 'asc'
                },
                schema: {
                    parse: function (response) {
                        var routesList = [];
						hasHeadway = false;
                        for (var i = 0; i < response.length; i++) {
                            if (response[i].IsHeadway == 0) {
                                routesList.push(response[i]);
                            }
							else {
								hasHeadway = true;
							}
                        }
						MyAvail.Alert.InitTooltip();
                        return routesList;
                    }
                }
            },
            dataBound: function (e) {
                //DEFAULT VALUE TO NULL AND REQUIRE SELECTION
                alertRoute.data('kendoComboBox').value(null);
            },
            change: function (e) {
                //DETERMINE URL FOR REST SERVICE WITH ROUTE ID
                var url = MyAvail.getDirectionsByRouteIDRestUrl(this.value());

                //DISABLE COMBOBOX UNTIL POPULATED
                alertDirection.data('kendoComboBox').enable(false);
                alertStop.data('kendoComboBox').enable(false);
                alertDirection.data('kendoComboBox').value('');
                alertStop.data('kendoComboBox').value('');

                //UPDATE REST URL FOR COMBOBOXES
                alertDirection.data('kendoComboBox').dataSource.transport.options.read.url = url;

                //TRIGGER A READ
                alertDirection.data('kendoComboBox').dataSource.read();

                //CLEAR SELECTIONS
                setTimeout(function () {
                    //GIVE TIME FOR AJAX DATA TO BE LOADED
                    alertDirection.data('kendoComboBox').value('');
                    alertStop.data('kendoComboBox').value('');

                    //ENABLE CASCADING COMBOBOXES
                    alertDirection.data('kendoComboBox').enable(true);
                }, 1500);
            }
        });
        alertDirection.width('100%').kendoComboBox({
            placeholder: !$.browser.msie ? 'Select direction' : '', //IE CONFLICT WITH VALIDATION SINCE PLACEHOLDERS ARE NOT SUPPORTED IN IE
            enable: false,
            dataTextField: 'DirectionDesc',
            dataValueField: 'Dir',
            dataSource: {
                transport: {
                    read: {
                        dataType: 'json'
                    }
                }
            },
            change: function (e) {
                //DETERMINE URL FOR REST SERVICE WITH ROUTE ID
                var url = MyAvail.getStopsForRouteDirectionRestUrl(alertRoute.data('kendoComboBox').value(), this.value(), alertRoute.data('kendoComboBox').dataItem().IsHeadway);

                //DISABLE COMBOBOX UNTIL POPULATED
                alertStop.data('kendoComboBox').enable(false);
                alertStop.data('kendoComboBox').value('');

                //UPDATE REST URL FOR COMBOBOXES
                alertStop.data('kendoComboBox').dataSource.transport.options.read.url = url;

                //TRIGGER A READ
                alertStop.data('kendoComboBox').dataSource.read();

                //CLEAR SELECTIONS
                setTimeout(function () {
                    //GIVE TIME FOR AJAX DATA TO BE LOADED
                    alertStop.data('kendoComboBox').value('');

                    //ENABLE CASCADING COMBOBOXES
                    alertStop.data('kendoComboBox').enable(true);
                }, 1500);
            }
        });
        alertStop.width('100%').kendoComboBox({
            placeholder: !$.browser.msie ? 'Select stop' : '', //IE CONFLICT WITH VALIDATION SINCE PLACEHOLDERS ARE NOT SUPPORTED IN IE
            dataTextField: 'Name',
            template: '(#= StopId #) #= Name #',
            enable: false,
            dataValueField: 'StopId',
            dataSource: {
                transport: {
                    read: {
                        dataType: 'json'
                    }
                },
                sort: {
                    field: 'StopId',
                    dir: 'asc'
                }
            }
        });

        //FIX VALIDATION DUPLICATIONS FROM GENERATED KENDO INPUTS
        alertRoute.removeClass('required');
        alertDirection.removeClass('required');
        alertStop.removeClass('required');

        //SPECIFY THE SUBMIT HANDLER AFTER VALIDATION
        this.form.validate().settings.submitHandler = function (form) {
            //VALIDATE INPUT
            if (MyAvail.Account.userProfile && !$(form.notifyemail).is(':checked') && !$(form.notifysms).is(':checked')) {
                MyAvail.Desktop.openModalDialog('Please select whether you would like<br />to be notified via email and/or SMS.');
                return false;
            }

            //ACTIVATE LOADING PANEL
            MyAvail.Desktop.initLoading();

            //CONSTRUCT SUBSCRIPTION FROM FORM INPUTS
            var subscription = {
                RouteId: form.route.value,
                StopId: form.stop.value,
                Direction: form.direction.value,
                StartTime: form.departfrom.value,
                EndTime: form.departto.value,
                NotifyMinutesBefore: alertNotifyBefore.is(':checked') ? form.notifybeforemins.value : null,
                NotifyMinutesDuring: alertNotifyDuring.is(':checked') ? form.notifyduringmins.value : null
            };

            //HANDLE ANONYMOUS AND AUTHENTICATED SCENARIOS
            if (MyAvail.Account.userProfile) {
                //GET EMAIL IF APPLICABLE
                if ($(form.notifyemail).is(':checked'))
                    subscription.Email = MyAvail.Account.userProfile.Email;

                //GET PHONE IF APPLICABLE
                if ($(form.notifysms).is(':checked'))
                    subscription.Phone = MyAvail.Account.userProfile.Phone;
            } else {
                subscription.Email = form.email.value;
            }

            //ADD STOP SUBSCRIPTION
            MyAvail.addQuickSubscription(subscription, function (data) {
                //DEACTIVATE LOADING PANEL
                MyAvail.Desktop.exitLoading();

                //UPDATE USER WITH STATUS
                if (MyAvail.convertToBoolean(data)) {
                    MyAvail.Desktop.openModalDialog('Alert has been successfully saved.');

                    //SET FORM BACK TO DEFAULTS
                    alertRoute.data('kendoComboBox').value('');
                    alertDirection.data('kendoComboBox').enable(false);
                    alertDirection.data('kendoComboBox').value('');
                    alertStop.data('kendoComboBox').enable(false);
                    alertStop.data('kendoComboBox').value('');
                    alertNotifyBeforeMins.data('kendoNumericTextBox').value(10);
                    alertNotifyDuringMins.data('kendoNumericTextBox').value(10);
                    alertDepartFrom.data('kendoTimePicker').value(moment().add('h', 1).minutes(0).format('h:mm a'));
                    alertDepartTo.data('kendoTimePicker').value(moment().add('h', 2).minutes(0).format('h:mm a'));
                    alertNotifyBefore.checkBox('changeCheckStatus', true);
                } else {
                    MyAvail.Desktop.openModalDialog('Alert was unsuccessful in saving!');
                }
            });
        };
    },

 	    InitTooltip: function () {
        //INITIALIZE TOOLTIP
        var alertWrapper = $('#set_alert_wrapper');
        var alertInfoHelper = $('a.info-helper', alertWrapper);

        var content = 'Click Set Alert to set up a one time alert.'
            + ' To create recurring alerts and manage your subscriptions,'
            + ' please log on and click on profile.';
        if (hasHeadway) {
            content = content + ' Alerts are not available for Loop Service routes.';
        }

        MyAvail.Tooltip.load({
            selector: alertInfoHelper,
            itemId: 'alert_info_helper',
            text: content,
            cssClass: 'ui-tooltip-alert-info-helper',
            position: {
                my: 'left bottom',
                at: 'right center',
                viewport: $(window),
                effect: false,
                adjust: {
                    x: 2,
                    y: 18
                }
            },
            tipStyle: {
                width: 35,
                height: 16,
                offset: 30,
                mimic: 'left center'
            }
        });
    },

	toggleViews: function (authenticated) {
        if (authenticated) {
            $('#set_alert_form .anonymous').hide();
            $('#set_alert_form .authenticated').show();

            //HANDLE VALIDATORS
            $('#set_alert_form .anonymous .required')
                .removeClass('required')
                .addClass('hidden-required');
            $('#set_alert_form .authenticated .hidden-required')
                .addClass('required')
                .removeClass('hidden-required');
        } else {
            $('#set_alert_form .anonymous').show();
            $('#set_alert_form .authenticated').hide();

            //HANDLE VALIDATORS
            $('#set_alert_form .authenticated .required')
                .removeClass('required')
                .addClass('hidden-required');
            $('#set_alert_form .anonymous .hidden-required')
                .addClass('required')
                .removeClass('hidden-required');
        }
    }
};

//INITIALIZE
$(function () {
    MyAvail.Alert.init();
});