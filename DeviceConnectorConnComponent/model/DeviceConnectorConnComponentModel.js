/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

    var Backbone = require("backbone");

    var DeviceConnectorConnModel = Backbone.Model.extend({
        defaults: {
            connectionComboBox: "",
            connectionName: "",
            connectionId: "",
            connectionType: "",
            selectConnection: ""
        }
    });

    return DeviceConnectorConnModel;
});
