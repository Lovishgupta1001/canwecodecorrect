/** 
 * Created by Mishail 
 */ 
define(function (require) { 
    let FileSystemConnModel = Backbone.Model.extend({ 
        defaults: { 
            connectionComboBox: "", 
            relativefilepath: "" 
        } 
    }); 
    return FileSystemConnModel; 
}); 
