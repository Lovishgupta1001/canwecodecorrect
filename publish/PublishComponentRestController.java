/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */

package com.eqtechnologic.eqube.mi.activities.publish;

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.mi.activities.publish.bean.TransportInfo;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientConnection;
import com.eqtechnologic.eqube.transport.commoncomponents.beans.AdvancedConfigProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.OperationNames;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.Authorize;
import com.eqtechnologic.eqube.mi.ui.MIOperation;


import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import com.eqtechnologic.eqube.logging.Logger;

/**
 * Rest controller for publish activity
 * @author sharoni
 */

@RestController
@RequestMapping("/publish")
public class PublishComponentRestController {
    private List<String> operations = Arrays.asList(MIOperation.Process.LIST_PROCESS,MIOperation.Transaction.LIST_TRANSACTIONS);
    private static Logger logger = Logger.getLogger(PublishComponentRestController.class);

    @Autowired
    private PublishComponentServiceHelper publishHelper;

    @GetMapping(value = "/fetchTransportConnections")
    public List<TransportClientConnection> fetchTransportConnections() throws BusinessException {
        checkMultipleOperations(operations);
        List<TransportClientConnection> transportClientConnections = new ArrayList<>();
        try {
            transportClientConnections =  publishHelper.getPublishService().fetchTransportConnections();
        }catch(BusinessException e){
            logger.error("Error while fetching Transport");
        }
        return transportClientConnections;
    }

    @GetMapping(value = "/fetchTransportListByType")
    public List<TransportInfo> fetchTransportListByType(@RequestParam("transportType") String transportType) throws BusinessException {
        checkMultipleOperations(operations);
        List<TransportInfo> transportInfos = new ArrayList<>();
        try{
            transportInfos = publishHelper.getPublishService().fetchTransportListByType(transportType);
        }catch(BusinessException e){
            logger.error("Error while fetching Transport");
        }
        return transportInfos;
    }

    @GetMapping(value = "/fetchAdvancedConfigProperty")
    public List<AdvancedConfigProperty> fetchAdvancedConfigProperty(@RequestParam("transportType") String transportType ,@RequestParam("transportName") String transportName) throws BusinessException {
        checkMultipleOperations(operations);
        return publishHelper.getPublishService().fetchAdvancedConfiguration(transportType,transportName);
    }

    @Authorize
    public void checkMultipleOperations(@OperationNames List<String> operations) {
        //implementation handled by @Authorize annotation
    }


}
