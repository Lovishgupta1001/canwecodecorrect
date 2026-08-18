define(function (require) {
    "use strict";

    let ModelStore = require("ModelStore");

    ModelStore.FileZipModel = eQUI.Model.extend({
        defaults: {
            preserveFolder: true,
            preserveParentFolder: true,
            deleteInputFiles: false,
            archiveName: "",
            archiveType: ""
        },

        getKey: function (key) {
            return this.get(key);
        },

        setKey: function (key, value) {
            return this.set(key, value);
        }
    });

    return ModelStore.FileZipModel;
});
