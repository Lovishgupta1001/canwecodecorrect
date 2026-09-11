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
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.controller; 

import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.service.DeviceConnectorConnectionService; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 

/** 
 * Controller Helper for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorControllerHelper { 
    private static DeviceConnectorControllerHelper controllerHelper; 

    public static DeviceConnectorControllerHelper getInstance() { 
        if (controllerHelper == null) { 
            controllerHelper = new DeviceConnectorControllerHelper(); 
        } 
        return controllerHelper; 
    } 

    public DeviceConnectorConnectionService getDeviceConnectorConnectionService() { 
        return ServiceRegistry.getInstance().getService(DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE); 
    } 
}
