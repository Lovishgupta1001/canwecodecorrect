/** 
 * @(#)eQubeMI version 5.3 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans; 

import java.util.List; 
import java.util.Map; 

/** 
 * @author amitk 
 * Initial input for file system connection component 
 */ 
public class FileSystemConnCompInitialInput { 
    private List<Long> connIds; 
    private Map<Long, String> connIDVsBaseFilePath; 

    public List<Long> getConnIds() { 
        return connIds; 
    } 

    public void setConnIds(List<Long> connIds) { 
        this.connIds = connIds; 
    } 

    public Map<Long, String> getConnVsBaseFilePath() { 
        return connIDVsBaseFilePath; 
    } 

    public void setConnVsBaseFilePath(Map<Long, String> connVsBaseFilePath) { 
        this.connIDVsBaseFilePath = connVsBaseFilePath; 
    } 
}
