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
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.logging.transaction.annotation.LogModuleName;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.CallMethodItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.WriteToOPCUAConfigBean;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.exception.WriteToOPCUAErrorCode;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.exception.WriteToOPCUAExceptionType;
import com.eqtechnologic.eqube.mi.activitymanagement.ActivityService;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.ConfigVariableHandler;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.OutputHintHandler;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.PrePostStepConfigurationHandler;
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler;
import com.eqtechnologic.eqube.mi.component.service.ComponentExportEntity;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.google.auto.service.AutoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Component service class for Write To OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings({"java:S6830", "rawtypes"})
@Exported
@Service(WriteToOPCUAConstants.WRITE_TO_OPCUA)
@LogModuleName(moduleName = "Activity")
@AutoService(ActivityService.class)
public class WriteToOPCUAComponentService implements ActivityService<Object, Map, WriteToOPCUAConfigBean>,
        ConfigVariableHandler<Map<String, Object>>,
        OutputHintHandler<Map>, EntityReferenceHandler<Map>,
        PrePostStepConfigurationHandler<Map, Object> {

    private static final Logger LOGGER = Logger.getLogger(WriteToOPCUAComponentService.class.getName());

    private final WriteToOPCUAComponentServiceHelper opcuaHelper;

    @Autowired
    public WriteToOPCUAComponentService(WriteToOPCUAComponentServiceHelper opcuaHelper) {
        this.opcuaHelper = opcuaHelper;
    }

    private TransportClientService getTransportClientService() {
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }

    public List<TransportInfo> fetchTransportListByType(String transportType) throws BusinessException {
        List<TransportClientBean> transportClientBeans = new ArrayList<>();
        try {
            TransportClientService service = getTransportClientService();
            if (service != null && service.getTransportDetails() != null) {
                transportClientBeans = new ArrayList<>(service.getTransportDetails().values());
            }
        } catch (BusinessException e) {
            LogTemplate lt = LogTemplate.of(WriteToOPCUAErrorCode.ERROR_WHILE_FETCHING_TRANSPORT_DETAILS.getMessage());
            LOGGER.error(lt, e);
            throw new BusinessException(WriteToOPCUAExceptionType.WRITE_TO_OPCUA_ACTIVITY_EXCEPTION,
                    WriteToOPCUAErrorCode.ERROR_WHILE_FETCHING_TRANSPORT_DETAILS, e.getMessage());
        }
        return opcuaHelper.convertTransportClientToTransportInfoBeanList(transportType, transportClientBeans);
    }

    public List<TransportInfo> fetchOPCUATransportList() throws BusinessException {
        return fetchTransportListByType(WriteToOPCUAConstants.OPCUA_TYPE);
    }

    @Override
    public Class<WriteToOPCUAConfigBean> getComponentUIClass() {
        return WriteToOPCUAConfigBean.class;
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
        return WriteToOPCUAConstants.WRITE_TO_OPCUA;
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
        return new WriteToOPCUAValidator();
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
        if ("successfulWriteItems".equalsIgnoreCase(id)
                || "failedWriteItems".equalsIgnoreCase(id)
                || "skippedWriteItems".equalsIgnoreCase(id)) {
            return new ArrayList<>();
        }
        return null;
    }

    /**
     * Returns list of variable names created on configuration (e.g. outputValue in CallMethod)
     *
     * @param configData configuration of activity
     * @return List of variable names added on config
     */
    @Override
    public List<String> getKeysAddedOnConfig(Map<String, Object> configData) {
        List<String> keyConfigData = new ArrayList<>();
        List<?> callMethodList = extractCallMethodList(configData);
        for (Object item : callMethodList) {
            String outputValue = extractOutputValue(item);
            if (outputValue != null && !outputValue.isEmpty() && !keyConfigData.contains(outputValue)) {
                keyConfigData.add(outputValue);
            }
        }
        return keyConfigData;
    }

    /**
     * Returns details map for each variable added on configuration
     *
     * @param configData configuration of activity
     * @param prevKeyDetails previous key details in pipeline
     * @return Map of variable name to its details object
     */
    @Override
    public Map<String, Object> getDetailsOfKeysAddedOnConfig(Map<String, Object> configData, Map<String, Object> prevKeyDetails) {
        Map<String, Object> outputHintMap = new HashMap<>();
        List<String> keys = getKeysAddedOnConfig(configData);
        for (String key : keys) {
            outputHintMap.put(key, new HashMap<String, Object>());
        }
        return outputHintMap;
    }

    private List<?> extractCallMethodList(Map<String, Object> configData) {
        if (configData == null) {
            return Collections.emptyList();
        }
        Object obj = configData.get("callMethod");
        if (obj == null) {
            obj = configData.get("CallMethod");
        }
        if (obj == null && configData.get(WriteToOPCUAConstants.WRITE_TO_OPCUA) instanceof Map<?, ?> inner) {
            obj = inner.get("callMethod");
            if (obj == null) {
                obj = inner.get("CallMethod");
            }
        }
        if (obj instanceof List<?> list) {
            return list;
        }
        return Collections.emptyList();
    }

    private String extractOutputValue(Object item) {
        if (item instanceof CallMethodItem callMethodItem) {
            return cleanVariableName(callMethodItem.getOutputValue());
        } else if (item instanceof Map<?, ?> map) {
            Object val = map.get("outputValue");
            if (val == null) {
                val = map.get("output_value");
            }
            if (val == null) {
                val = map.get("OutputValue");
            }
            return cleanVariableName(val != null ? val.toString() : null);
        }
        return null;
    }

    private String cleanVariableName(String rawVar) {
        if (rawVar == null) {
            return null;
        }
        String var = rawVar.trim();
        if ((var.startsWith("\"") && var.endsWith("\"")) || (var.startsWith("'") && var.endsWith("'"))) {
            if (var.length() >= 2) {
                var = var.substring(1, var.length() - 1).trim();
            }
        }
        return var.isEmpty() ? null : var;
    }
}
