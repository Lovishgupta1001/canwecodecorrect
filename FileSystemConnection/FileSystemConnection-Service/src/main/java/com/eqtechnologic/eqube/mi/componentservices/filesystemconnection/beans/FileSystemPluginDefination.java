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

import java.util.List; 
import com.fasterxml.jackson.annotation.JsonProperty; 

/** 
 * Plugin definition for file system connection component 
 * 
 * Author: Lovish 
 */ 
public class FileSystemPluginDefination { 

    @JsonProperty("pluginName") 
    private String pluginName; 

    @JsonProperty("pluginClasses") 
    private List<String> pluginClasses; 

    @JsonProperty("scheme") 
    private List<String> scheme; 

    public FileSystemPluginDefination() { 
    } 

    public FileSystemPluginDefination(String pluginName, List<String> pluginClasses, List<String> scheme) { 
        this.pluginName = pluginName; 
        this.pluginClasses = pluginClasses; 
        this.scheme = scheme; 
    } 

    // -------- Getters & Setters -------- 

    public String getPluginName() { 
        return pluginName; 
    } 

    public void setPluginName(String pluginName) { 
        this.pluginName = pluginName; 
    } 

    public List<String> getPluginClasses() { 
        return pluginClasses; 
    } 

    public void setPluginClasses(List<String> pluginClasses) { 
        this.pluginClasses = pluginClasses; 
    } 

    public List<String> getScheme() { 
        return scheme; 
    } 

    public void setScheme(List<String> scheme) { 
        this.scheme = scheme; 
    } 
}
