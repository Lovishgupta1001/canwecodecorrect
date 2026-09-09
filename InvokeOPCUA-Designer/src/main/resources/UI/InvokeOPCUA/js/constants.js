define(function () {
    "use strict";

    var CONSTANTS = {
        fields: {
            connectionComboBox: "connectionComboBox"
        },

        SELECT_CONNECTION: "selectConnection",
        CONNECTION_COMBOBOX: "connectionComboBox",
        CONNECTION_NAME: "connectionName",
        CONNECTION_ID: "connectionId",

        DATA_CHANGE_WRITE: "DataChangeWrite",
        CALL_METHOD: "CallMethod",

        PARALLEL: "Parallel",
        SEQUENTIAL: "Sequential",

        EVENTS: {
            GET_SELECTED_CONNECTION: "GET_SELECTED_CONNECTION",
            CHANGE_CONNECTION_VARIABLE: "CHANGE_CONNECTION_VARIABLE",
            REFRESH_CONNECTION: "REFRESH_CONNECTION",
            INITIAL_CONNECTION_FETCH: "INITIAL_CONNECTION_FETCH",
            INVALID_CONNECTION_SELECTED: "INVALID_CONNECTION_SELECTED"
        },

        ERRORPATHS: {
            selectConnection: "connectionComboBox_wrapper",
            connectionComboBox: "connectionComboBox_wrapper"
        },

        COMPONENTS: {
            CONNECTION: "connComp",
            ACTIVITY: "ACTIVITY"
        }
    };

    return Object.freeze(CONSTANTS);
});
