/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.service; 

import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler; 
import com.eqtechnologic.eqube.mi.component.service.ComponentExportEntity; 
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator; 
import com.eqtechnologic.eqube.mi.component.service.RemapInfo; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.helper.DeviceConnectorHelper; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.validator.DeviceConnectorConnectionValidator; 
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported; 
import org.springframework.stereotype.Service; 

import java.util.Collections; 
import java.util.List; 
import java.util.Map; 

/** 
 * Component service for Device Connector Connection 
 * 
 * Author: Lovish 
 */ 
@Exported 
@Service(DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE) 
public class DeviceConnectorConnection implements DeviceConnectorConnectionService, EntityReferenceHandler<Map> { 

    private static final Logger LOGGER = Logger.getLogger(DeviceConnectorConnection.class.getName()); 

    @Override 
    public DeviceConnectorConnCompInitialInput getInitialInput() { 
        DeviceConnectorConnCompInitialInput initialInputBean = new DeviceConnectorConnCompInitialInput(); 
        try { 
            List<Long> connectionIds = DeviceConnectorHelper.getConnectionList(); 
            initialInputBean.setConnIds(connectionIds); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred creating input data bean for " + DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE), e); 
        } 
        return initialInputBean; 
    } 

    @Override 
    public DeviceConnectorValidationResult validateConnection(Long connId, List<String> allowedConnectionTypes) { 
        return DeviceConnectorHelper.validateConnection(connId, allowedConnectionTypes); 
    } 

    @Override 
    public String getComponentType() { 
        return DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE; 
    } 

    @Override 
    public ComponentValidator<Map, Object> getValidator() { 
        return new DeviceConnectorConnectionValidator(); 
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
    } 

    @Override 
    public void destroy() { 
    } 

    @Override 
    public boolean isRunning() { 
        return false; 
    } 

    @Override 
    public void suspend() { 
    } 

    @Override 
    public void resume() { 
    } 
}
