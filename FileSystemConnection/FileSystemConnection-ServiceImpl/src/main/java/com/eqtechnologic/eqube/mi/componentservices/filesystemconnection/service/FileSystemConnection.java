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

import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler; 
import com.eqtechnologic.eqube.mi.component.service.ComponentExportEntity; 
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator; 
import com.eqtechnologic.eqube.mi.component.service.RemapInfo; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.ConnectionValidationResult; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.helper.FileSystemHelper; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.validator.FileSystemConnectionValidator; 
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported; 
import org.springframework.stereotype.Service; 

import java.util.Collections; 
import java.util.List; 
import java.util.Map; 

/** 
 * @author amitk 
 * Component service for file system connection 
 */ 
@Exported 
@Service(FileSystemConstants.FILE_SYSTEM_CONNECTION_SERVICE) 
public class FileSystemConnection implements FileSystemConnectionService, EntityReferenceHandler<Map> { 
    private static Logger logger; 

    static { 
        logger = Logger.getLogger(FileSystemConnection.class.getName()); 
    } 
    @Override 
    public FileSystemConnCompInitialInput getInitialInput() { 
        FileSystemConnCompInitialInput initialInputBean = new FileSystemConnCompInitialInput(); 
        try{ 
            List<Long> connectionIds = FileSystemHelper.getConnectionList(); 
            initialInputBean.setConnIds(connectionIds); 
            initialInputBean.setConnVsBaseFilePath(FileSystemHelper.getFilePathForConnections(connectionIds)); 
        } 
        catch(BusinessException e){ 
            LogTemplate logTemplate = LogTemplate.of("Error occurred creating input data bean for " + FileSystemConstants.FILE_SYSTEM_CONNECTION_SERVICE + "."); 
            logger.error(logTemplate, e); 
        } 
        return initialInputBean; 
    } 

    @Override 
    public ConnectionValidationResult validateConnection(Long connId, List<FileSystemPluginDefination> pluginDefinitions) { 
        return FileSystemHelper.validateConnection(connId, pluginDefinitions); 
    } 

    @Override 
    public ConnectionValidationResult validateConnection(Long connId,Long otherConnectionId, List<FileSystemPluginDefination> pluginDefinitions) { 
        return FileSystemHelper.validateConnection(connId,otherConnectionId, pluginDefinitions); 
    } 

    @Override 
    public Map<Long, String> getFilePathForConnections(List<Long> connectionIds) throws BusinessException{ 
        return FileSystemHelper.getFilePathForConnections(connectionIds); 
    } 

    @Override 
    public boolean validateConnectionOfSamePluginType(String pluginClassName, Long destConnId) throws BusinessException{ 
        return FileSystemHelper.validateConnectionOfSamePluginType( pluginClassName, destConnId); 
    } 

    @Override 
    public String getComponentType() { 
        return FileSystemConstants.FILE_SYSTEM_CONNECTION_SERVICE; 
    } 

    @Override 
    public ComponentValidator<Map, Object> getValidator() { 
        return new FileSystemConnectionValidator(); 
    } 

    @Override 
    public Class<Map> getComponentDataClass() { 
        return Map.class; 
    } 

    @Override 
    public void calculateConfigRemapInfo(Map configData, RemapInfo configRemapInfo) { 

    } 

    @Override 
    public List<? extends ComponentExportEntity> getLinkedResource(Map componentData) { 
        return Collections.emptyList(); 
    } 

    @Override 
    public void setConfigRemapInfo(Map configData, RemapInfo configRemapInfo) { 

    } 

    @Override 
    public void initialize() { 
        //Implementation not required 
    } 

    @Override 
    public void destroy() { 
        //Implementation not required 
    } 

    @Override 
    public boolean isRunning() { 
        return false; 
    } 

    @Override 
    public void suspend() { 
        //Implementation not required 
    } 

    @Override 
    public void resume() { 
        //Implementation not required 
    } 
}
