var MyAvail = {

    baseUrl: '/', //UPDATED FROM MASTER PAGE
    baseServiceUrl: '~/rest', //'http://availtids.falafel.com/infopoint/rest',
    transitAuthorityConfig: null, //POPULATED FROM MASTER PAGE
    fullyQualifiedApplicationPath: null, //POPULATED FROM MASTER PAGE

    init: function () {
    },

    resolveUrl: function (url) {
        if (url.indexOf('~/') == 0) {
            url = this.baseUrl + url.substring(2);
        }
        return url;
    },

    resolveRestUrl: function (restUrl) {
        return this.resolveUrl(this.baseServiceUrl + restUrl);
    },

    getHomePage: function () {
        return this.resolveUrl('~/');
    },

    getKmlFile: function (fileName) {
        return this.resolveUrl('~/' + this.transitAuthorityConfig.KmlUrl + fileName);
    },

    getRoutesRestUrl: function () {
        return this.resolveRestUrl('/Routes/GetVisibleRoutes');
    },

    getRouteDetailsByIDRestUrl: function (routeID) {
        return this.resolveRestUrl('/RouteDetails/Get/' + routeID);
    },

    getDirectionsByRouteIDRestUrl: function (routeID) {
        return this.resolveRestUrl('/RouteDetails/GetDirectionsByRouteID/' + routeID);
    },

    getStopsForRouteDirectionRestUrl: function (routeID, direction, isHeadway) {
        return this.resolveRestUrl('/RouteDetails/GetStopsForRouteDirection/?routeid='
            + routeID + '&direction=' + direction + '&timepointsOnly=' + (isHeadway || false));
    },

    getStopsRestUrl: function () {
        return this.resolveRestUrl('/Stops/GetAllStops');
    },

    getStopsByRoutesRestUrl: function (routeIDs) {
        var url = this.resolveRestUrl('/Stops/GetAllStopsForRoutes');

        //ADD PARAMETER IF VALUES EXIST
        if (routeIDs.length > 0) url += '?routeIDs=' + routeIDs.join(',');

        return url;
    },

    getStopsByRouteDirsRestUrl: function () {
        return this.resolveRestUrl('/Stops/GetAllStopsForRouteDirections');
    },

    getStopsBySearchRestUrl: function (query) {
        return this.resolveRestUrl('/Stops/Search?query=' + query);
    },

    getVehiclesByRoutesRestUrl: function (routeIDs) {
        var url = this.resolveRestUrl('/Vehicles/GetAllVehiclesForRoutes');

        //ADD PARAMETER IF VALUES EXIST
        if (routeIDs.length > 0) url += '?routeIDs=' + routeIDs.join(',');

        return url;
    },

    getPublicMessagesRestUrl: function () {
        return this.resolveRestUrl('/PublicMessages/GetCurrentMessages');
    },

    getPublicMessageHashCodeRestUrl: function () {
        return this.resolveRestUrl('/PublicMessages/GetCurrentMessagesHashCode');
    },

    getRoutes: function (fnLoad) {
        $.getJSON(this.getRoutesRestUrl(), fnLoad);
    },

    getRouteByID: function (routeID, fnLoad) {
        $.getJSON(this.resolveRestUrl('/Routes/Get/' + routeID), fnLoad);
    },

    getDirectionsByRouteID: function (routeID, fnLoad) {
        $.getJSON(this.getDirectionsByRouteIDRestUrl(routeID), fnLoad);
    },

    getStopsForRouteDirection: function (routeID, direction, isHeadway, fnLoad) {
        $.getJSON(this.getStopsForRouteDirectionRestUrl(routeID, direction, isHeadway), fnLoad);
    },

    getStops: function (fnLoad) {
        $.getJSON(this.getStopsRestUrl(), fnLoad);
    },

    getStopByID: function (stopID, fnLoad) {
        $.getJSON(this.resolveRestUrl('/Stops/Get/' + stopID), fnLoad);
    },

    getStopsByRouteID: function (routeID, fnLoad) {
        $.getJSON(this.resolveRestUrl('/RouteDetails/Get/' + routeID), fnLoad);
    },

    getStopsByRouteIDs: function (routeIDs, fnLoad) {
        $.getJSON(this.getStopsByRoutesRestUrl(routeIDs), fnLoad);
    },

    getStopsByRouteDirs: function (routeDirs, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: this.getStopsByRouteDirsRestUrl(),
            data: JSON.stringify({ routeDirs: routeDirs }),
            success: fnLoad
        });
    },

    getStopsBySearch: function (query, fnLoad) {
        $.getJSON(this.getStopsBySearchRestUrl(query), fnLoad);
    },

    getVehicleByID: function (vehicleID, fnLoad) {
        $.getJSON(this.resolveRestUrl('/Vehicles/Get/' + vehicleID), fnLoad);
    },

    getVehiclesByRouteID: function (routeID, fnLoad) {
        $.getJSON(this.resolveRestUrl('/Vehicles/GetAllVehiclesForRoute?routeID=' + routeID), fnLoad);
    },

    getVehiclesByRouteIDs: function (routeIDs, fnLoad) {
        $.getJSON(this.getVehiclesByRoutesRestUrl(routeIDs), fnLoad);
    },

    addRouteSubscription: function (routeID, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: this.resolveUrl('~/Subscriptions/AddRoute'),
            data: JSON.stringify({ routeId: routeID }),
            success: fnLoad
        });
    },

    deleteRouteSubscription: function (routeID, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: this.resolveUrl('~/Subscriptions/DeleteRoute'),
            data: JSON.stringify({ routeId: routeID }),
            success: fnLoad
        });
    },

    addOrUpdateStopSubscription: function (subscription, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: this.resolveUrl('~/Subscriptions/AddOrUpdateStop'),
            data: JSON.stringify({ subscription: subscription }),
            success: fnLoad
        });
    },

    addQuickSubscription: function (subscription, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: this.resolveUrl('~/Subscriptions/AddQuickAlert'),
            data: JSON.stringify({ subscription: subscription }),
            success: fnLoad
        });
    },

    deleteStopSubscription: function (subscription, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: this.resolveUrl('~/Subscriptions/DeleteStop'),
            data: JSON.stringify({ subscription: subscription }),
            success: fnLoad
        });
    },

    getUserProfile: function (fnLoad) {
        $.post(this.resolveUrl('~/Account/GetUserProfile'), fnLoad);
    },

    getServerTime: function (fnSuccess, fnComplete) {
        //GET TIME FROM SERVER
        $.ajax({
            type: 'GET',
            url: this.resolveUrl('~/Home/Time'),
            success: fnSuccess,
            complete: fnComplete
        });
    },

    logError: function (message, file, line, fnLoad) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            cache: false,
            url: this.resolveRestUrl('/Log/Create'),
            data: JSON.stringify({
                message: message,
                file: file,
                line: line,
                url: window.location.href,
                userAgent: navigator.userAgent
            }),
            success: fnLoad
        });
    },

    isExternalUrl: function (url) {
        var pattern = /^https?:\/\//i;
        return pattern.test(url);
    },

    getUrlParams: function (url) {
        return $.deparam.querystring(url);
    },

    setUrlParams: function (url, params) {
        return $.param.querystring(url, params);
    },

    getUrlHashParams: function () {
        return $.deparam.fragment();
    },

    isDefined: function (value) {
        return typeof value !== 'undefined' && value !== null;
    },

    isNullOrEmpty: function (value) {
        return !this.isDefined(value) || value == '';
    },

    getIntersect: function (arr1, arr2) {
        var intersect = [];

        for (i = 0; i < arr2.length; i++) {
            if ($.inArray(arr2[i], arr1) > -1)
                intersect.push(arr2[i]);
        }

        return intersect;
    },

    startsWith: function (source, value) {
        return source.slice(0, value.length) == value;
    },

    findByProperty: function (array, name, value) {
        for (i = 0; i < array.length; i++) {
            if (array[i][name] === value) return array[i];
        }
    },

    convertToBoolean: function (value) {
        //VALIDATE INPUT
        if (!this.isDefined(value)) return false;

        //DETERMINE BOOLEAN VALUE FROM STRING
        if (typeof value === 'string') {
            switch (value.toLowerCase()) {
                case 'true':
                case 'yes':
                case '1':
                    return true;
                case 'false':
                case 'no':
                case '0':
                    return false;
            }
        }

        //RETURN DEFAULT HANDLER
        return Boolean(value);
    },

    shortenUrl: function (url, fnSuccess, fnError) {
        var serviceUrl = 'https://api-ssl.bitly.com/v3/shorten';
        var login = MyAvail.transitAuthorityConfig.BitlyUsername;
        var apiKey = MyAvail.transitAuthorityConfig.BitlyApiKey;

        // HTTP only
        //REPLACE LOCALHOST SINCE SERVICE FAILS IF URL NOT REACHABLE
        var url = url.replace('https://', 'http://').replace('://localhost/', '://availtids.falafel.com/');

        //CALL SERVICE TO SHORTEN URL
        $.ajax({
            url: serviceUrl,
            data: {
                login: login,
                apiKey: apiKey,
                longUrl: url
            },
            dataType: 'jsonp',
            success: function (data) {
                fnSuccess(data.data.url);
            },
            error: fnError
        });
    }
};

//INITIALIZE
$(function () {
    MyAvail.init();
});