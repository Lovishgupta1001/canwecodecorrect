/** 
 * @(#)eQubeMI version 2025.02 
 * 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into. 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans; 

import java.util.List; 
import com.fasterxml.jackson.annotation.JsonProperty; 

/** 
 * Plugin / connection type definition for device connector connection component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorPluginDefinition { 

    @JsonProperty("connectionType") 
    private String connectionType; 

    @JsonProperty("allowedTypes") 
    private List<String> allowedTypes; 

    public DeviceConnectorPluginDefinition() { 
    } 

    public DeviceConnectorPluginDefinition(String connectionType, List<String> allowedTypes) { 
        this.connectionType = connectionType; 
        this.allowedTypes = allowedTypes; 
    } 

    public String getConnectionType() { 
        return connectionType; 
    } 

    public void setConnectionType(String connectionType) { 
        this.connectionType = connectionType; 
    } 

    public List<String> getAllowedTypes() { 
        return allowedTypes; 
    } 

    public void setAllowedTypes(List<String> allowedTypes) { 
        this.allowedTypes = allowedTypes; 
    } 
}
