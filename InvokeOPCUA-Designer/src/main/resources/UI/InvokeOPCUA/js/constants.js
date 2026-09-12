define(function () {
    "use strict";

    var CONSTANTS = {
        DATA_CHANGE_WRITE: "DataChangeWrite",
        CALL_METHOD: "CallMethod",
        PARALLEL: "Parallel",
        SEQUENTIAL: "Sequential",
        EVENTS: {
            CHANGE_CONNECTION_VARIABLE: "CHANGE_CONNECTION_VARIABLE",
            REFRESH_CONNECTION: "REFRESH_CONNECTION",
            INITIAL_CONNECTION_FETCH: "INITIAL_CONNECTION_FETCH",
            INVALID_CONNECTION_SELECTED: "INVALID_CONNECTION_SELECTED"
        }
    };

    return Object.freeze(CONSTANTS);
});
