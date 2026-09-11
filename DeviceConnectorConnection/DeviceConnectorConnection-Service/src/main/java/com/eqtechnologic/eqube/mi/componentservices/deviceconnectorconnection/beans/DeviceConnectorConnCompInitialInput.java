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

import java.util.List; 

/** 
 * Initial input for device connector connection component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorConnCompInitialInput { 
    private List<Long> connIds; 

    public List<Long> getConnIds() { 
        return connIds; 
    } 

    public void setConnIds(List<Long> connIds) { 
        this.connIds = connIds; 
    } 
}
