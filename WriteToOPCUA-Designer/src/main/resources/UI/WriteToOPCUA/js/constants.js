/**
 * Created by Lovish.
 */
define(function () {

    var CONSTANTS = {
        TRANSPORT_NAME: "transportName",
        TRANSPORT_ID: "transportId",

        DATA_CHANGE_WRITE: "DataChangeWrite",
        CALL_METHOD: "CallMethod",

        PARALLEL: "Parallel",
        SEQUENTIAL: "Sequential",

        TRANSPORTS_URL: "/AdminConsole#transports",
        CREATE_TRANSPORT_URL: "/AdminConsole#transports/create",
        EDIT_TRANSPORT_URL: "/AdminConsole#transports/edit/"
    };

    return Object.freeze(CONSTANTS);
});
