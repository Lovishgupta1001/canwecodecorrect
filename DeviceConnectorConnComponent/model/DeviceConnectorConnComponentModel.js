/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

    var DeviceConnectorConnModel = Backbone.Model.extend({
        defaults: {
            connectionComboBox: ""
        }
    });

    return DeviceConnectorConnModel;
});
