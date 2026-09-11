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
package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.validator; 

import com.eqtechnologic.eqube.commonui.components.eQError; 
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator; 
import com.eqtechnologic.eqube.mi.component.utility.ComponentUtility; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants; 

import java.util.ArrayList; 
import java.util.List; 
import java.util.Map; 

public class FileSystemConnectionValidator implements ComponentValidator<Map, Object> { 

    private static final String CONNECTION_NOT_EMPTY = "filesystemconn.connectionNotEmpty"; 

    @Override 
    public List<eQError> validate(Map componentBean, Object configObject) { 
        List<eQError> messages = new ArrayList<>(); 

        Object connection = componentBean.get(FileSystemConstants.CONNECTION); 
        if(connection == null || ((String) connection).isEmpty()){ 
            ComponentUtility componentUtility = ComponentUtility.getInstance(); 
            messages.add(new eQError(CONNECTION_NOT_EMPTY,"ComponentErr",FileSystemConstants.CONNECTION,false)); 
        } 
        return messages; 
    } 
}
