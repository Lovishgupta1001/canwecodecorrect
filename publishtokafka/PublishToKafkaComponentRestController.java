/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */

package com.eqtechnologic.eqube.mi.activities.publishtokafka;

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.mi.activities.publishtokafka.bean.TransportInfo;
import com.eqtechnologic.eqube.platform.transport.client.beans.KafkaConfigUIProperties;
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
 * Rest controller for kafka producer activity
 * @author avdhut
 */

@RestController
@RequestMapping("/publishToKafka")
public class PublishToKafkaComponentRestController {
    private List<String> operations = Arrays.asList(MIOperation.Process.LIST_PROCESS,MIOperation.Transaction.LIST_TRANSACTIONS);

    @Autowired
    private PublishToKafkaComponentServiceHelper publishToKafkaHelper;

    @GetMapping(value = "/fetchKafkaTransportList")
    public List<TransportInfo> fetchTransportList() {
        checkMultipleOperations(operations);
        return publishToKafkaHelper.getPublishToKafkaService().fetchTransportList();
    }

    @GetMapping(value = "/fetchProducerPropertyNames")
    public List<KafkaConfigUIProperties> fetchProducerPropertyNames() throws BusinessException {
        checkMultipleOperations(operations);
        return publishToKafkaHelper.fetchProducerPropertyNames();
    }

    @Authorize
    public void checkMultipleOperations(@OperationNames List<String> operations) {
        //implementation handled by @Authorize annotation
    }
}
