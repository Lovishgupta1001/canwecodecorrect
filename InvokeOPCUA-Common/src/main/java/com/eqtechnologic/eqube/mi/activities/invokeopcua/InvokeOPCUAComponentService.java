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
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.logging.transaction.annotation.LogModuleName;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.bean.InvokeOPCUAConfigBean;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.constants.InvokeOPCUAConstants;
import com.eqtechnologic.eqube.mi.activitymanagement.ActivityService;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.OutputHintHandler;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.PrePostStepConfigurationHandler;
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler;
import com.eqtechnologic.eqube.mi.component.service.ComponentExportEntity;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported;
// import com.eqtechnologic.eqube.transport.opcuatransport.beans.AbstractNodeBean;
// import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaMethodWriteItem;
// import com.eqtechnologic.eqube.transport.uiservice.beans.OPCUATransportInfoBean;
import com.google.auto.service.AutoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Component service class for Invoke OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings({"java:S6830", "rawtypes"})
@Exported
@Service(InvokeOPCUAConstants.INVOKE_OPCUA)
@LogModuleName(moduleName = "Activity")
@AutoService(ActivityService.class)
public class InvokeOPCUAComponentService implements ActivityService<Object, Map, InvokeOPCUAConfigBean>,
        OutputHintHandler<Map>, EntityReferenceHandler<Map>,
        PrePostStepConfigurationHandler<Map, Object> {

    private static final Logger LOGGER = Logger.getLogger(InvokeOPCUAComponentService.class.getName());

    private final InvokeOPCUAComponentServiceHelper opcuaHelper;

    @Autowired
    public InvokeOPCUAComponentService(InvokeOPCUAComponentServiceHelper opcuaHelper) {
        this.opcuaHelper = opcuaHelper;
    }

    @Override
    public Class<InvokeOPCUAConfigBean> getComponentUIClass() {
        return InvokeOPCUAConfigBean.class;
    }

    @Override
    public void destroy() {
        // No implementation
    }

    @Override
    public void initialize() {
        // No implementation
    }

    @Override
    public boolean isRunning() {
        return false;
    }

    @Override
    public void resume() {
        // No implementation
    }

    @Override
    public void suspend() {
        // No implementation
    }

    @Override
    public void calculateConfigRemapInfo(Map configData, RemapInfo remapInfo) {
        opcuaHelper.calculateConfigRemapInfo(remapInfo, configData);
    }

    @Override
    public Class<Map> getComponentDataClass() {
        return Map.class;
    }

    @Override
    public String getComponentType() {
        return InvokeOPCUAConstants.INVOKE_OPCUA;
    }

    @Override
    public Object getInitialInput() {
        return null;
    }

    @Override
    public List<ComponentExportEntity> getLinkedResource(Map configData) {
        return opcuaHelper.getConfigLinkedResources(configData);
    }

    @Override
    public ComponentValidator<Map, Map> getValidator() {
        return new InvokeOPCUAValidator();
    }

    @Override
    public void setConfigRemapInfo(Map configData, RemapInfo remapInfo) {
        opcuaHelper.setConfigRemapInfo(remapInfo, configData);
    }

    @Override
    public Object preSaveConfiguration(Map configData, Object saveActivityBean) {
        return true;
    }

    @Override
    public void postFetchConfiguration(Map configData, Object details) {
        // No implementation
    }

    @Override
    public Object getOutputHints(Map configMap, String id, Map mapDetail) {
        return null;
    }

    /*
     * The following service methods use com.eqtechnologic.eqube.transport.* classes
     * and have been commented out.

    public List<AbstractNodeBean> fetchAddressSpace(Object connectionDetails) throws BusinessException {
        return opcuaHelper.fetchAddressSpace(connectionDetails);
    }

    public List<AbstractNodeBean> fetchChildrenByID(String nodeId, Object connectionDetails) throws BusinessException {
        return opcuaHelper.fetchChildrenByID(nodeId, connectionDetails);
    }

    public OpcUaMethodWriteItem fetchMethodParamsByID(String nodeId, Object connectionDetails) throws BusinessException {
        return opcuaHelper.fetchMethodParamsByID(nodeId, connectionDetails);
    }
    */

    /*
     * The following service methods are not bare minimum required for Invoke OPC UA activity
     * and have been commented out.

    public Map<String, Object> fetchServerEventFieldsAndTypes(Object connectionDetails) throws BusinessException {
        return opcuaHelper.fetchServerEventFieldsAndTypes(connectionDetails);
    }

    public String fetchEnrichedMessageByID(String nodeId, String parentNodeId, List<String> enrichmentPath, Object connectionDetails) throws BusinessException {
        return opcuaHelper.fetchEnrichedMessageByID(nodeId, parentNodeId, enrichmentPath, connectionDetails);
    }

    public Boolean validateMethodWriteItem(String nodeId, String objectNodeId, Object connectionDetails) throws BusinessException {
        return opcuaHelper.validateMethodWriteItem(nodeId, objectNodeId, connectionDetails);
    }

    public OPCUATransportInfoBean fetchOPCUATransportInfo() {
        return opcuaHelper.fetchOPCUATransportInfo();
    }

    public List<String> fetchConfiguredKeystores() {
        return opcuaHelper.fetchConfiguredKeystores();
    }
    */
}
