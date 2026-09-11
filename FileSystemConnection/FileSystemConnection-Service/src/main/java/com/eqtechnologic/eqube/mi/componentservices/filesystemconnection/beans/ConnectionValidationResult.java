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

package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans; 

/** 
 * Validation result for a file system connection. 
 * 
 * Author: Lovish 
 */ 

public class ConnectionValidationResult { 

    private boolean valid = false; 
    private boolean pluginClassValid = false; 
    private boolean schemeValid = false; 
    private boolean differentPluginSrcDest = false; 
    private String pluginClass = ""; 
    private String scheme = ""; 

    // ===== Getters and Setters ===== 

    public boolean isValid() { 
        return valid; 
    } 

    public void setValid(boolean valid) { 
        this.valid = valid; 
    } 

    public boolean isPluginClassValid() { 
        return pluginClassValid; 
    } 

    public void setPluginClassValid(boolean pluginClassValid) { 
        this.pluginClassValid = pluginClassValid; 
    } 

    public boolean isSchemeValid() { 
        return schemeValid; 
    } 

    public void setSchemeValid(boolean schemeValid) { 
        this.schemeValid = schemeValid; 
    } 

    public String getPluginClass() { 
        return pluginClass; 
    } 

    public void setPluginClass(String pluginClass) { 
        this.pluginClass = pluginClass; 
    } 

    public String getScheme() { 
        return scheme; 
    } 

    public void setScheme(String scheme) { 
        this.scheme = scheme; 
    } 

    public boolean isDifferentPluginSrcDest() { 
        return differentPluginSrcDest; 
    } 

    public void setDifferentPluginSrcDest(boolean differentPluginSrcDest) { 
        this.differentPluginSrcDest = differentPluginSrcDest; 
    } 

    @Override 
    public String toString() { 
        return "ConnectionValidationResult{" + 
                "valid=" + valid + 
                ", pluginClassValid=" + pluginClassValid + 
                ", schemeValid=" + schemeValid + 
                ", pluginClass='" + pluginClass + '\'' + 
                ", scheme='" + scheme + '\'' + 
                '}'; 
    } 
}
