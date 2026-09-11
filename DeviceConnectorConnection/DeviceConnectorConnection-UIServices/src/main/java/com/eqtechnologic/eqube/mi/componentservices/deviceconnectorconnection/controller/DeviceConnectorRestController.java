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
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.controller; 

import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import org.springframework.web.bind.annotation.*; 
import com.eqtechnologic.eqube.mi.ui.MIOperation; 
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.*; 

import java.util.List; 
import java.util.ArrayList; 

/** 
 * REST controller for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
@RestController 
@RequestMapping("/deviceconnector") 
public class DeviceConnectorRestController { 

    @GetMapping(value = "/getDeviceConnectorConnInitialData") 
    public DeviceConnectorConnCompInitialInput fetchDeviceConnectorConnInitialData() { 
        List<String> operations = new ArrayList<>(); 
        operations.add(MIOperation.Process.LIST_PROCESS); 
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS); 
        checkMultipleOperations(operations); 
        return DeviceConnectorControllerHelper.getInstance().getDeviceConnectorConnectionService().getInitialInput(); 
    } 

    @PostMapping(value = "/validateConnection") 
    public DeviceConnectorValidationResult validateConnection(@RequestParam("connId") Long connId, 
                                                              @RequestBody(required = false) List<String> allowedConnectionTypes) { 
        List<String> operations = new ArrayList<>(); 
        operations.add(MIOperation.Process.LIST_PROCESS); 
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS); 
        checkMultipleOperations(operations); 
        return DeviceConnectorControllerHelper.getInstance().getDeviceConnectorConnectionService().validateConnection(connId, allowedConnectionTypes); 
    } 

    @Authorize 
    public void checkMultipleOperations(@OperationNames List<String> operations) { 
        // implementation handled by @Authorize annotation 
    } 
}
