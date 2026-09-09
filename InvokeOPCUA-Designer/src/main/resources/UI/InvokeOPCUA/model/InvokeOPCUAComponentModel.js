/**
 * Created by Lovish.
 */
define(function (require) {

    var ModelStore = require("ModelStore");

    ModelStore.InvokeOPCUAComponentModel = eQUI.Model.extend({
        defaults: {},

        onInitialize: function (options) {
            this.set("connectionComboBox", "");
            this.set("connectionName", "");
            this.set("connectionId", "");
            this.set("connectionType", "");
            this.set("selectConnection", "");
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

    return ModelStore.InvokeOPCUAComponentModel;
});
