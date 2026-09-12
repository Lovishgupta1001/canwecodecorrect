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
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans;

import com.eqtechnologic.eqube.mi.ui.common.services.uibeans.ConnectionUIBean;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** 
 * Bean representing an accessible Device Connector connection. 
 * 
 * Author: Lovish 
 */ 
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeviceConnectorBean extends ConnectionUIBean {

    private static final long serialVersionUID = 1L;

    private String connectionType;

    public DeviceConnectorBean() {
        super();
    }

    public String getConnectionType() {
        return connectionType;
    }

    public void setConnectionType(String connectionType) {
        this.connectionType = connectionType;
    }
}
