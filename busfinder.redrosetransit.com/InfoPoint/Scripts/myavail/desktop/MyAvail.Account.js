MyAvail.Account = {
    userProfile: null,
    loginTooltip: null,
    profileTooltip: null,
    isEmailChanged: false,

    init: function () {
        var me = this;

        //STORE USER PROFILE FOR LATER USE
        MyAvail.getUserProfile(function (data) {
            me.userProfile = data;

            //INITIALIZE AUTHENTICATED/ANONYMOUS VIEWS
            me.toggleViews(MyAvail.isDefined(me.userProfile));

            //LOAD STATUS ON FIRST PAGE LOAD
            me.loadStatus(function () {
                //INITIALIZE TOOLTIPS FIRST TIME
                me.initTooltips();
            });
        });
    },

    initTooltips: function () {
        //LOAD LOGIN FIRST TIME IF APPLICABLE
        if (this.loginTooltip) {
            //EXTRACT QUERY STRING PARAMS
            var urlParams = MyAvail.getUrlParams();
            var hashParams = MyAvail.getUrlHashParams();

            //DETERMINE PAGE TO LOAD
            if (urlParams.token && urlParams.email) {
                //LOAD PASSWORD VERIFICATION PAGE
                this.loadPasswordVerification(urlParams.email, urlParams.token, true);
            } else if (urlParams.email) {
                //LOAD USER LOGIN PAGE
                this.loadLogin(urlParams.email, true);
            } else if (hashParams.loginfailed) {
                //LOAD USER LOGIN PAGE
                this.loadLogin(hashParams.email, true, function (content) {
                    //DISPLAY ERRORS IN VALIDATION SUMMARY
                    //USE TIMEOUT SINCE FORM RESETS ON INITIALIZE
                    //AND ERASES ERROR MESSAGES
                    setTimeout(function () {
                        MyAvail.Form.displayErrors(
                            $('form', content), [hashParams.loginfailed]);

                        //CLEAR HASH URL
                        window.location.hash = '';
                    }, 500);
                });
            } else if (hashParams.passwordrequest) {
                //LOAD PASSWORD REQUEST PAGE
                this.loadPasswordRequest();
                this.loginTooltip.show();

                //CLEAR HASH URL
                window.location.hash = '';
            } else if (hashParams.register) {
                //LOAD REGISTRATION PAGE
                this.loadRegister();
                this.loginTooltip.show();

                //CLEAR HASH URL
                window.location.hash = '';
            } else {
                //LOAD GENERAL LOGIN PAGE
                this.loadLogin();
            }
        }

        //LOAD PROFILE FIRST TIME IF APPLICABLE
        if (this.profileTooltip) this.loadProfile();
    },

    loadStatus: function (fnLoad) {
        var me = this;

        //LOAD CONTENT FROM SERVER
        $.get(MyAvail.resolveUrl('~/Account/Status'), function (data) {
            var statusWrapper = $('#status_wrapper');

            //UPDATE STATUS AREA
            statusWrapper.html(data);

            //HANDLE LOGOUT BUTTON
            $('.authenticated .logout', statusWrapper).click(function (e) {
                e.preventDefault();
                me.logout();
            });

            //CREATE DIRTY FORM LISTENER FOR PROFILE
            var tooltipEvents = {
                hide: function (event, api) {
                    //RUN DEFAULT HIDE EVENT
                    MyAvail.Tooltip.defaults.events.hide(event, api);

                    //DETERMINE IF TOOLTIP WAS INTENTIONALLY HIDDEN OR IS KENDO CONFLICT
                    var origEvent = event.originalEvent;
                    if ($('#profile_popup', api.elements.content).length && origEvent && !$(origEvent.target).closest('.k-calendar, .k-list').length) {
                        //DETERMINE IF FORM HAS BEEN CHANGED
                        if ($('input#FirstName', api.elements.content).val() != (MyAvail.Account.userProfile.FirstName || '')
                            || $('input#LastName', api.elements.content).val() != (MyAvail.Account.userProfile.LastName || '')
                            || $('input#Email', api.elements.content).val() != (MyAvail.Account.userProfile.Email || '')
                            || $('input#Phone', api.elements.content).val() != (MyAvail.Account.userProfile.Phone || '')
                            || $('input#EnablePublicMessages', api.elements.content).is(':checked') != (MyAvail.isDefined(MyAvail.Account.userProfile.EnablePublicMessages) ? MyAvail.Account.userProfile.EnablePublicMessages : '')
                            || $('input#EnableRouteMessages', api.elements.content).is(':checked') != (MyAvail.isDefined(MyAvail.Account.userProfile.EnableRouteMessages) ? MyAvail.Account.userProfile.EnableRouteMessages : '')
                            || $('input#EnableEmailNotify', api.elements.content).is(':checked') != (MyAvail.isDefined(MyAvail.Account.userProfile.EnableEmailNotify) ? MyAvail.Account.userProfile.EnableEmailNotify : '')
                            || $('input#EnableSmsNotify', api.elements.content).is(':checked') != (MyAvail.isDefined(MyAvail.Account.userProfile.EnableSmsNotify) ? MyAvail.Account.userProfile.EnableSmsNotify : '')
                            || $('input#QuietFrom', api.elements.content).val() != (MyAvail.Account.userProfile.QuietFrom || '')
                            || $('input#QuietTo', api.elements.content).val() != (MyAvail.Account.userProfile.QuietTo || '')) {
                            me.isDirty(true);
                        }
                    }
                }
            };

            //INITIALIZE TOOLTIP FOR PROFILE
            me.profileTooltip = MyAvail.Tooltip.load({
                element: $('.authenticated', statusWrapper),
                itemId: 'profile',
                cssClass: 'ui-tooltip-profile',
                tipStyle: {
                    width: 28,
                    height: 12,
                    offset: 8,
                    mimic: 'top center'
                },
                events: tooltipEvents
            });

            //INITIALIZE TOOLTIP FOR LOGIN
            me.loginTooltip = MyAvail.Tooltip.load({
                element: $('.anonymous .login', statusWrapper),
                itemId: 'login',
                cssClass: 'ui-tooltip-login',
                tipStyle: MyAvail.Tooltip.tipStyle.topCenter
            });

            //CALL LOAD FUNCTION AND PASS SCOPE IF APPLICABLE
            if (fnLoad) fnLoad.call(me);

            //REMOVE UNSAVED STATUS IF APPLICABLE
            me.isDirty(false);
        });
    },

    loadLogin: function (email, show, fnLoad) {
        var me = this;

        //CONSTRUCT URL WITH AVAILABLE PARAMETERS
        var url = '~/Account/Login';
        if (email) url += '?email=' + email;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.loginTooltip,
            url: url,
            fnLoad: function (content) {
                //HANDLE REGISTRATION BUTTON
                $('.register', content).click(function (e) {
                    if (!MyAvail.transitAuthorityConfig.EnableSsl
                        || window.location.protocol == 'https:') {
                        e.preventDefault();
                        me.loadRegister();
                    }
                });

                //HANDLE PASSWORD REQUEST BUTTON
                $('.password-request', content).click(function (e) {
                    if (!MyAvail.transitAuthorityConfig.EnableSsl
                        || window.location.protocol == 'https:') {
                        e.preventDefault();
                        me.loadPasswordRequest();
                    }
                });

                //CALL LOAD FUNCTION AND PASS CONTENT IF APPLICABLE
                if (fnLoad) fnLoad(content);
            },
            fnSubmitSuccess: function () {
                //STORE USER PROFILE FOR LATER USE
                MyAvail.getUserProfile(function (data) {
                    me.userProfile = data;

                    //REFRESH LOGIN STATUS
                    me.loadStatus(function () {
                        //LOAD USER PROFILE AND PREFERENCES
                        me.loadProfile();

                        //TOGGLE AUTHENTICATED VIEWS
                        me.toggleViews(true);
                    });
                });
            }
        });

        //SHOW TOOLTIP IF REQUESTED
        if (show) this.loginTooltip.show();
    },

    loadRegister: function () {
        var me = this;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.loginTooltip,
            url: '~/Account/Register',
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.login', content).click(function (e) {
                    e.preventDefault();
                    me.loadLogin();
                });
            },
            fnSubmitSuccess: function (data) {
                //REFRESH LOGIN STATUS
                me.loadStatus(function () {
                    //TOGGLE AUTHENTICATED VIEWS
                    me.toggleViews(true);

                    //LOAD USER PROFILE AND PREFERENCES
                    me.loadEmailVerifyRequest(function () {
                        //UPDATE USER WITH INSTRUCTION
                        MyAvail.Desktop.openModalDialog(
                            'An email has been sent to you for verification.'
                                + ' Please provide the access code to activate your account.',
                            null,
                            function () {
                                //SHOW PROFILE AREA TO DIRECT USER TO UPDATE
                                me.profileTooltip.show();
                            });
                    });
                });
            }
        });
    },

    loadEmailVerify: function (fnLoad) {
        var me = this;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/EmailVerify',
            fnLoad: function (content, tooltip) {
                //RESIZE AND REPOSITION SMALLER TOOLTIP
                tooltip.elements.tooltip.addClass('ui-tooltip-profile-small');
                tooltip.reposition();

                //HANDLE ACCESS CODE BUTTON
                $('.enter-code', content).click(function (e) {
                    e.preventDefault();
                    me.loadEmailVerifyRequest();
                });

                //CALL LOAD FUNCTION AND PASS SCOPE IF APPLICABLE
                if (fnLoad) fnLoad.call(me);
            },
            fnSubmitSuccess: function () {
                //DISPLAY PHONE VERIFICATION PAGE
                me.loadEmailVerifyRequest();
            }
        });
    },

    loadEmailVerifyRequest: function (fnLoad) {
        var me = this;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/EmailVerifyRequest',
            fnLoad: function (content, tooltip) {
                //RESIZE AND REPOSITION SMALLER TOOLTIP
                tooltip.elements.tooltip.addClass('ui-tooltip-profile-small');
                tooltip.reposition();

                //HANDLE ACCESS CODE BUTTON
                $('.resend-code', content).click(function (e) {
                    e.preventDefault();
                    me.loadEmailVerify();
                });

                //CALL LOAD FUNCTION AND PASS SCOPE IF APPLICABLE
                if (fnLoad) fnLoad.call(me);
            },
            fnSubmitSuccess: function () {
                //STORE UPDATED USER PROFILE FOR LATER USE
                MyAvail.getUserProfile(function (data) {
                    MyAvail.Account.userProfile = data;

                    //DISPLAY PHONE VERIFICATION SUCCESS PAGE
                    me.loadEmailVerifySuccess();
                });
            }
        });
    },

    loadEmailVerifySuccess: function () {
        var me = this;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/EmailVerifySuccess',
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();

                    //ACTIVATE LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    me.loadProfile(function () {
                        //DEACTIVATE LOADING PANEL
                        MyAvail.Desktop.exitLoading();

                        //TOGGLE AUTHENTICATED VIEWS
                        me.toggleViews(true);

                        //UPDATE USER WITH INSTRUCTION IF APPLICABLE
                        if (!me.isEmailChanged) {
                            MyAvail.Desktop.notifyInfo('Remember to update your profile for subscription features.');
                        }
                        else {
                            //RESET EMAIL CHANGED FLAG IN CASE LOG/REGISTER OCCURS
                            me.isEmailChanged = false;
                        }
                    });
                });
            }
        });
    },

    loadPasswordRequest: function () {
        var me = this;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.loginTooltip,
            url: '~/Account/PasswordRequest',
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.login', content).click(function (e) {
                    e.preventDefault();
                    me.loadLogin();
                });
            },
            fnSubmitSuccess: function (response) {
                me.loadPasswordVerification(response.email);
            }
        });
    },

    loadPasswordVerification: function (email, token, show) {
        var me = this;

        //CONSTRUCT URL WITH AVAILABLE PARAMETERS
        var url = '~/Account/PasswordVerification';
        if (token) url = MyAvail.setUrlParams(url, { token: token });
        if (email) url = MyAvail.setUrlParams(url, { email: email });

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.loginTooltip,
            url: url,
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.login', content).click(function (e) {
                    e.preventDefault();
                    me.loadLogin(email);
                });
            },
            fnSubmitSuccess: function () {
                me.loadPasswordResult(email);
            }
        });

        //SHOW TOOLTIP IF REQUESTED
        if (show) me.loginTooltip.show();
    },

    loadPasswordResult: function (email) {
        var me = this;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.loginTooltip,
            url: '~/Account/PasswordResult',
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.login', content).click(function (e) {
                    e.preventDefault();
                    me.loadLogin(email);
                });
            }
        });
    },

    loadProfile: function (fnLoad) {
        var me = this;

        //PROCESS ONLY IF VERIFIED ACCOUNT
        if (this.userProfile.IsEmailValidated) {
            //LOAD CONTENT AND HANDLE SUBMIT
            MyAvail.Tooltip.loadContent({
                tooltip: this.profileTooltip,
                url: '~/Account/UserProfile',
                fnLoad: function (content, tooltip) {
                    //RESIZE AND REPOSITION SMALLER TOOLTIP
                    var tooltipElement = tooltip.elements.tooltip;
                    if (tooltipElement.hasClass('ui-tooltip-profile-small')) {
                        tooltip.elements.tooltip.removeClass('ui-tooltip-profile-small');
                        tooltip.reposition();
                    }

                    //STYLE CHECKBOXES
                    $('input[type=checkbox], input[type=radio]', content).checkBox();

                    //CONVERT INPUTS TO KENDO INPUTS
                    $('input#QuietFrom, input#QuietTo', content).width(95).kendoTimePicker({ interval: 15 });

                    //HANDLE NAV BUTTONS
                    $('.personal-info', content).click(function (e) {
                        e.preventDefault();
                    });

                    $('.my-routes', content).click(function (e) {
                        e.preventDefault();
                        me.loadRoutes();
                    });

                    //HANDLE CHANGE PASSWORD BUTTON
                    $('.change-password', content).click(function (e) {
                        e.preventDefault();
                        me.loadPassword();

                        //REMOVE UNSAVED STATUS IF APPLICABLE
                        me.isDirty(false);
                    });

                    //HANDLE DELETE ACCOUNT BUTTON
                    $('.delete-account', content).click(function (e) {
                        e.preventDefault();
                        me.deleteAccount();
                    });

                    //HANDLE DELETE ACCOUNT BUTTON
                    $('.cancel', content).click(function (e) {
                        e.preventDefault();
                        me.loadProfile();
                        me.profileTooltip.hide();

                        //REMOVE UNSAVED STATUS IF APPLICABLE
                        me.isDirty(false);
                    });

                    //HANDLE DELETE ACCOUNT BUTTON
                    $('.clear-times', content).click(function (e) {
                        e.preventDefault();
                        $('input#QuietFrom', content).data('kendoTimePicker').value('');
                        $('input#QuietTo', content).data('kendoTimePicker').value('');
                    });

                    //HELP TOOLTIPS DEFAULTS
                    var headerTipPositionMy = 'bottom middle';
                    var headerTipPositionAt = 'top middle';
                    var headerTipStyle = {
                        classes: 'ui-tooltip-light ui-tooltip-shadow ui-tooltip-tipped ui-subscribe-help-toolip',
                        tip: {
                            width: 15,
                            height: 8
                        }
                    };

                    //INITIALIZE SUBSCRIBE HELP TOOLTIP
                    $('.subscribe-help a', content).qtip({
                        content: 'Select "Public announcements" to receive notifications of general messages. Select "Route specific" to receive all route-specific messages. You can subscribe to individual route messages by selecting the Routes tab above.',
                        position: {
                            my: headerTipPositionMy,
                            at: headerTipPositionAt
                        },
                        style: headerTipStyle
                    }).click(function (e) {
                        e.preventDefault()
                    });

                    //STORE USER PROFILE FOR LATER USE
                    MyAvail.getUserProfile(function (data) {
                        me.userProfile = data;

                        //HANDLE PHONE VERIFICATION IF APPLICABLE
                        if (me.userProfile) {
                            var enableSmsNotify = $('input#EnableSmsNotify', content);
                            var verifyPhoneArea = $('.verify-phone', content);
                            if (me.userProfile.IsPhoneValidated) {
                                enableSmsNotify.checkBox('enable');
                                verifyPhoneArea.hide();
                                $('#set_alert_wrapper input#alert_notify_sms').checkBox('enable');
                            } else {
                                enableSmsNotify.checkBox('disable');
                                verifyPhoneArea.show();
                                verifyPhoneArea.find('a').click(function (e) {
                                    e.preventDefault();
                                    me.loadPhoneVerify($('input#Phone', content).val());
                                });
                                $('#set_alert_wrapper input#alert_notify_sms').checkBox('disable');
                            }
                        }

                        //CALL LOAD FUNCTION AND PASS SCOPE IF APPLICABLE
                        if (fnLoad) fnLoad.call(me);
                    });
                },
                fnSubmitSuccess: function (data) {
                    //UPDATE LOCAL PROFILE
                    me.userProfile = data.profile;

                    //DISPLAY CHANGE PROFILE SUCCESS PAGE IF APPLICABLE
                    if (me.userProfile) {
                        me.loadProfileSuccess();
                    } else {
                        //NO PROFILE WAS RETURN
                        //LIKELY USERNAME CHANGED
                        //REFRESH LOGIN STATUS
                        me.loadStatus(function () {
                            //TOGGLE AUTHENTICATED VIEWS
                            me.toggleViews(false);

                            //LOAD USER LOGIN PAGE
                            // ENCODE FOR SPECIAL CHARACTERS (+)
                            me.loadLogin(encodeURIComponent(data.email), true);
                        });
                    }

                    //REMOVE UNSAVED STATUS IF APPLICABLE
                    me.isDirty(false);
                },
                fnBeforeSubmit: function (arr, formObj, options) {
                    //WARN USER IF EMAIL IS BEING CHANGED
                    if (MyAvail.Account.userProfile.Email != formObj[0].Email.value) {
                        var response = confirm('You are attempting to change your email. This will force you to log out and validate the email. Would you like to continue?');
                        if (!response) MyAvail.Desktop.exitLoading();
                        else me.isEmailChanged = true;
                        return response;
                    }
                }
            });
        } else {
            this.loadEmailVerifyRequest();
        }
    },

    loadProfileSuccess: function () {
        var me = this;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/UserProfileSuccess',
            fnLoad: function (content, tooltip) {
                //RESIZE AND REPOSITION SMALLER TOOLTIP
                tooltip.elements.tooltip.addClass('ui-tooltip-profile-small');
                tooltip.reposition();

                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();

                    //ACTIVATE LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    me.loadProfile(function () {
                        //DEACTIVATE LOADING PANEL
                        MyAvail.Desktop.exitLoading();
                    });
                });
            }
        });
    },

    loadPhoneVerify: function (phone) {
        var me = this;
        var phoneInput;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/PhoneVerify',
            fnLoad: function (content, tooltip) {
                //RESIZE AND REPOSITION SMALLER TOOLTIP
                tooltip.reposition();

                //PREFILL PHONE NUMBER
                phoneInput = $('input#Phone', content);
                phoneInput.val(phone);

                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();

                    //ACTIVATE LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    me.loadProfile(function () {
                        //DEACTIVATE LOADING PANEL
                        MyAvail.Desktop.exitLoading();
                    });
                });

                //HANDLE ACCESS CODE BUTTON
                $('.enter-code', content).click(function (e) {
                    e.preventDefault();
                    me.loadPhoneVerifyRequest(phoneInput.val());
                });
            },
            fnSubmitSuccess: function () {
                //DISPLAY PHONE VERIFICATION PAGE
                me.loadPhoneVerifyRequest(phoneInput.val());
            }
        });
    },

    loadPhoneVerifyRequest: function (phone) {
        var me = this;
        var phoneInput;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/PhoneVerifyRequest',
            fnLoad: function (content) {
                //PREFILL PHONE NUMBER
                phoneInput = $('input#Phone', content);
                phoneInput.val(phone);

                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();

                    //ACTIVATE LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    me.loadProfile(function () {
                        //DEACTIVATE LOADING PANEL
                        MyAvail.Desktop.exitLoading();
                    });
                });

                //HANDLE ACCESS CODE BUTTON
                $('.resend-code', content).click(function (e) {
                    e.preventDefault();
                    me.loadPhoneVerify(phoneInput.val());
                });
            },
            fnSubmitSuccess: function () {
                //STORE UPDATED USER PROFILE FOR LATER USE
                MyAvail.getUserProfile(function (profile) {
                    MyAvail.Account.userProfile = profile;

                    //DISPLAY PHONE VERIFICATION SUCCESS PAGE
                    me.loadPhoneVerifySuccess();
                });
            }
        });
    },

    loadPhoneVerifySuccess: function () {
        var me = this;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/PhoneVerifySuccess',
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();

                    //ACTIVATE LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    me.loadProfile(function () {
                        //DEACTIVATE LOADING PANEL
                        MyAvail.Desktop.exitLoading();
                    });
                });
            }
        });
    },

    loadRoutes: function (fnLoad) {
        var me = this;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/Routes',
            fnLoad: function (content, tooltip) {
                //RESIZE AND REPOSITION SMALLER TOOLTIP
                var tooltipElement = tooltip.elements.tooltip;
                if (tooltipElement.hasClass('ui-tooltip-profile-small')) {
                    tooltip.elements.tooltip.removeClass('ui-tooltip-profile-small');
                    tooltip.reposition();
                }

                //HANDLE NAV BUTTON
                $('.personal-info', content).click(function (e) {
                    e.preventDefault();

                    //ACTIVATE LOADING PANEL
                    MyAvail.Desktop.initLoading();

                    me.loadProfile(function () {
                        //DEACTIVATE LOADING PANEL
                        MyAvail.Desktop.exitLoading();
                    });
                });

                $('.my-routes', content).click(function (e) {
                    e.preventDefault();
                });

                //INITALIZE ADD ROUTE FORM
                MyAvail.Form.initDynamic({
                    form: $('#add_route_form'),
                    fnSubmit: function (form) {
                        //GET SELECT ROUTE
                        var route = routesComboBox.dataItem();

                        //SUBSCRIBE TO ROUTE
                        if (route) {
                            //GET EXISTING ITEM IF APPLICABLE
                            var dataUid;
                            $.each(routesGrid.dataSource.data(), function (index, value) {
                                if (value.Route.RouteId == route.RouteId) {
                                    dataUid = value.uid;
                                    return false;
                                }
                            });

                            //ADD ITEM IF APPLICABLE
                            if (!dataUid) {
                                //ADD ROUTE TO GRID
                                var addedItem = routesGrid.dataSource.add({ Route: route });
                                dataUid = addedItem.uid;

                                //EXPAND ADDED ROW
                                var masterRow = routesGrid.tbody.find('> tr[data-uid="' + dataUid + '"]')
                                routesGrid.expandRow(masterRow);
                                masterRow.next('.k-detail-row').find('input[type=button].add-subscription').click();

                                //ADD UNSAVED STATUS
                                me.isDirty(true);
                            } else {
                                MyAvail.Desktop.notifyInfo('Route has been previously added. Please modify the route below.');
                            }
                        }
                    }
                });

                //POPULATE ROUTES DROP DOWN
                var routesComboBox = $('input#route_subscribe').width(200).kendoComboBox({
                    placeholder: 'Select route',
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
                                for (var i = 0; i < response.length; i++) {
                                    if (response[i].IsHeadway == 0) {
                                        routesList.push(response[i]);
                                    }
                                }
                                return routesList;
                            }
                        }
                    }
                }).data('kendoComboBox');
                //FIX VALIDATION DUPLICATIONS FROM GENERATED KENDO INPUTS
                routesComboBox.element.removeClass('required');

                var subscriptionDetailInit = function (e) {
                    var dataItem = e.data;
                    var detailRow = e.detailRow;

                    //STYLE CHECKBOXES
                    $('input[type=checkbox], input[type=radio]', detailRow).checkBox();

                    //HANDLE ROUTE MESSAGE SUBSCRIPTION
                    var notifyRouteMessages = $('#subscribe_messages_' + dataItem.Route.RouteId, detailRow);
                    notifyRouteMessages.checkBox('changeCheckStatus', dataItem.IsSubscribedToMessages)
                    notifyRouteMessages.checkBox({
                        'change': function (e, ui) {
                            if (ui.checked) {
                                MyAvail.addRouteSubscription(this.value, function (data) {
                                    //UPDATE USER ON STATUS
                                    var message = MyAvail.convertToBoolean(data)
                                        ? 'Subscription to route messages was saved.'
                                        : 'Subscription to route messages was unsuccessful!';
                                    MyAvail.Desktop.openModalDialog(message);
                                });
                            } else {
                                MyAvail.deleteRouteSubscription(this.value, function (data) {
                                    //UPDATE USER ON STATUS
                                    var message = MyAvail.convertToBoolean(data)
                                        ? 'Unsubscribe to route messages was saved.'
                                        : 'Unsubscribe to route messages was unsuccessful!';
                                    MyAvail.Desktop.openModalDialog(message);
                                });
                            }
                        }
                    });

                    //INITIALIZE FORM INPUT VARIABLES
                    var subscriptionForm = $('form.add-subscription', detailRow);
                    subscriptionForm.resetClose = function () {
                        //HANDLE HIDDEN INPUT
                        subscriptionID.val('');

                        //SET SOME FORM INPUTS BACK TO DEFAULTS
                        notifyBeforeMins.value(10);
                        notifyDuringMins.value(10);
                        departFrom.value(moment().add('h', 1).minutes(0).format('h:mm A'));
                        departTo.value(moment().add('h', 2).minutes(0).format('h:mm A'));
                        notifyBefore.checkBox('changeCheckStatus', true);
                        direction.value('');
                        stopsComboBox.enable(false);
                        stopsComboBox.value('');

                        //HIDE FORM
                        this.hide();
                        $('input[type=button].add-subscription', this.parent()).show();
                    };
                    var subscriptionID = $('#subscription_detail_id_' + dataItem.Route.RouteId, detailRow)
                    var departFrom = $('#subscription_detail_depart_from_' + dataItem.Route.RouteId, detailRow)
                        .width(100).kendoTimePicker({
                            value: moment().add('h', 1).minutes(0).format('h:mm a'),
                            interval: 15,
                            change: function (e) {
                                //ENSURE END TIME IS AHEAD OF START TIME
                                var time = this.value();
                                if (time) {
                                    time = new Date(time);
                                    time.setMinutes(time.getMinutes() + this.options.interval);
                                    //departTo.min(time);
                                    departTo.value(time);
                                }
                            }
                        }).data('kendoTimePicker');
                    var departTo = $('#subscription_detail_depart_to_' + dataItem.Route.RouteId, detailRow)
                        .width(100).kendoTimePicker({
                            value: moment().add('h', 2).minutes(0).format('h:mm a'),
                            interval: 15
                        }).data('kendoTimePicker');
                    var notifyBefore = $('#subscription_detail_notify_before_' + dataItem.Route.RouteId, detailRow);
                    var notifyDuring = $('#subscription_detail_notify_during_' + dataItem.Route.RouteId, detailRow);
                    var notifyBeforeMins = $('#subscription_detail_notify_before_mins_' + dataItem.Route.RouteId, detailRow)
                        .width(100).kendoNumericTextBox({ value: 10, format: '#', decimals: 0 })
                        .data('kendoNumericTextBox');
                    var notifyDuringMins = $('#subscription_detail_notify_during_mins_' + dataItem.Route.RouteId, detailRow)
                        .width(100).kendoNumericTextBox({ value: 10, format: '#', decimals: 0 })
                        .data('kendoNumericTextBox');
                    var lastBus = $('#subscription_detail_last_bus_' + dataItem.Route.RouteId, detailRow);

                    // Disable LastBus for headway routes
                    if (dataItem.Route.IsHeadway) {
                        lastBus.checkBox('disable');
                    }

                    var direction = $('#subscription_detail_direction_' + dataItem.Route.RouteId, detailRow).width('100%').kendoComboBox({
                        placeholder: !$.browser.msie ? 'Select direction' : '', //IE CONFLICT WITH VALIDATION SINCE PLACEHOLDERS ARE NOT SUPPORTED IN IE
                        dataTextField: 'DirectionDesc',
                        dataValueField: 'Dir',
                        dataSource: {
                            transport: {
                                read: {
                                    url: MyAvail.getDirectionsByRouteIDRestUrl(dataItem.Route.RouteId),
                                    dataType: 'json'
                                }
                            }
                        },
                        change: function (e) {
                            //DETERMINE URL FOR REST SERVICE WITH ROUTE ID
                            var url = MyAvail.getStopsForRouteDirectionRestUrl(dataItem.Route.RouteId, this.value(), dataItem.Route.IsHeadway);

                            //DISABLE COMBOBOX UNTIL POPULATED
                            stopsComboBox.enable(false);
                            stopsComboBox.value('');

                            //UPDATE REST URL FOR COMBOBOXES
                            stopsComboBox.dataSource.transport.options.read.url = url;

                            //TRIGGER A READ
                            stopsComboBox.dataSource.read();

                            //CLEAR SELECTIONS
                            setTimeout(function () {
                                //GIVE TIME FOR AJAX DATA TO BE LOADED
                                stopsComboBox.value('');

                                //ENABLE CASCADING COMBOBOXES
                                stopsComboBox.enable(true);
                            }, 1500);
                        }
                    }).data('kendoComboBox');
                    var stopsComboBox = $('#subscription_detail_stop_' + dataItem.Route.RouteId, detailRow).width('100%').kendoComboBox({
                        placeholder: !$.browser.msie ? 'Select stop' : '', //IE CONFLICT WITH VALIDATION SINCE PLACEHOLDERS ARE NOT SUPPORTED IN IE
                        enable: false,
                        dataTextField: 'Name',
						template: '(#= StopId #) #= Name #',
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
                    }).data('kendoComboBox');
                    var stopsGrid = $('.subscription-stops-grid', detailRow).kendoGrid({
                        columns: [
                            {
                                field: 'Id',
                                title: 'Stop',
                                template: '<div class="stop-row">Stop #= StopId #, #= Stop.Name #, #= Direction #, ' +
                                    '#= moment(StartTime).format("h:mm") + "-" + moment(EndTime).format("h:mm A") #</div>'
                            },
                            {
                                command: [
                                    {
                                        text: "Delete",
                                        click: function (e) {
                                            var me = this;
                                            e.preventDefault();

                                            MyAvail.Desktop.openModalConfirmation(
                                                'Are you sure you would like<br />to delete this subsciption?',
                                                function () {
                                                    //FIND SUBSCRIPTION TO DELETE
                                                    var subscription = me.dataItem($(e.currentTarget).closest('tr'));

                                                    //ACTIVATE LOADING PANEL
                                                    MyAvail.Desktop.initLoading();

                                                    //ADD STOP SUBSCRIPTION
                                                    MyAvail.deleteStopSubscription(subscription, function (data) {
                                                        //UPDATE USER WITH STATUS
                                                        if (MyAvail.convertToBoolean(data)) {
                                                            //STORE UPDATED USER PROFILE FOR LATER USE
                                                            MyAvail.getUserProfile(function (profile) {
                                                                MyAvail.Account.userProfile = profile;

                                                                //UPDATE GRID WITHOUT SUBSCRIPTION BY RELOADING DATA
                                                                var found = false;
                                                                $.each(MyAvail.Account.userProfile.RouteSubscriptions, function (index, value) {
                                                                    if (value.Route.RouteId == dataItem.Route.RouteId) {
                                                                        stopsGrid.dataSource.data(value.StopSubscriptions);
                                                                        found = true;
                                                                        return false;
                                                                    }
                                                                });

                                                                //REMOVE ROUTE FROM GRID IF APPLICABLE
                                                                if (!found) routesGrid.dataSource.remove(dataItem);

                                                                //RESET AND CLOSE THE FORM
                                                                subscriptionForm.resetClose();

                                                                //DEACTIVATE LOADING PANEL
                                                                MyAvail.Desktop.exitLoading();
                                                            });
                                                        } else {
                                                            //SERVER COULD NOT CREATE SUBSCRIPTION
                                                            MyAvail.Desktop.openModalDialog('Subscription was unsuccessful!');
                                                        }
                                                    });
                                                });
                                        }
                                    },
                                    {
                                        text: "Edit",
                                        click: function (e) {
                                            e.preventDefault();

                                            //POPULATE AND SHOW FORM WITH SUBSCRIPTION
                                            var subscription = this.dataItem($(e.currentTarget).closest("tr"));

                                            //SHOW FORM
                                            subscriptionForm.show();
                                            $('input[type=button].add-subscription', detailRow).hide();

                                            //POPULATE FORM INPUTS WITH MODEL
                                            subscriptionID.val(subscription.Id);
                                            direction.select(function (item) {
                                                return item.Dir === subscription.Direction;
                                            });

                                            //HANDLE STOP SELECTION SINCE DEPENDS ON DIRECTION
                                            var url = MyAvail.getStopsForRouteDirectionRestUrl(dataItem.Route.RouteId, direction.value(), dataItem.Route.IsHeadway);
                                            stopsComboBox.enable(true);
                                            stopsComboBox.dataSource.transport.options.read.url = url;
                                            stopsComboBox.dataSource.read();
                                            //MUST ADD TIMEOUT BEFORE SELECTION TO GIVE TIME FOR DATA TO BE RETRIEVED FROM SERVER
                                            //TODO: DATASOURCE CHANGE CALLBACK NOT WORKING OR STICKS FOR OTHER REQUESTS
                                            setTimeout(function () {
                                                stopsComboBox.select(function (item) {
                                                    return item.StopId === subscription.StopId;
                                                });
                                            }, 1000)

                                            departFrom.value(moment(subscription.StartTime).format('h:mm A'));
                                            departTo.value(moment(subscription.EndTime).format('h:mm A'));
                                            if (subscription.NotifyMinutesBefore) {
                                                notifyBeforeMins.value(subscription.NotifyMinutesBefore);
                                                notifyBefore.checkBox('changeCheckStatus', true);
                                            }
                                            if (subscription.NotifyMinutesDuring) {
                                                notifyDuringMins.value(subscription.NotifyMinutesDuring);
                                                notifyDuring.checkBox('changeCheckStatus', true);
                                            }
                                            lastBus.checkBox('changeCheckStatus', subscription.IsSubscribedLastBus);

                                            //POPULATE DAYS OF WEEK
                                            subscribeMonday.checkBox('changeCheckStatus', subscription.Monday);
                                            subscribeTuesday.checkBox('changeCheckStatus', subscription.Tuesday);
                                            subscribeWednesday.checkBox('changeCheckStatus', subscription.Wednesday);
                                            subscribeThursday.checkBox('changeCheckStatus', subscription.Thursday);
                                            subscribeFriday.checkBox('changeCheckStatus', subscription.Friday);
                                            subscribeSaturday.checkBox('changeCheckStatus', subscription.Saturday);
                                            subscribeSunday.checkBox('changeCheckStatus', subscription.Sunday);
                                        }
                                    }
                                ]
                            }
                        ],
                        pageable: false,
                        dataSource: {
                            data: dataItem.StopSubscriptions
                        }
                    }).data('kendoGrid');
                    var subscribeMonday = $('#subscription_detail_monday_' + dataItem.Route.RouteId, detailRow);
                    var subscribeTuesday = $('#subscription_detail_tuesday_' + dataItem.Route.RouteId, detailRow);
                    var subscribeWednesday = $('#subscription_detail_wednesday_' + dataItem.Route.RouteId, detailRow);
                    var subscribeThursday = $('#subscription_detail_thursday_' + dataItem.Route.RouteId, detailRow);
                    var subscribeFriday = $('#subscription_detail_friday_' + dataItem.Route.RouteId, detailRow);
                    var subscribeSaturday = $('#subscription_detail_saturday_' + dataItem.Route.RouteId, detailRow);
                    var subscribeSunday = $('#subscription_detail_sunday_' + dataItem.Route.RouteId, detailRow);

                    //INITALIZE ADD SUBSCRIPTION FORM AND VALIDATIONS
                    MyAvail.Form.initDynamic({
                        form: subscriptionForm,
                        fnLoad: function (form) {
                            //FIX VALIDATION DUPLICATIONS FROM GENERATED KENDO INPUTS
                            stopsComboBox.element.removeClass('required');
                            direction.element.removeClass('required');

                            //TOGGLE FIELDS ON LAST BUS SELECTION
                            lastBus.checkBox({
                                'change': function (e, ui) {
                                    departFrom.enable(!ui.checked);
                                    departTo.enable(!ui.checked);
                                    notifyDuringMins.enable(!ui.checked);
                                    if (ui.checked) {
                                        notifyBefore.checkBox('changeCheckStatus', true);
                                        notifyDuring.checkBox('changeCheckStatus', false);
                                        notifyDuring.checkBox('disable');
                                    } else {
                                        notifyDuring.checkBox('enable');
                                        notifyBefore.checkBox('changeCheckStatus', true);
                                    }
                                }
                            });
                        },
                        fnSubmit: function (form) {
                            //MANUALLY VALIDATE SOME FORM INPUT
                            //TODO: TOO COMPLEX FOR DATA HTML DECLARATION?
                            if (!subscribeMonday.is(':checked')
                                && !subscribeTuesday.is(':checked')
                                && !subscribeWednesday.is(':checked')
                                && !subscribeThursday.is(':checked')
                                && !subscribeFriday.is(':checked')
                                && !subscribeSaturday.is(':checked')
                                && !subscribeSunday.is(':checked')) {
                                $('.subscription-days .validation-errors').html('Please select at least one week day.');
                                return false;
                            } else {
                                //CLEAR ANY VALIDATION ERRORS
                                $('.subscription-days .validation-errors').html('');
                            }

                            //CONSTRUCT SUBSCRIPTION FROM FORM INPUTS
                            var subscription = {
                                Id: subscriptionID.val(),
                                RouteId: dataItem.Route.RouteId,
                                StopId: stopsComboBox.value(),
                                Direction: direction.value(),
                                StartTime: departFrom.value(),
                                EndTime: departTo.value(),
                                NotifyMinutesBefore: notifyBefore.is(':checked') ? notifyBeforeMins.value() : null,
                                NotifyMinutesDuring: notifyDuring.is(':checked') ? notifyDuringMins.value() : null,
                                IsSubscribedLastBus: lastBus.is(':checked'),
                                Email: MyAvail.Account.userProfile.Email,
                                Phone: MyAvail.Account.userProfile.Phone,
                                Monday: subscribeMonday.is(':checked'),
                                Tuesday: subscribeTuesday.is(':checked'),
                                Wednesday: subscribeWednesday.is(':checked'),
                                Thursday: subscribeThursday.is(':checked'),
                                Friday: subscribeFriday.is(':checked'),
                                Saturday: subscribeSaturday.is(':checked'),
                                Sunday: subscribeSunday.is(':checked')
                            };

                            //ACTIVATE LOADING PANEL
                            MyAvail.Desktop.initLoading();

                            //ADD STOP SUBSCRIPTION
                            MyAvail.addOrUpdateStopSubscription(subscription, function (data) {
                                //UPDATE USER WITH STATUS
                                if (MyAvail.convertToBoolean(data)) {
                                    //STORE UPDATED USER PROFILE FOR LATER USE
                                    MyAvail.getUserProfile(function (profile) {
                                        MyAvail.Account.userProfile = profile;

                                        //UPDATE GRID WITH NEW SUBSCRIPTION BY RELOADING DATA
                                        $.each(MyAvail.Account.userProfile.RouteSubscriptions, function (index, value) {
                                            if (value.Route.RouteId == dataItem.Route.RouteId) {
                                                stopsGrid.dataSource.data(value.StopSubscriptions);
                                                return false;
                                            }
                                        });

                                        //DEACTIVATE LOADING PANEL
                                        MyAvail.Desktop.exitLoading();
                                    });

                                    //RESET AND CLOSE THE FORM
                                    subscriptionForm.resetClose();
                                } else {
                                    //SERVER COULD NOT CREATE SUBSCRIPTION
                                    MyAvail.Desktop.openModalDialog('Subscription was unsuccessful!');
                                }
                            });
                        }
                    });

                    //CLOSE FORM ON CANCEL
                    $('.cancel-changes', detailRow).click(function (e) {
                        e.preventDefault();

                        //RESET AND CLOSE THE FORM
                        subscriptionForm.resetClose();

                        //REMOVE UNSAVED STATUS IF APPLICABLE
                        me.isDirty(false);
                    });

                    //HANDLE SUBSCRIPTION ACTION CLICKS
                    $('input[type=button].add-subscription', detailRow).click(function (e) {
                        e.preventDefault();
                        $('form.add-subscription', detailRow).show();
                        $(this).hide();
                    });
                }

                //INITIALIZE KENDO GRID WIH ROUTES
                var routesGrid = $('#routes_subscription_grid').kendoGrid({
                    columns: [
                        {
                            field: 'Route.LongName',
                            title: 'Name',
                            template: '<div class="route-name">#= Route.LongName #</div>'
                        }
                    ],
                    dataSource: {
                        data: me.userProfile.RouteSubscriptions
                    },
                    detailTemplate: kendo.template($('#myroutes_detail_template').html()),
                    detailInit: subscriptionDetailInit,
                    detailExpand: function (e) {
                        //ONLY ALLOW SINGLE EXPANDED SUBSCRIPTION AT A TIME
                        this.collapseRow(this.tbody.find(' > tr.k-master-row').not(e.masterRow));
                    }
                }).data('kendoGrid');

                //CALL LOAD FUNCTION AND PASS SCOPE IF APPLICABLE
                if (fnLoad) fnLoad.call(me);
            }
        });
    },

    loadPassword: function () {
        var me = this;

        //LOAD CONTENT AND HANDLE SUBMIT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/ChangePassword',
            fnLoad: function (content, tooltip) {
                //RESIZE AND REPOSITION SMALLER TOOLTIP
                tooltip.elements.tooltip.addClass('ui-tooltip-profile-small');
                tooltip.reposition();

                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();
                    me.loadProfile();
                });
            },
            fnSubmitSuccess: function () {
                //DISPLAY CHANGE PASSWORD SUCCESS PAGE
                me.loadPasswordSuccess();
            }
        });
    },

    loadPasswordSuccess: function () {
        var me = this;

        //LOAD CONTENT
        MyAvail.Tooltip.loadContent({
            tooltip: this.profileTooltip,
            url: '~/Account/ChangePasswordSuccess',
            fnLoad: function (content) {
                //HANDLE LOGIN BUTTON
                $('.profile', content).click(function (e) {
                    e.preventDefault();
                    me.loadProfile();
                });
            }
        });
    },

    logout: function (fnLoad) {
        var me = this;

        if (MyAvail.transitAuthorityConfig.EnableSsl) {
            window.location.href = MyAvail.resolveUrl('~/Account/LogOff?redirect=true');
        } else {
            //ACTIVATE LOADING PANEL
            MyAvail.Desktop.initLoading();

            //LOGOUT ON SERVER
            $.post(MyAvail.resolveUrl('~/Account/LogOff'), function (data) {
                //REFRESH LOGIN STATUS
                me.loadStatus(function () {
                    //LOAD LOGIN PAGE IN TOOLTIP
                    me.loadLogin();
                });

                //TOGGLE AUTHENTICATED VIEWS
                me.toggleViews(false);

                //CLEAR PROFILE DATA
                me.userProfile = null;

                //DEACTIVATE LOADING PANEL
                MyAvail.Desktop.exitLoading();

                //CALL LOAD FUNCTION AND PASS SCOPE IF APPLICABLE
                if (fnLoad) fnLoad.call(me);
            });
        }
    },

    deleteAccount: function () {
        MyAvail.Desktop.openModalConfirmation(
            'Are you sure you would like<br />to delete your account?<br />This can not be undone.',
            function (callbackdata) {
                //HIDE PROFILE TOOLTIP
                callbackdata.profileTooltip.hide();

                //LOGOUT ON SERVER
                $.post(MyAvail.resolveUrl('~/Account/Delete'), function (data) {
                    //DETERMINE IF ERROR
                    if (data.errors && data.errors.length > 0) {
                        MyAvail.Desktop.notifyError(data.errors.join('<br />'));
                    } else {
                        //REFRESH AS ANONYMOUS USER IF DELETED
                        callbackdata.logout(function () {
                            //UPDATE USER WITH STATUS
                            MyAvail.Desktop.notifySuccess('Account deleted successfully.');
                        });
                    }
                });
            }, this);
    },

    toggleViews: function (authenticated) {
        //DISPLAY LOGGED IN AREA IF APPLICABLE
        MyAvail.Alert.toggleViews(authenticated);
        MyAvail.Message.toggleViews(authenticated);
    },

    isDirty: function (dirty) {
        var indicator = $('#status_wrapper .authenticated .unsaved');

        if (MyAvail.isDefined(dirty)) {
            if (dirty) indicator.show();
            else indicator.hide();
        } else {
            return indicator.is(':visible');
        }
    }
}

//INITIALIZE
$(function () {
    MyAvail.Account.init();
});