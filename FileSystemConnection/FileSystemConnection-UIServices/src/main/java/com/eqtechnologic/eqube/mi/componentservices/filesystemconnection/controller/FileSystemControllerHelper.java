/** 
 * @(#)eQubeMI version 5.3 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.controller; 

import com.eqtechnologic.eqube.mi.component.service.ComponentService; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.service.FileSystemConnectionService; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 

import java.util.Map; 

public class FileSystemControllerHelper { 
    private static FileSystemControllerHelper controllerHelper; 

    public static FileSystemControllerHelper getInstance() { 
        if (controllerHelper == null) { 
            controllerHelper = new FileSystemControllerHelper(); 
        } 
        return controllerHelper; 
    } 

    public FileSystemConnectionService getFileSystemConnectionService() { 
        return ServiceRegistry.getInstance().getService(FileSystemConstants.FILE_SYSTEM_CONNECTION_SERVICE); 
    } 
}
