/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.writetoopcua;

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.ui.MIOperation;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.Authorize;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.OperationNames;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Rest controller for Write To OPC UA activity.
 *
 * @author Lovish
 */
@RestController
@RequestMapping("/writetoopcua")
public class WriteToOPCUAComponentRestController {

    private static final Logger LOGGER = Logger.getLogger(WriteToOPCUAComponentRestController.class.getName());
    private List<String> operations = Arrays.asList(MIOperation.Process.LIST_PROCESS, MIOperation.Transaction.LIST_TRANSACTIONS);

    @Autowired
    private WriteToOPCUAComponentServiceHelper opcuaHelper;

    @GetMapping(value = "/fetchTransportListByType")
    public List<TransportInfo> fetchTransportListByType(@RequestParam("transportType") String transportType) throws BusinessException {
        checkMultipleOperations(operations);
        List<TransportInfo> transportInfos = new ArrayList<>();
        try {
            transportInfos = opcuaHelper.getWriteToOPCUAService().fetchTransportListByType(transportType);
        } catch (BusinessException e) {
            LOGGER.error("Error while fetching Transport", e);
        }
        return transportInfos;
    }

    @GetMapping(value = "/fetchOPCUATransportList")
    public List<TransportInfo> fetchOPCUATransportList() throws BusinessException {
        return fetchTransportListByType(WriteToOPCUAConstants.OPCUA_TYPE);
    }

    @GetMapping(value = "/testTransportById")
    public boolean testTransportById(@RequestParam("transportId") Long transportId) {
        checkMultipleOperations(operations);
        try {
            return opcuaHelper.testTransportById(transportId);
        } catch (Exception e) {
            LOGGER.error("Error testing transport ID: " + transportId, e);
            return false;
        }
    }

    @Authorize
    public void checkMultipleOperations(@OperationNames List<String> operations) {
        // implementation handled by @Authorize annotation
    }
}
