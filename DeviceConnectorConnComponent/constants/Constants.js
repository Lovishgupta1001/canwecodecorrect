/**
* Created by Lovish.
*/
define(function () {
    "use strict";

    let CONSTANTS = {
        fields: {
            connectionComboBox: "connectionComboBox"
        },
        EVENTS: {
            REFRESH_CONNECTION: "REFRESH_CONNECTION",
            CHANGE_CONNECTION_VARIABLE: "CHANGE_CONNECTION_VARIABLE",
            INITIAL_CONNECTION_FETCH: "INITIAL_CONNECTION_FETCH",
            INVALID_CONNECTION_SELECTED: "INVALID_CONNECTION_SELECTED"
        },
        NO_CONN_ID: "NO_CONN_ID",
        DEFAULT_ALLOWED_TYPES: ["OPCUA", "MQTT", "OPC UA"]
    };

    return Object.freeze(CONSTANTS);
});
