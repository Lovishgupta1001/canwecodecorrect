define(function () {
    "use strict";

    var CONSTANTS = {
        IDS: {
            ARCHIVE_NAME: "archiveName",
            ARCHIVE_TYPE: "archiveType"
        },

        ARCHIVE_TYPE_FIELDS: {
            "ZIP": "zip"
        },

        TAB_NAME: "CONFIGURATION",
        SUBSCRIBER_ID: "FZ_SUBSCRIBER_ID",

        EVENTS: {
            GET_SELECTED_CONNECTION: "GET_SELECTED_CONNECTION",
            CHANGE_CONNECTION_VARIABLE: "CHANGE_CONNECTION_VARIABLE",
            REFRESH_CONNECTION: "REFRESH_CONNECTION",
            BOTTOM_PANE_RESIZED: "BOTTOM_PANE_RESIZED",
            GET_RELATIVE_PATH: "GET_RELATIVE_PATH",
            GET_FILE_NAME_PATTERN: "GET_FILE_NAME_PATTERN",
            INITIAL_CONNECTION_FETCH: "INITIAL_CONNECTION_FETCH",
            INVALID_CONNECTION_SELECTED: "INVALID_CONNECTION_SELECTED"
        },

        ERRORPATHS: {
            selectSourceConnection: "connectionComboBox_wrapper",
            selectDestConnection: "connectionComboBox_wrapper",
            relativePathSourceEbl: "relativefilepath",
            fileNamePattern: "filepattern",
            relativePathDestEbl: "relativefilepath",
            archiveName: "archiveName"
        },

        TAB_ID: {
            SOURCE: 0,
            DESTINATION: 1
        },

        COMPONENTS: {
            SOURCE_FILE_CONNECTION: "fileConnSourceTabComp",
            DESTINATION_FILE_CONNECTION: "fileConnDestTabComp",
            ACTIVITY: "ACTIVITY",
            SOURCE_FILE_CONFIG: "fileSelectionComponent"
        },

        EXP_VALIDATE_ADDSTRING: {
            relativePathSourceEbl: "SOURCE/SOURCE_FILE_CONNECTION/",
            fileNamePattern: "SOURCE/SOURCE_FILE_CONFIG/",
            relativePathDestEbl: "DESTINATION/DESTINATION_FILE_CONNECTION/"
        }
    };

    return Object.freeze(CONSTANTS);
});
