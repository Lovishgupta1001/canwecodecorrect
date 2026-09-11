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
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.validator; 

import com.eqtechnologic.eqube.commonui.components.eQError; 
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 

import java.util.ArrayList; 
import java.util.List; 
import java.util.Map; 

/** 
 * Validator for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorConnectionValidator implements ComponentValidator<Map, Object> { 

    private static final String CONNECTION_NOT_EMPTY = "deviceconnectorconn.connectionNotEmpty"; 
    private static final String INVALID_CONNECTION_TYPE = "deviceconnectorconn.invalidConnectionType"; 

    @Override 
    public List<eQError> validate(Map componentBean, Object configObject) { 
        List<eQError> messages = new ArrayList<>(); 

        if (componentBean == null) { 
            messages.add(new eQError(CONNECTION_NOT_EMPTY, "ComponentErr", DeviceConnectorConstants.CONNECTION, false)); 
            return messages; 
        } 

        Object connection = componentBean.get(DeviceConnectorConstants.CONNECTION); 
        if (connection == null || ((String) connection).trim().isEmpty()) { 
            messages.add(new eQError(CONNECTION_NOT_EMPTY, "ComponentErr", DeviceConnectorConstants.CONNECTION, false)); 
        } 

        return messages; 
    } 
}
