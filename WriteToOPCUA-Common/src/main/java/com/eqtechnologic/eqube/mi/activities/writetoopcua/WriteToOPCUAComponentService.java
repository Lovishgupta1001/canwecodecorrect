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

import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.WriteToOPCUAConfigBean;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.activitymanagement.ActivityService;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.OutputHintHandler;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.PrePostStepConfigurationHandler;
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler;
import com.eqtechnologic.eqube.mi.component.service.ComponentExportEntity;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported;
import com.google.auto.service.AutoService;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Component service class for Write To OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings("java:S6830")
@Exported
@Service(WriteToOPCUAConstants.WRITE_TO_OPCUA)
@AutoService(ActivityService.class)
public class WriteToOPCUAComponentService implements ActivityService<Object, Map, WriteToOPCUAConfigBean>,
        OutputHintHandler<Map>, EntityReferenceHandler<Map>,
        PrePostStepConfigurationHandler<Map, Object> {

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
