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

/** 
 * Validation result for a device connector connection. 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorValidationResult { 

    private boolean valid = false; 
    private boolean connectionTypeValid = false; 
    private String connectionType = ""; 
    private String connectionName = ""; 
    private String message = ""; 

    public boolean isValid() { 
        return valid; 
    } 

    public void setValid(boolean valid) { 
        this.valid = valid; 
    } 

    public boolean isConnectionTypeValid() { 
        return connectionTypeValid; 
    } 

    public void setConnectionTypeValid(boolean connectionTypeValid) { 
        this.connectionTypeValid = connectionTypeValid; 
    } 

    public String getConnectionType() { 
        return connectionType; 
    } 

    public void setConnectionType(String connectionType) { 
        this.connectionType = connectionType; 
    } 

    public String getConnectionName() { 
        return connectionName; 
    } 

    public void setConnectionName(String connectionName) { 
        this.connectionName = connectionName; 
    } 

    public String getMessage() { 
        return message; 
    } 

    public void setMessage(String message) { 
        this.message = message; 
    } 

    @Override 
    public String toString() { 
        return "DeviceConnectorValidationResult{" + 
                "valid=" + valid + 
                ", connectionTypeValid=" + connectionTypeValid + 
                ", connectionType='" + connectionType + '\'' + 
                ", connectionName='" + connectionName + '\'' + 
                ", message='" + message + '\'' + 
                '}'; 
    } 
}
