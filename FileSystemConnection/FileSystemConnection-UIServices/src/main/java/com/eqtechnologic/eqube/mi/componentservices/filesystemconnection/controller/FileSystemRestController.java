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
package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.controller; 

import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.ConnectionValidationResult; 
import org.springframework.web.bind.annotation.*; 
import com.eqtechnologic.eqube.mi.ui.MIOperation; 
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.*; 

import java.util.List; 
import java.util.ArrayList; 

/** 
 * @author amitk 
 * rest controller for file system component 
 */ 
@RestController 
@RequestMapping("/filesystem") 
public class FileSystemRestController { 
    @GetMapping(value = "/getFileSystemConnInitialData") 
    public FileSystemConnCompInitialInput fetchFileSystemConnInitialData() { 
        List<String> operations = new ArrayList<>(); 
        operations.add(MIOperation.Process.LIST_PROCESS); 
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS); 
        checkMultipleOperations(operations); 
        return FileSystemControllerHelper.getInstance().getFileSystemConnectionService().getInitialInput(); 
    } 
    @PostMapping(value = "/validateConnection") 
    public ConnectionValidationResult validateConnection(@RequestParam("connId") Long connId,@RequestParam("otherConnectionId") Long otherConnectionId, 
                                      @RequestBody List<FileSystemPluginDefination> pluginDefinitions) { 

        List<String> operations = new ArrayList<>(); 
        operations.add(MIOperation.Process.LIST_PROCESS); 
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS); 
        checkMultipleOperations(operations); 
        return FileSystemControllerHelper.getInstance().getFileSystemConnectionService().validateConnection(connId,otherConnectionId, pluginDefinitions); 
    } 

    @Authorize 
    public void checkMultipleOperations(@OperationNames List<String> operations) { 
            //implementation handled by @Authorize annotation 
    } 
}
