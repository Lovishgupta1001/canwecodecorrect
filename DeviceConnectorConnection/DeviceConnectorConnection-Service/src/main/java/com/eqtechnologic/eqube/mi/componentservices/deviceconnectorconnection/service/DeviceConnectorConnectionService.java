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

import com.eqtechnologic.eqube.mi.component.service.ComponentService; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import java.util.List; 
import java.util.Map; 

/** 
 * Service interface for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public interface DeviceConnectorConnectionService 
        extends ComponentService<DeviceConnectorConnCompInitialInput, Map, Object> { 

    /** 
     * Validate a device connector connection. 
     * 
     * @param connId ID of the connection to validate 
     * @param allowedConnectionTypes List of allowed connection types (e.g. OPCUA) 
     * @return DeviceConnectorValidationResult 
     */ 
    DeviceConnectorValidationResult validateConnection(Long connId, List<String> allowedConnectionTypes); 
}
