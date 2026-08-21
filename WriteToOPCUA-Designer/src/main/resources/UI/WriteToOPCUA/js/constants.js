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

        CREATE_TRANSPORT_URL: "/ADMINCONSOLE?servicePath=transports/create",
        EDIT_TRANSPORT_URL: "/ADMINCONSOLE?servicePath=transports/edit/"
    };

    return Object.freeze(CONSTANTS);
});
