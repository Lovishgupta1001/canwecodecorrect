/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

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
