/**
 * Created by Lovish.
 */
define(function (require) {

    var ModelStore = require("ModelStore");

    ModelStore.WriteToOPCUAComponentModel = eQUI.Model.extend({
        defaults: {},

        onInitialize: function (options) {
            this.set("dynamicTransport", false);
            this.set("transportName", "");
            this.set("operation", "DataChangeWrite");
            this.set("executionMode", "Parallel");
            this.set("dataChangeWrite", []);
            this.set("callMethod", []);
        },

        getKey: function (key) {
            return this.get(key);
        },

        setKey: function (key, value) {
            return this.set(key, value);
        }
    });

    return ModelStore.WriteToOPCUAComponentModel;
});
