MyAvail.Desktop = {

    panelBar: null,
    timeWrapper: null,

    init: function () {
        this.initOverrides();
        this.initErrorHandler();
        this.initPanelBar();
        this.initNav();
        this.initResize();
        this.initTimePolling();
    },

    initOverrides: function () {
        //DISABLE CACHING FOR IE SINCE IT OVERLY CACHES
        //WHICH IS NOT GOOD FOR REAL TIME APPLICATIONS
        if ($.browser.msie) $.ajaxSetup({ cache: false });

        //OVERRIDE DEFAULT PLACEHOLDER CSS
        $.fn.placeholder.defaults.placeholderCSS = {
            'font-size': '1.1 em',
            'color': '#e2e2e2',
            'position': 'absolute',
            'left': '5px',
            'top': '5px',
            'overflow': 'hidden',
            'display': 'block'
        };

        //OVERRIDE TOOLTIP CONFIGURATIONS
        MyAvail.Tooltip.defaults.classes = 'ui-tooltip-actions ui-tooltip-dark ui-tooltip-shadow ui-tooltip-rounded ui-tooltip-tipsy';
        MyAvail.Tooltip.defaults.position = MyAvail.Tooltip.position.bottomLeft;
        MyAvail.Tooltip.defaults.tipStyle = {
            width: 14,
            height: 12
        };
        MyAvail.Tooltip.defaults.events = {
            hide: function (event, api) {
                var content = api.elements.content;

                //RESET VALIDATION ERRORS IF APPLICABLE
                MyAvail.Form.resetValidation(content.find('form'));

                //PREVENT DROP DOWN AND PICKERS FROM UNINTENTIONALLY HIDING TOOLTIP
                //http://craigsworks.com/projects/forums/thread-date-picker-causes-tooltip-to-hide
                if (api.get('hide.event') == 'unfocus') {
                    var origEvent = event.originalEvent;

                    //DO NOT HIDE IF CLICKED ON KENDO DROP DOWN AND PICKER INPUTS
                    if (origEvent && ($(origEvent.target).closest('.k-calendar, .k-list').length
                        || $(origEvent.target).closest('.blockUI').length)) {
                        event.preventDefault();
                    }
                }
            }
        };

        //INITIALIZE FORMS VALIDATION TOOLTIPS
        MyAvail.Form.initTooltipValidation();
    },

    initErrorHandler: function () {
        var me = this;

        //ATTACH TO WINDOW ERROR
        window.onerror = function (msg, url, line) {
            //NOTIFY THE USER
            me.notifyError('There was an error with your request: "'
                    + msg + '". Please try again or refresh the page.');

            //LOG TO SERVER
            MyAvail.logError(msg, url, line);

            //BUBBLE ERROR TO CONSOLE STILL
            return false;
        }
    },

    initPanelBar: function () {
        this.panelBar = $('#overview_panelbar').kendoPanelBar({
            expandMode: 'single',
            expand: this.onExpand,
            collapse: this.onCollapse
        }).data('kendoPanelBar');

        //DYNAMICALLY SET HEIGHT OF PANEL CONTENT
        this.resizePanelContent();

        //OPEN FIRST PANEL ON INITIALIZE
        this.expandPanelBar(0);
    },

    initNav: function () {
        var me = this;

        //FULL SCREEN HANDLER
        $('#nav .fullscreen-icon').click(function (e) {
            e.preventDefault();
            me.toggleFullScreen();
        });

        //CLEAR MAP HANDLER
        $('#nav .clear-icon').click(function (e) {
            e.preventDefault();

            //RELOAD PAGE TO DESKTOP START PAGE
            window.location.href = MyAvail.getHomePage();
        });

        //CREATE DROP DOWN FOR FEEDBACK
        var feedbackSelector = '#nav .feedback-icon';
        MyAvail.Tooltip.load({
            selector: feedbackSelector,
            itemId: 'feedback',
            url: '~/Home/Feedback',
            cssClass: 'ui-tooltip-actions-feedback',
            tipStyle: MyAvail.Tooltip.tipStyle.topCenter,
            fnSubmit: function (form) {
                //SUBMIT FORM
                $(form).ajaxSubmit();

                //HIDE TOOLTIP AFTER SUBMISSION
                $(feedbackSelector).qtip('hide');
            }
        });

        //CREATE DROP DOWN FOR LINKS
        MyAvail.Tooltip.load({
            selector: '#nav .links-icon',
            itemId: 'links',
            url: '~/Home/Links',
            cssClass: 'ui-tooltip-actions-links',
            tipStyle: MyAvail.Tooltip.tipStyle.topCenter,
            fnLoad: function (tooltip, contentElement) {
                //SHOW 'LOADING' FOR QR CODE
                var loadingDiv = document.createElement('div');
                loadingDiv.setAttribute('class', 'loading-panel');
                loadingDiv.style.height = '32px';
                $("#qrcode_link").html(loadingDiv);

                //GENERATE URL LINK FROM CURRENT STATE
                var stateUrl = MyAvail.History.getCurrentStateUrl();
                $('input.page-link', contentElement).val(stateUrl);

                //GET SHORT URL AND QR CODE
                MyAvail.shortenUrl(stateUrl, function (data) {
                    if (data) {
                        //CLEAR LOADING CONTENT AND GENERATE QR CODE
                        $('#qrcode_link', contentElement).html('').qrcode({
                            text: data,
                            height: 128,
                            width: 128
                        });
                    } else {
                        //SHORTENED URL DID NOT WORK
                        $('#qrcode_link', contentElement).html('Error generating QR Code.');
                    }
                });

                //HIGHLIGHT URL LINK
                $('a.select-all', contentElement).click(function (e) {
                    e.preventDefault();
                    $('input.page-link', contentElement).select();
                });

                //BOOKMARK URL LINK
                $('a.deselect-all', contentElement).click(function (e) {
                    e.preventDefault();
                    me.bookmarkPage(document.title, stateUrl);
                });
            }
        });

        //CREATE DROP DOWN FOR LAYERS
        MyAvail.Tooltip.load({
            selector: '#nav .layers-icon',
            itemId: 'layers',
            url: '~/Home/Layers',
            cssClass: 'ui-tooltip-actions-layers',
            tipStyle: MyAvail.Tooltip.tipStyle.topCenter,
            fnLoad: function (tooltip, contentElement) {
                //STYLE CHECKBOXES
                $('input[type=checkbox], input[type=radio]', contentElement).checkBox();

                //RESTORE CURRENT FILTER ROUTES
                if (MyAvail.isDefined(MyAvail.Map.overlaysFilter.showRoutes)) {
                    $('#route_layer_toggle', contentElement)
                        .checkBox('changeCheckStatus', MyAvail.Map.overlaysFilter.showRoutes);
                }

                //RESTORE CURRENT FILTER STOPS
                if (MyAvail.isDefined(MyAvail.Map.overlaysFilter.showAllStops)) {
                    //DETERMINE WHICH RADIO TO SELECT
                    var stopsRadioElm = MyAvail.Map.overlaysFilter.showAllStops
                        ? '#stops_layer_all'
                        : '#stops_layer_time';

                    //SELECT THE RADIO BUTTON
                    $(stopsRadioElm, contentElement).checkBox('changeCheckStatus', true);
                }

                //RESTORE CURRENT FILTER BUSES
                if (MyAvail.isDefined(MyAvail.Map.overlaysFilter.showBuses)) {
                    $('#buses_layer_toggle', contentElement)
                        .checkBox('changeCheckStatus', MyAvail.Map.overlaysFilter.showBuses);
                }

                //HANDLE LAYER FILTERING
                $('input[type=submit]', contentElement).click(function () {
                    //INITIALIZE FILTER INPUTS
                    var showRoutes = $('#route_layer_toggle', contentElement).is(':checked');
                    var showAllStops = $('#stops_layer_all', contentElement).is(':checked');
                    var showBuses = $('#buses_layer_toggle', contentElement).is(':checked');

                    //APPLY OVERLAYS FILTER ON MAP
                    MyAvail.Map.applyOverlaysFilter(showRoutes, showAllStops, showBuses);

                    //HIDE LAYER POPUP AFTER FILTER SUBMISSION
                    tooltip.hide();
                });
            }
        });
    },

    initResize: function () {
        //HANDLE CONTAINERS ON BROWSER RESIZE
        $(window).smartresize(function () {
            MyAvail.Desktop.resizePanelContent();
            MyAvail.Route.grid.resizeGrid();
            MyAvail.Stop.grid.resizeGrid();

            // This code was implemented pre 5.5.8.3.
            //NOTIFY OF POSSIBLE CAVEATS FOR RESIZING
            //MyAvail.Desktop.openModalDialog('Viewport has been resized. For better experience,'
            //              + ' refresh the page<br />to calculate new dimensions.');  

            // This code was an experiment for 5.5.8.3. This opened a confirmation box asking the user if they wanted
            // to switch to the mobil site if they went below certain width and height thresholds for the main Infopoint window.
            // Was decided to leave this code out and consider for future use.
            //if (window.innerWidth < 940 || window.innerHeight < 556) {
            //  MyAvail.Desktop.openModalConfirmation(
            //      'This window size or smaller would be better viewed from the mobile site.<br /><br />Would you like to switch to the mobile site?',
            //      function () {
            //          window.location.href = '/Infopoint/mobile/';
            //      });
            //  }

        });
    },

    initTimePolling: function () {
        var me = this;

        //CACHE REFERENCE TO TIME AREA
        this.timeWrapper = $('.server-time');

        //INITIALIZE TIME AREA
        MyAvail.getServerTime(this.updateTime);

        //POLL SERVER TIME
        (function poll() {
            setTimeout(function () {
                //GET TIME FROM SERVER
                MyAvail.getServerTime(me.updateTime, poll);
            }, 60000);
        })();
    },

    updateTime: function (time) {
        var formattedTime = moment(time).format('h:mm a');
        MyAvail.Desktop.timeWrapper.html(formattedTime);
    },

    isFullScreen: function () {
        return $('#wrap').hasClass('full');
    },

    isIframe: function () {
        return $('#wrap').hasClass('iframe');
    },

    initLoading: function (message, timeout) {
        //ACTIVATE LOADING PANEL
        //TODO: JQMODAL LIGHTER MORE GENERIC?
        $.blockUI({
            message: message || '<div class="loading-page"></div>',
            timeout: timeout || 30000,
            css: {
                backgroundColor: '#000',
                border: 'none',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                borderRadius: '10px',
                opacity: 0.7,
                padding: '20px',
                color: '#fff',
                fontSize: '42px;',
                fontFamily: '"Arial Black", Gadget, sans-serif',
                fontWeight: 'bold',
                minWidth: '150px',
                width: '10%',
                left: '45%'
            }
        });
    },

    exitLoading: function () {
        //DEACTIVATE LOADING PANEL
        $.unblockUI();
    },

    notifySuccess: function (message, title) {
        this.exitLoading();
        Notifier.success(message, title);
    },

    notifyInfo: function (message, title) {
        this.exitLoading();
        Notifier.info(message, title);
    },

    notifyWarning: function (message, title, icon, timeout) {
        this.exitLoading();
        Notifier.warning(message, title);
    },

    notifyError: function (message, title) {
        this.exitLoading();
        Notifier.error(message, title);
    },

    notify: function (message, title, icon, timeout) {
        this.exitLoading();
        Notifier.notify(message, title, icon, timeout);
    },

    toggleFullScreen: function (enableFullscreen) {
        //TOGGLE EFFECT IF NO PARAMETER
        if (!MyAvail.isDefined(enableFullscreen))
            enableFullscreen = !this.isFullScreen();

        //HANDLE FULL SCREEN
        if (enableFullscreen) {
            //ADJUST LAYOUT WITH CSS CLASS
            $('#wrap').addClass('full');

            //CONSTRUCT SELECTED ROUTES INFO
            var routesHtml = '';
            var routes = MyAvail.Route.getSelectedRoutes();
            for (i = 0; i < routes.length; i++) {
                var route = routes[i];
                routesHtml += '<div class="route-item">'
                    + '<div class="route-id-container">'
                    + '<div class="route-abbr" style="background-color: #' + route.Color + ';">'
                    + route.RouteAbbreviation + '</div></div>'
                    + route.LongName + '</div>';
            }

            //UPDATE HEADER WITH ROUTES INFO
            $('#full_screen_header').html('<div class="routes-info">Showing Route(s): ' + routesHtml + '</div>');

            //UPDATE BUTTON LABEL
            $('#nav .fullscreen-icon').text('Exit Full Screen');
        } else {
            //ADJUST LAYOUT WITH CSS CLASS
            $('#wrap').removeClass('full');

            //UPDATE BUTTON LABEL
            $('#nav .fullscreen-icon').text('Full Screen');
        }

        //RECENTER MAP ON SELECTED OVERLAYS
        MyAvail.Map.applyAutoFit();
    },

    toggleIframe: function (enableIframe) {
        //TOGGLE EFFECT IF NO PARAMETER
        if (!MyAvail.isDefined(enableIframe))
            enableIframe = !this.isIframe();

        //HANDLE IFRAME
        if (enableIframe) $('#wrap').addClass('iframe');
        else $('#wrap').removeClass('iframe');

        //HANDLE RESIZE
        MyAvail.Desktop.resizePanelContent();
        MyAvail.Route.grid.resizeGrid();
        MyAvail.Stop.grid.resizeGrid();
    },

    openModalWindow: function (content, title, width, height, draggable, resizable) {
        var win = $('#window').kendoWindow({
            actions: ['Close'],
            content: content,
            title: title,
            iframe: MyAvail.isExternalUrl(content),
            modal: true,
            draggable: draggable || false,
            resizable: resizable || false,
            width: width || '80%',
            height: height || '80%'
        }).data('kendoWindow');

        win.center();
        win.open();

        // TODO: add in exitLoading()?
        // Close any qtip dialogs
        $('.qtip.ui-tooltip').qtip('hide');
    },

    openNewWindow: function (url, title, width, height) {
        var options =
            'width=' + (width || 500) +
            ',height=' + (height || 500);
        return window.open(url, title, options);
    },

    openModalDialog: function (message, timeout, fnUnblock) {
        //ADD CLOSE BUTTON IF NO TIMEOUT
        if (!timeout) {
            message += '<div class="dialog-close"><input type="button" value="Ok" /></div>';
        }

        $.blockUI({
            message: message,
            timeout: timeout || 30000,
            css: {
                border: 'none',
                padding: '15px',
                backgroundColor: '#000',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                opacity: .75,
                color: '#fff',
                'font-size': '17px',
                'font-weight': 'bold',
                'line-height': '24px'
            },
            onBlock: function () {
                if (!timeout) {
                    //HANDLE CLOSE CLICK
                    $('.dialog-close input[type=button]').click(function (e) {
                        e.preventDefault();
                        $.unblockUI({
                            onUnblock: fnUnblock
                        });
                    });
                }
            }
        });
    },

    openModalConfirmation: function (message, fnUnblock, data) {
        message += '<div class="dialog-close">'
            + '<input type="button" value="Yes" class="yes" /> '
            + '<input type="button" value="No" class="no" /></div>';

        $.blockUI({
            message: message,
            css: {
                border: 'none',
                padding: '15px',
                backgroundColor: '#000',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                opacity: .75,
                color: '#fff',
                'font-size': '17px',
                'font-weight': 'bold',
                'line-height': '24px'
            },
            onBlock: function () {
                //HANDLE YES CLICK
                $('.dialog-close input[type=button].yes').click(function (e) {
                    e.preventDefault();
                    $.unblockUI({
                        onUnblock: fnUnblock(data)
                    });
                });

                //HANDLE NO CLICK
                $('.dialog-close input[type=button].no').click(function (e) {
                    e.preventDefault();
                    $.unblockUI();
                });
            }
        });
    },

    getActiveFromPanelBar: function (id) {
        return this.panelBar.element.children('li.k-state-active');
    },

    expandPanelBar: function (id) {
        var item = this.panelBar.element.children('li.k-item')[id];
        this.panelBar.expand(item);
    },

    onExpand: function (e) {
        var item = $(e.item);

        //DETERMINE ACTION FOR EXPANDED PANEL
        if (item.children('#stops_grid_wrapper').length > 0) {
            //HANDLE STOPS VIEW
            MyAvail.Stop.updatePanel();
        }

        if (item.children('#trip_planner_wrapper').length > 0) {
            //HANDLE TRIP VIEW
            MyAvail.Trip.updateDefaults();
        }

    },

    onCollapse: function (e) {
        var item = $(e.item);

        //DETERMINE ACTION FOR COLLAPSED PANEL
        if (item.children('#trip_planner_wrapper').length > 0) {
            //HANDLE TRIP PLANNER EXIT
            MyAvail.Form.resetValidation(MyAvail.Trip.form);
        }

        if (item.children('#set_alert_wrapper').length > 0) {
            //HANDLE ALERT EXIT
            MyAvail.Form.resetValidation(MyAvail.Alert.form);
        }

    },

    resizePanelContent: function () {
        //DYNAMICALLY SET HEIGHT OF PANEL CONTENT
        this.panelBar.element.children().children('.k-content').height(this.calculatePanelContentHeight());
    },

    calculatePanelContentHeight: function () {
        //GET HEIGHT OF ALL CONTAINERS OUTSIDE
        var miscContainerHeights = 310;

        // Remove space for Trip Planning if not enabled
        if (!MyAvail.transitAuthorityConfig.EnableTripPlanning) {
            miscContainerHeights -= 31;
        }

        //MAKE ADJUSTMENTS IF APPLICABLE
        if (this.isIframe()) miscContainerHeights -= 100;
        //else if ($.browser.msie) miscContainerHeights += 108;

        //SUBTRACT HEADER, FOOTER, HEADINGS, ETC
        return $(document).height() - miscContainerHeights;
    },

    bookmarkPage: function (title, url) {
        //DETERMINE TITLE AND URL
        title = title || document.title;
        url = url || window.location;

        //BOOKMARK PAGE BASED ON BROWSER
        if ($.browser.mozilla) window.sidebar.addPanel(title, url, "");
        else if ($.browser.msie) window.external.AddFavorite(url, title);
        else if (window.opera && window.print) {
            var elem = document.createElement('a');
            elem.setAttribute('href', url);
            elem.setAttribute('title', title);
            elem.setAttribute('rel', 'sidebar');
            elem.click();
        }
        else {
            alert('Unfortunately, this browser does not support the requested action,'
             + ' please bookmark this page manually.');
        }
    }
};

//INITIALIZE
$(function () {

	(function($,sr){

	// debouncing function from John Hann
	// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
	var debounce = function (func, threshold, execAsap) {
		var timeout;

      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          };

          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 500);
      };
  }
  // smartresize 
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };})(jQuery,'smartresize');


    MyAvail.Desktop.init(); 
});

