package com.eqtechnologic.eqube.mi.activities.filezip;

import com.eqtechnologic.eqube.mi.ui.activities.ActivitiesErrorCode;

/**
 * This class defines error codes for FileZip activity.
 *
 * @author Devang Desale
 */
public class FileZipErrorCodes {

    private FileZipErrorCodes() {
    }

    public static final ActivitiesErrorCode INVALID_CONNECTION_KEY = new ActivitiesErrorCode(900851, "Connection Key is either null or invalid.");
    public static final ActivitiesErrorCode INVALID_CONNECTION_TYPE = new ActivitiesErrorCode(900852, "Invalid connection type.");
    public static final ActivitiesErrorCode CONNECTION_CLOSED = new ActivitiesErrorCode(900853, "Connection is already closed.");
    public static final ActivitiesErrorCode FETCH_DATA = new ActivitiesErrorCode(900854, "Error occurred while getting Transaction Id from process context.");
    public static final ActivitiesErrorCode FILE_ZIP_OUTPUT = new ActivitiesErrorCode(900855, "Error occurred while getting file zip output.");
    public static final ActivitiesErrorCode INVALID_CONNECTION = new ActivitiesErrorCode(900856, "Connection is not present.");
    public static final ActivitiesErrorCode PATH_FETCH_ERROR_CODE = new ActivitiesErrorCode(900857, "Error occurred while fetching path for connection from context.");
    public static final ActivitiesErrorCode NO_PATH_IN_CONNECTION = new ActivitiesErrorCode(900858, "No path specified in Connection.");
    public static final ActivitiesErrorCode FILE_FETCH_EXCEPTION = new ActivitiesErrorCode(900859, "Error occurred while fetching files from source relative path.");
    public static final ActivitiesErrorCode FILE_FETCH_ERROR = new ActivitiesErrorCode(900860, "Error occurred while fetching files");
    public static final ActivitiesErrorCode ARCHIVE_EXISTS = new ActivitiesErrorCode(900861, "Error occurred while creating archive in destination.");
    public static final ActivitiesErrorCode FILE_ZIP_ARCHIVE_NAME = new ActivitiesErrorCode(900862, "Archive Name expression has resolved to undefined");
    public static final ActivitiesErrorCode ERROR_GET_PLUGIN_REGISTRATION_INFO = new ActivitiesErrorCode(900863, "Error occurred while fetching PluginRegistrationInformation from the registry");

    public static final String ERRCODE_FETCH_DATA = "fetchDataErr";
    public static final String ERRCODE_INVALID_CONNECTION_KEY = "invalidConnectionKeyErr";
    public static final String ERRCODE_FILE_ZIP_OUTPUT = "fileZipOutputErr";
    public static final String ERRCODE_CONNECTION_CLOSED = "connectionClosedErr";
    public static final String ERRCODE_INVALID_CONNECTION_TYPE = "invalidConnectionType";
    public static final String ERRCODE_INVALID_CONNECTION = "invalidConnection";
    public static final String PATH_FETCH_ERROR = "PathFetchError";
    public static final String ERRCODE_NO_PATH_IN_CONNECTION = "noPathInConnection";
    public static final String ERRCODE_FILE_FETCH_EXCEPTION = "fileZipFetchFileError";
    public static final String ERRCODE_ARCHIVE_EXISTS = "fileZipArchiveExistsError";
    public static final String ERRCODE_GET_PLUGIN_REGISTRATION_INFO = "getPluginRegistrationInformationError";
}
