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
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.WriteToOPCUAConfigBean;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.exception.WriteToOPCUAErrorCode;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.exception.WriteToOPCUAExceptionType;
import com.eqtechnologic.eqube.mi.activitymanagement.ActivityService;
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
@AutoService(ActivityService.class)
public class WriteToOPCUAComponentService implements ActivityService<Object, Map, WriteToOPCUAConfigBean>,
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
        // No implementation
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
        return Collections.emptyList();
    }

    @Override
    public ComponentValidator<Map, Map> getValidator() {
        return new WriteToOPCUAValidator();
    }

    @Override
    public void setConfigRemapInfo(Map configData, RemapInfo remapInfo) {
        // No implementation
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
}
