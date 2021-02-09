MyAvail.Trip = {

    form: null,

    init: function () {
        //INITIALIZE VARIABLES
        this.form = $('#trip_planner_form');
        var plannerWrapper = $('#trip_planner_wrapper');
        var plannerSubmit = $('input.plan-trip', plannerWrapper);
        var plannerFromInput = $('input#planner_from', plannerWrapper);
        var plannerToInput = $('input#planner_to', plannerWrapper);
        var plannerWhenType = $('select#planner_when_type', plannerWrapper);
        var plannerWhenTime = $('input#planner_when_time', plannerWrapper);
        var plannerWhenDate = $('input#planner_when_date', plannerWrapper);
        var plannerShow = $('select#planner_show', plannerWrapper);
        var plannerTravel = $('select#planner_travel', plannerWrapper);

        //ENABLE PLACEHOLDERS
        plannerFromInput.placeholder();
        plannerToInput.placeholder();

        //DETERMINE WIDTHS BASED ON RESOLUTION
        if (navigator.platform.indexOf('Win') != -1 && $(window).height() < 600) {
            $('.planner-when .bi .col:first-child', plannerWrapper).width(
                $('.planner-when .bi .col:first-child', plannerWrapper).width() - 3);

            $('.planner-when .bi .col:last-child', plannerWrapper).width(
                $('.planner-when .bi .col:last-child', plannerWrapper).width() - 10);
        }

        //CONVERT INPUTS TO KENDO INPUTS
        plannerWhenType.width('100%').kendoComboBox();
        plannerShow.width('100%').kendoComboBox();
        plannerTravel.width('100%').kendoComboBox();
        plannerWhenTime.width('100%').kendoTimePicker();
        plannerWhenDate.width('100%').kendoDatePicker();

        //SPECIFY THE SUBMIT HANDLER AFTER VALIDATION
        this.form.validate().settings.submitHandler = function (form) {
            //REPLACE INPUT WITH GEOCODED ADDRESSES FOR FROM ADDRESS
            MyAvail.Map.getGeocodedAddress(plannerFromInput.val(), function (data) {
                //UPDATE TEXT BOX WITH CLEANED ADDRESS IF APPLICABLE
                if (data) plannerFromInput.val(data);

                //REPLACE INPUT WITH GEOCODED ADDRESSES FOR TO ADDRESS
                MyAvail.Map.getGeocodedAddress(plannerToInput.val(), function (data) {
                    //UPDATE TEXT BOX WITH CLEANED ADDRESS IF APPLICABLE
                    if (data) plannerToInput.val(data);

                    //SUBMIT FORM TO GOOGLE TRANSIT
                    var transitUrl = MyAvail.Map.openTransit($(form).serialize());

                    //NOTIFY USER OF CONSTRUCTED LINK
                    MyAvail.Desktop.openModalDialog('Google Transit details in new window, or ' +
                        '<a href="' + transitUrl + '" target="_blank">click here</a> to open the link manually.');
                });
            });
        };
    },

    updateDefaults: function () {
        var plannerWrapper = $('#trip_planner_wrapper');
        var plannerWhenTime = $('input#planner_when_time', plannerWrapper);
        var plannerWhenDate = $('input#planner_when_date', plannerWrapper);

        //SET CURRENT TIMES 30 MINUTES FROM NOW BY DEFAULT
        plannerWhenTime.data('kendoTimePicker').value(moment().add('h', 1).minutes(0).format('h:mm a'));
        plannerWhenDate.data('kendoDatePicker').value(new Date());
    }
};

//INITIALIZE
$(function () {
    if (MyAvail.transitAuthorityConfig.EnableTripPlanning) {
        MyAvail.Trip.init();
    }
});

