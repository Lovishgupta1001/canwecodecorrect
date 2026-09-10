/**
Copyright (c) eQ Technologic (India) Pvt. Ltd.
All Rights Reserved.
This software is the confidential and proprietary information of eQTechnologic
("Confidential Information"). You shall not
disclose such Confidential Information and shall use it only in
accordance with the terms of the license agreement you entered into.
*/
package com.eqtechnologic.eqube.mi.activities.filezip.helper;

import com.eqtechnologic.eqube.connectionmanagement.api.ConnectionManager;
import com.eqtechnologic.eqube.eQPooledConnection;
import com.eqtechnologic.eqube.eqjdbc.EQConnection;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.helperinterface.apis.util.beans.PluginErrorBean;
import com.eqtechnologic.eqube.helperinterface.apis.util.beans.PluginSuccessBean;
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.filesystempluginhelper.client.FileSystemHelperProvider;
import com.eqtechnologic.eqube.filesystempluginhelper.client.FileSystemPluginHelperService;
import com.eqtechnologic.eqube.filesystempluginhelper.client.utility.FileSystemPluginHelperServiceConstants;
import com.eqtechnologic.eqube.mi.activities.filezip.FileZipConstants;
import com.eqtechnologic.eqube.mi.activities.filezip.FileZipErrorCodes;
import com.eqtechnologic.eqube.mi.activities.filezip.exception.FileZipExceptionType;
import com.eqtechnologic.eqube.mi.component.service.ComponentService;
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemConnCompInitialInput;
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants;
import com.eqtechnologic.eqube.mi.processhintgeneration.beans.eQIMetaDataDetails;
import com.eqtechnologic.eqube.mi.processhintgeneration.beans.eQListDetails;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import static com.eqtechnologic.eqube.mi.activities.filezip.FileZipConstants.FILE_ZIP_SERVICE;

/**
This is helper class for file zip activity.
@author Pallav Poddar
*/
public class FileZipActivityHelper {
    private static final Logger LOGGER;
    private static FileZipActivityHelper instance;

    static {
        LOGGER = Logger.getLogger(FileZipActivityHelper.class.getName());
    }

    public static FileZipActivityHelper getInstance() {
        if (instance == null) {
            instance = new FileZipActivityHelper();
        }
        return instance;
    }

    private FileZipActivityHelper(){
        //private constructor
    }

    public ComponentService<FileSystemConnCompInitialInput, Map, Object> getFileSystemConnService() {
        return ServiceRegistry.getInstance().getService(FileSystemConstants.FILE_SYSTEM_CONNECTION_SERVICE);
    }

    public List<String> getFileSelectionColumnList() {
        return getFilterAttributes();
    }

    public List<FileSystemPluginDefination> getSupportedPluginType (){
        return FileZipPluginRegistry.PLUGIN_TYPES;
    }

    /**
     * fetches filter attributes from file helper
     **/
    public List<String> getFilterAttributes() {
        ArrayList<String> filterColumnList = new ArrayList<>();
        try {
            FileSystemHelperProvider service = ServiceRegistry.getInstance().getService(FileSystemPluginHelperServiceConstants.FILESYSTEM_PLUGIN_HELPER_SERVICE_NAME);
            FileSystemPluginHelperService helperService = service.getFileSystemPluginHelperService();
            Map<String,Object> attributeDatatypeMap = helperService.getCommonFilterableAttributes();
            filterColumnList.addAll(attributeDatatypeMap.keySet());
        } catch (BusinessException e) {
            LogTemplate logTemplate = LogTemplate.of("[File Zip: BusinessException occurred while getting file helper.]")
                .impact("No filter attribute is found")
                .resolution("Make sure configured connection is up.");
            LOGGER.error(logTemplate, e);
        }
        return filterColumnList;
    }

    public String getFileNamesPattern(List<String> files) throws BusinessException {
        String filePattern = null;
        if (files.isEmpty()) {
            throw new BusinessException(FileZipExceptionType.FILE_FETCH_EXCEPTION, FileZipErrorCodes.FILE_FETCH_ERROR, "Please select at least one sample file.");
        } else {
            FileSystemHelperProvider service = ServiceRegistry.getInstance().getService(FileSystemPluginHelperServiceConstants.FILESYSTEM_PLUGIN_HELPER_SERVICE_NAME);
            FileSystemPluginHelperService helperService = service.getFileSystemPluginHelperService();
            filePattern = helperService.predictPatternFromFilePaths(files);
            if (filePattern != null) {
                filePattern = "\"" + filePattern + "\"";
            } else {
                filePattern = "";
            }
        }
        return filePattern;
    }

    public eQIMetaDataDetails getOutPutDetails(String id) {
        eQIMetaDataDetails details = null;
        if (id.equals(FileZipConstants.ZIPPED_FILES))
            details = new eQListDetails(new ArrayList<PluginSuccessBean>());
        else if (id.equals(FileZipConstants.FAILED_FILES))
            details = new eQListDetails(new ArrayList<PluginErrorBean>());
        return details;
    }
}
