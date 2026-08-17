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
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.publish.bean.PublishConfigBean;
import com.eqtechnologic.eqube.mi.activities.publish.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activitymanagement.ActivityService;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.OutputHintHandler;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.PrePostStepConfigurationHandler;
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.eQExportEntity;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientConnection;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.transport.commoncomponents.beans.AdvancedConfigProperty;
import com.google.auto.service.AutoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Component service class for Publish activity
 * @author sharoni
 */

@Exported
@Service(eQPublishConstants.PUBLISH_SERVICE)
@AutoService(ActivityService.class)
public class PublishComponentService implements ActivityService<Object, Map, PublishConfigBean>, OutputHintHandler<Map>, EntityReferenceHandler<Map>, PrePostStepConfigurationHandler<Map,Object> {

    private static Logger logger = Logger.getLogger(PublishComponentService.class.getName());

    @Autowired
    private PublishComponentServiceHelper publishHelper;

    @Override
    public Class<PublishConfigBean> getComponentUIClass()
            {
            return PublishConfigBean.class;
        }


    @Override
    public void destroy() {
        // Add logic
    }


    @Override
    public void initialize() {
        // Add logic
    }

    @Override
    public boolean isRunning() {
        // Add logic
        return false;
    }

    @Override
    public void resume() {
        // Add logic
    }

    @Override
    public void suspend() {
        // Add logic
    }

    @Override
    public void calculateConfigRemapInfo(Map configData, RemapInfo remapInfo) {
        publishHelper.calculateConfigRemapInfo(remapInfo, configData);
    }

    @Override
    public Class<Map> getComponentDataClass() {
        return Map.class;
        }

    @Override
    public String getComponentType() {
        return eQPublishConstants.PUBLISH_SERVICE;
        }


    @Override
    public Object getInitialInput() {
        return null;
    }

    @Override
    public List<eQExportEntity> getLinkedResource(Map configData) {
        return publishHelper.getConfigLinkedResources(configData);
    }

    @Override
    public ComponentValidator<Map, Map> getValidator() {
        return new PublishValidator();
    }

    @Override
    public void setConfigRemapInfo(Map configData, RemapInfo remapInfo) {
        publishHelper.setConfigRemapInfo(remapInfo, configData);
    }


    @Override
    public Object preSaveConfiguration(Map configData, Object saveActivityBean) {
        return true;
    }

    @Override
    public void postFetchConfiguration(Map configData, Object details) {
        publishHelper.postFetchConfiguration(configData);
    }

    @Override
    public Object getOutputHints(Map configMap, String id, Map mapDetail) {
        return publishHelper.getOutPutDetails(id);
    }

    private TransportClientService getTransportClientService(){
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }

    public List<TransportClientConnection> fetchTransportConnections() throws BusinessException{
        return getTransportClientService().getTransportConnections();
    }

    public List<TransportInfo> fetchTransportListByType(String transportType) throws BusinessException{
        List<TransportClientBean> transportClientBeans = new ArrayList<>(getTransportClientService().getTransportDetails().values());
        return publishHelper.convertTransportClientToTransportInfoBeanList(transportType, transportClientBeans);
    }

    public List<AdvancedConfigProperty> fetchAdvancedConfiguration(String transportType,String transportName) throws BusinessException {
        return new ArrayList<>(getTransportClientService().populateAdvanceConfiguration(transportType,transportName,null));
    }

 }
