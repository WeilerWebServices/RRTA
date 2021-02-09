MyAvail.Form = {
    isTooltipValidation: false,

    init: function () {

    },

    initTooltipValidation: function () {
        var me = this;

        //HANDLE FORMS
        $('form').each(function () {
            var form = $(this);

            //OVERRIDE VALIDATOR CONFIGURATIONS
            var validator = form.data('validator');
            if (validator) {
                //UPDATE ERROR PLACEMENT WITH QTIP
                validator.settings.errorPlacement = MyAvail.Tooltip.validatorErrorPlacement;
                validator.settings.success = MyAvail.Tooltip.validatorSuccess;
            }
        });

        //SPECIFY TOOLTIP VALIDATION USED FOR LATER USE
        this.isTooltipValidation = true;
    },

    initDynamic: function (options) {
        var me = this;

        //PARSE DYNAMICALLY LOADED FORM
        this.parseValidation(options.form, options.fnSubmit || function (validateForm) {
            //INITIALIZE LOADING PANEL
            if (!MyAvail.isDefined(options.showLoading)) options.showLoading = true;

            //ACTIVATE LOADING PANEL
            if (options.showLoading) {
                if (MyAvail.Desktop) MyAvail.Desktop.initLoading();
                else MyAvail.Mobile.initLoading();
            }

            //SUBMIT EXISTING FORM VIA AJAX
            $(validateForm).ajaxSubmit({
                success: function (response, status, formElm, formObj) {
                    //DETERMINE IF ERROR
                    if (response.errors && response.errors.length > 0) {
                        //CALL PASSED IN FAIL FUNCTION IF APPLICABLE
                        if (options.fnError) {
                            options.fnError(response, status, formElm, formObj);
                        }
                        else {
                            //DISPLAY ERRORS IN VALIDATION SUMMARY 
                            me.displayErrors(formObj, response.errors);
                        }
                    } else {
                        //CALL PASSED IN SUCCESS FUNCTION
                        if (options.fnSuccess)
                            options.fnSuccess(response, status, formElm, formObj);
                    }

                    //DEACTIVATE LOADING PANEL IF APPLICABLE
                    if (options.showLoading) {
                        if (MyAvail.Desktop) MyAvail.Desktop.exitLoading();
                        else MyAvail.Mobile.exitLoading();
                    }
                },
                beforeSubmit: options.fnBeforeSubmit
            });
        });

        //EXECUTE LOAD FUNCTION IF APPLICABLE
        if (options.fnLoad) options.fnLoad(options.form);
    },

    getErrorSummary: function ($form) {
        // We verify if we created it beforehand
        var errorSummary = $form.find('.validation-summary-errors, .validation-summary-valid');
        if (!errorSummary.length) {
            errorSummary = $('<div class="validation-summary-errors"><span>Please correct the errors and try again.</span><ul></ul></div>')
                .prependTo($form);
        }

        return errorSummary;
    },

    displayErrors: function (form, errors) {
        var errorSummary = this.getErrorSummary(form)
            .removeClass('validation-summary-valid')
            .addClass('validation-summary-errors');

        var items = $.map(errors, function (error) {
            return '<li>' + error + '</li>';
        }).join('');

        var ul = errorSummary.find('ul').empty().append(items);
    },

    parseValidation: function (form, fnSubmit) {
        // HAVE UNOBTRUSIVE REPARSE FORM VALIDATIONS
        $.validator.unobtrusive.parse(form);

        //RESET VALIDATIONS SINCE INITIALLY ACTIVATED FOR SOME REASON
        var validator = this.resetValidation(form);

        //UPDATE VALIDATOR SETTINGS IF APPLICABLE
        if (validator) {
            //ASSIGN SUBMIT HANDLER IF APPLICABLE
            if (fnSubmit) {
                //PREVENT CROSS DOMAIN AJAX SUBMISSIONS
                if (!MyAvail.isExternalUrl(form.attr('action')))
                    validator.settings.submitHandler = fnSubmit;
            }

            //REPLACE DEFAULT ERRORS WITH QTIP STYLE IF APPLICABLE
            if (this.isTooltipValidation) {
                validator.settings.errorPlacement = MyAvail.Tooltip.validatorErrorPlacement;
                validator.settings.success = MyAvail.Tooltip.validatorSuccess;
            }

            //RETURN VALIDATOR FOR FURTHER PROCESSING IF NEEDED
            return validator;
        }
    },

    resetValidation: function (form) {
        if (form && form.length) {
            //RESET VALIDATOR IF APPLICABLE
            var validator = form.validate();
            if (validator) {
                //RESET INVALID INPUTS
                var inputValidations = form.find('.input-validation-error')
                    .removeClass('input-validation-error');
                if (this.isTooltipValidation) inputValidations.qtip('destroy');

                //RESET UNOBTRUSIVE VALIDATION SUMMARY IF APPLICABLE
                form.find('[data-valmsg-summary=true]')
                    .removeClass('validation-summary-errors')
                    .addClass('validation-summary-valid')
                    .find('ul').empty();

                //REMOVE VALIDATION SUMMARY ERRORS
                form.find('.validation-summary-errors')
                    .removeClass('validation-summary-errors')
                    .addClass('validation-summary-valid');

                //RESET UNOBTRUSIVE FIELD LEVEL IF APPLICABLE
                form.find('[data-valmsg-replace]')
                    .removeClass('field-validation-error')
                    .addClass('field-validation-valid')
                    .empty();

                return validator;
            }
        }
    },

    resetForm: function (form) {
        var me = this;

        //RESET FIELDS OF FORMS
        form.each(function () {
            //RESET VALIDATIONS FIRST
            var validator = me.resetValidation($(this));
            if (validator) {
                //RESET JQUERY VALIDATE'S INTERNALS
                validator.resetForm();
            }

            //CLEAR INPUTS
            this.reset();

            //CLEAR SPECIAL CHECKBOXES AND RADIO BUTTONS FOR DESKTOP
            if (MyAvail.Desktop) {
                $('input[type=checkbox].ui-helper-hidden-accessible, input[type=radio].ui-helper-hidden-accessible', form)
                    .checkBox('changeCheckStatus', false);
            }
        });
    }
}

// INITIALIZE
$(function () {
    MyAvail.Form.init();
});
