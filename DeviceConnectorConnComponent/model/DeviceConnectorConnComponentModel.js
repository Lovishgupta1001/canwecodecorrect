/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

    var BackboneRef = (window && window.Backbone) ? window.Backbone : require("backbone");

    var DeviceConnectorConnModel = BackboneRef.Model.extend({
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
