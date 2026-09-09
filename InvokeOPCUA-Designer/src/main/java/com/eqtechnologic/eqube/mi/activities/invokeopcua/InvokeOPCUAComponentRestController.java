/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.invokeopcua;

import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.ui.MIOperation;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.Authorize;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.OperationNames;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Rest controller for Invoke OPC UA activity.
 *
 * @author Lovish
 */
@RestController
@RequestMapping("/invokeopcua")
public class InvokeOPCUAComponentRestController {

    private static final Logger LOGGER = Logger.getLogger(InvokeOPCUAComponentRestController.class.getName());
    private List<String> operations = Arrays.asList(MIOperation.Process.LIST_PROCESS, MIOperation.Transaction.LIST_TRANSACTIONS, MIOperation.Transport.VIEW_TRANSPORT);

    private final InvokeOPCUAComponentServiceHelper opcuaHelper;

    @Autowired
    public InvokeOPCUAComponentRestController(InvokeOPCUAComponentServiceHelper opcuaHelper) {
        this.opcuaHelper = opcuaHelper;
    }

    @GetMapping(value = "/getSupportedPluginType")
    public List<String> getSupportedPluginType() {
        checkMultipleOperations(operations);
        return Arrays.asList("OPC UA", "OPCUA", "MQTT");
    }

    @Authorize
    public void checkMultipleOperations(@OperationNames List<String> operations) {
        // implementation handled by @Authorize annotation
    }
}
