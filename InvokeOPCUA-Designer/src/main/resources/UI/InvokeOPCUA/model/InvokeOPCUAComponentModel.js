/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ModelStore = require("ModelStore");

    ModelStore.InvokeOPCUAComponentModel = eQUI.Model.extend({
        defaults: {
            operation: "DataChangeWrite",
            executionMode: "Parallel",
            dataChangeWrite: [],
            callMethod: []
        },

        getKey: function (key) {
            return this.get(key);
        },

        setKey: function (key, value) {
            return this.set(key, value);
        }
    });

    return ModelStore.InvokeOPCUAComponentModel;
});
