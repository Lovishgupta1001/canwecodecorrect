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

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Loggable;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.ui.MIOperation;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.Authorize;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.OperationNames;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.AbstractNodeBean;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaMethodWriteItem;
import com.eqtechnologic.eqube.transport.uiservice.beans.OPCUATransportInfoBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

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

    @Autowired
    private InvokeOPCUAComponentServiceHelper opcuaHelper;

    public InvokeOPCUAComponentRestController() {
    }

    @Autowired
    public InvokeOPCUAComponentRestController(InvokeOPCUAComponentServiceHelper opcuaHelper) {
        this.opcuaHelper = opcuaHelper;
    }

    @GetMapping(value = "/getSupportedPluginType")
    public List<String> getSupportedPluginType() {
        checkMultipleOperations(operations);
        return Arrays.asList("OPC UA", "OPCUA");
    }

    /**
     * Service is used to fetch Address Space
     *
     * @param connectionDetails connection details or transport bean
     * @return List of AbstractNodeBean
     * @throws BusinessException
     */
    @Loggable
    @PostMapping(value = "/fetchAddressSpace")
    public List<AbstractNodeBean> fetchAddressSpace(@RequestBody(required = false) Map<String, Object> connectionDetails) throws BusinessException {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchAddressSpace(connectionDetails);
    }

    /**
     * Service is used to fetch Address Space Children of a node using its id
     *
     * @param nodeId node id
     * @param connectionDetails connection details or transport bean
     * @return List of AbstractNodeBean
     * @throws BusinessException
     */
    @Loggable
    @PostMapping(value = "/fetchAddressSpaceChildrenByID")
    public List<AbstractNodeBean> fetchChildrenByID(@RequestParam("nodeId") String nodeId, @RequestBody(required = false) Map<String, Object> connectionDetails) throws BusinessException {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchChildrenByID(nodeId, connectionDetails);
    }

    /**
     * Service is used to fetch method parameters for a node using its id
     *
     * @param nodeId node id
     * @param connectionDetails connection details or transport bean
     * @return OpcUaMethodWriteItem
     * @throws BusinessException
     */
    @Loggable
    @PostMapping(value = "/fetchMethodParamsByID")
    public OpcUaMethodWriteItem fetchMethodParamsByID(@RequestParam("nodeId") String nodeId, @RequestBody(required = false) Map<String, Object> connectionDetails) throws BusinessException {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchMethodParamsByID(nodeId, connectionDetails);
    }

    /**
     * Service is used to fetch server event fields and event types
     *
     * @param connectionDetails connection details or transport bean
     * @return Map containing eventTypes and eventFields
     * @throws BusinessException
     */
    @Loggable
    @PostMapping(value = "/fetchServerEventFieldsAndTypes")
    public Map<String, Object> fetchServerEventFieldsAndTypes(@RequestBody(required = false) Map<String, Object> connectionDetails) throws BusinessException {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchServerEventFieldsAndTypes(connectionDetails);
    }

    /**
     * Service is used to fetch enriched message using node id as well as parent node id
     *
     * @param nodeId node id
     * @param parentNodeId parent node id
     * @param enrichmentPath enrichment path
     * @param connectionDetails connection details or transport bean
     * @return String
     * @throws BusinessException
     */
    @Loggable
    @PostMapping(value = "/fetchEnrichedMessageByID")
    public String fetchEnrichedMessageByID(@RequestParam("nodeId") String nodeId,
                                           @RequestParam("parentNodeId") String parentNodeId,
                                           @RequestParam("enrichmentPath") List<String> enrichmentPath,
                                           @RequestBody(required = false) Map<String, Object> connectionDetails) throws BusinessException {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchEnrichedMessageByID(nodeId, parentNodeId, enrichmentPath, connectionDetails);
    }

    /**
     * Service is used to validate the selected parent node for a given method node
     *
     * @param nodeId node id
     * @param objectNodeId parent object node id
     * @param connectionDetails connection details or transport bean
     * @return Boolean
     * @throws BusinessException
     */
    @Loggable
    @PostMapping(value = "/validateMethodWriteItem")
    public Boolean validateMethodWriteItem(@RequestParam("nodeId") String nodeId,
                                           @RequestParam("objectNodeId") String objectNodeId,
                                           @RequestBody(required = false) Map<String, Object> connectionDetails) throws BusinessException {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().validateMethodWriteItem(nodeId, objectNodeId, connectionDetails);
    }

    /**
     * Service is used to fetch OPC UA transport info
     *
     * @return OPCUATransportInfoBean
     */
    @Loggable
    @GetMapping(value = "/fetchOPCUATransportInfo")
    public OPCUATransportInfoBean fetchOPCUATransportInfo() {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchOPCUATransportInfo();
    }

    /**
     * Service is used to fetch configured keystores
     *
     * @return List of keystores
     */
    @Loggable
    @GetMapping(value = "/fetchConfiguredKeystores")
    public List<String> fetchConfiguredKeystores() {
        checkMultipleOperations(operations);
        return opcuaHelper.getInvokeOPCUAService().fetchConfiguredKeystores();
    }

    @Authorize
    public void checkMultipleOperations(@OperationNames List<String> operations) {
        // implementation handled by @Authorize annotation
    }
}
