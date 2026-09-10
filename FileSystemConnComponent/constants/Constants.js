/** 
 * Created by Mishail 
 */ 
define(function(){ 
    "use strict"; 

    let CONSTANTS = { 
        fields:{ 
            connectionComboBox: "connectionComboBox", 
            baseFilePath: "baseFilePath", 
            relativefilepath: "relativefilepath" 
        }, 
        EVENTS: { 
            REFRESH_CONNECTION: "REFRESH_CONNECTION", 
            CHANGE_CONNECTION_VARIABLE: "CHANGE_CONNECTION_VARIABLE", 
            GET_RELATIVE_PATH: "GET_RELATIVE_PATH", 
            INITIAL_CONNECTION_FETCH: "INITIAL_CONNECTION_FETCH", 
            INVALID_CONNECTION_SELECTED: "INVALID_CONNECTION_SELECTED" 
        }, 
        activityName:{ 
            formattedFileWrite: "FormattedFileWrite" 
        }, 
        NO_CONN_ID: "NO_CONN_ID", 
        TAB_NAME: "CONFIGURATION", 
        PLUGIN_TYPE: { 
            pluginName: "TextFilePlugin", 
            pluginClasses: [ 
                "com.eqtechnologic.eqube.textfileplugin.TextFilePlugin", 
                "com.eqtechnologic.eqube.textfileplugin.TextFileHttpPlugin" 
            ] 
        }, 
    }; 

    return (Object.freeze(CONSTANTS)); 
}); 
