MyAvail.Tooltip = {

    position: {
        bottomCenter: {
            my: 'top center',
            at: 'bottom center',
            viewport: $(window),
            effect: false
        },
        bottomRight: {
            my: 'top right',
            at: 'bottom left',
            viewport: $(window),
            effect: false
        },
        bottomLeft: {
            my: 'top left',
            at: 'bottom center',
            viewport: $(window),
            effect: false
        },
        rightBottom: {
            my: 'left top',
            at: 'bottom right',
            viewport: $(window),
            effect: false
        }
    },

    tipStyle: {
        topCenter: {
            width: 14,
            height: 12,
            offset: 8,
            mimic: 'top center'
        },
        bottomCenter: {
            width: 12,
            height: 8,
            offset: 8,
            mimic: 'bottom center'
        }
    },

    init: function () {
    },

    load: function (options) {
        //MERGE DEFAULTS AND PASSED IN OPTIONS
        var opts = $.extend({}, this.defaults, options);

        //VALIDATE INPUT
        if (opts.element) opts.selector = opts.element.selector;
        else opts.element = $(opts.selector);

        //INITIALIZE QTIP FOR ITEM
        return opts.element.qtip({
            id: opts.itemId,
            content: {
                text: opts.text || opts.loading,
                ajax: !opts.url ? false : {
                    type: opts.type,
                    contentType: opts.contentType,
                    url: MyAvail.resolveUrl(opts.url),
                    data: JSON.stringify(opts.data),
                    cache: false,
                    once: false,
                    success: function (data, status) {
                        var tooltip = this;
                        var contentElement = this.elements.content;

                        //SET THE CONTENT MANUALLY SINCE WE ARE OVERRIDING SUCCESS
                        tooltip.set('content.text', data);

                        //CALL PASSED IN FUNCTIONS IF APPLICABLE
                        if (opts.preLoad) opts.preLoad(tooltip, contentElement);
                        if (opts.fnLoad) opts.fnLoad(tooltip, contentElement);

                        // HANDLE DYNAMICALLY LOADED FORMS IF APPLICABLE
                        var form = $('form', contentElement);
                        if (form && form.length) {
                            //REPARSE DYNAMICALLY LOADED FORM IF APPLICABLE
                            if (opts.parseForm)
                                MyAvail.Form.parseValidation(form, opts.fnSubmit);

                            // APPLY PLACEHOLDER FOR OLD BROWSERS
                            $('input[placeholder]', form).placeholder();
                        }

                        //REPOSITION TOOLTIP AFTER GRID RENDER IF APPLICABLE
                        if (opts.reposition) this.reposition();

                        //CALL ANY POST FUNCTIONS IF APPLICABLE
                        if (opts.postLoad) opts.postLoad(tooltip, contentElement);
                    }
                }
            },
            position: opts.position,
            overwrite: false,
            show: opts.show,
            hide: opts.hide,
            events: opts.events,
            style: {
                classes: opts.classes + ' ' + opts.cssClass,
                tip: opts.tipStyle
            }
        }).click(function (e) {
            e.preventDefault();
        }).data('qtip');
    },

    loadContent: function (options) {
        $.ajax({
            url: MyAvail.resolveUrl(options.url),
            data: JSON.stringify(options.data),
            type: options.ajaxType || 'GET',
            contentType: options.contentType || 'application/json',
            cache: options.cache || false,
            success: function (data) {
                //PROCESS TOOLTIP IF APPLICABLE
                if (options.tooltip) {
                    var tooltip = options.tooltip;
                    var content = tooltip.elements.content;

                    //UPDATE TOOLTIP CONTENT
                    tooltip.set('content.text', data);

                    //INITIALIZE TOOLTIP IF NEEDED
                    if (!content) {
                        //FORCE RENDER OF TOOLTIP CONTENT
                        tooltip.render();

                        //REFERENCE NEWLY GENERATED CONTENT
                        content = tooltip.elements.content;
                    }

                    //CALL REQUESTED FUNCTION IF APPLICABLE
                    if (options.fnLoad) options.fnLoad(content, tooltip);

                    if (options.parseForm || options.fnSubmitSuccess) {
                        //INITALIZE FORM
                        MyAvail.Form.initDynamic({
                            form: $('form', content),
                            fnSuccess: options.fnSubmitSuccess,
                            fnBeforeSubmit: options.fnBeforeSubmit,
                            showLoading: options.showLoading
                        });
                    }

                    // APPLY PLACEHOLDER FOR OLD BROWSERS
                    $('input[placeholder]', content).placeholder();
                }
            }
        });
    },

    validatorErrorPlacement: function (error, element) {
        // Set positioning based on the elements position in the form
        var elem = $(element),
			corners = ['left center', 'right center'],
			flipIt = elem.parents('span.right').length > 0;

        // Check we have a valid error message
        if (!error.is(':empty')) {
            // Apply the tooltip only if it isn't valid
            elem.filter(':not(.valid)').qtip({
                overwrite: false,
                content: error,
                position: {
                    my: corners[flipIt ? 0 : 1],
                    at: corners[flipIt ? 1 : 0],
                    viewport: $(window)
                },
                show: {
                    event: false,
                    ready: true
                },
                hide: false,
                style: {
                    classes: 'ui-tooltip-red ui-tooltip-error' // Make it red... the classic error colour!
                }
            }).qtip('option', 'content.text', error); // If we have a tooltip on this element already, just update its content
        }
        else {
            // If the error is empty, remove the qTip
            elem.qtip('destroy');
        }
    },

    validatorSuccess: function () {
        //ODD WORKAROUND FOR UPDATING ERROR PLACEMENT WITH QTIP
        return $.noop;
    },

    defaults: {
        selector: '<div />',
        itemId: null,
        loading: '<div class="loading-panel"></div>',
        text: null,
        cssClass: null,
        classes: '',
        show: {
            event: 'click',
            solo: true
        },
        hide: {
            event: 'unfocus'
        },
        type: 'POST',
        contentType: 'application/json',
        reposition: false,
        events: false,
        position: null,
        tipStyle: {
            width: 6,
            height: 6
        },
        fnLoad: null,
        preLoad: null,
        postLoad: null,
        fnSubmit: function (form) {
            //SUBMIT FORM VIA AJAX
            $(form).ajaxSubmit();
        },
        parseForm: true
    }
};

//INITIALIZE
$(function () {
    MyAvail.Tooltip.init();
});

