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

package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.service; 

import com.eqtechnologic.eqube.mi.component.service.ComponentService; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.ConnectionValidationResult; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import java.util.List; 
import java.util.Map; 

public interface FileSystemConnectionService 
        extends ComponentService<FileSystemConnCompInitialInput, Map, Object> { 

    /** 
     * Validate a connection using plugin definitions. 
     * 
     * @param connId            ID of the connection to validate 
     * @param pluginDefinitions List of plugin definitions containing name, classes, and schemes 
     * @return true if the connection is valid according to plugin rules; false otherwise 
     */ 
    ConnectionValidationResult validateConnection(Long connId, List<FileSystemPluginDefination> pluginDefinitions); 
    ConnectionValidationResult validateConnection(Long connId, Long otherConnectionId, List<FileSystemPluginDefination> pluginDefinitions); 
    Map<Long, String> getFilePathForConnections(List<Long> connectionIds) throws BusinessException; 
    boolean validateConnectionOfSamePluginType(String pluginClassName, Long destConnId) throws BusinessException; 
}
