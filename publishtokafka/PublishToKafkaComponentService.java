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

import com.eqtechnologic.eqube.mi.activities.publishtokafka.bean.PublishToKafkaConfigBean;
import com.eqtechnologic.eqube.mi.activities.publishtokafka.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.publishtokafka.constants.PublishToKafkaConstants;
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
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.google.auto.service.AutoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Component service class for Kafka Producer activity
 * @author avdhut
 */

@Exported
@Service(PublishToKafkaConstants.PUBLISH_TO_KAFKA)
@AutoService(ActivityService.class)
public class PublishToKafkaComponentService implements ActivityService<Object, Map, PublishToKafkaConfigBean>, OutputHintHandler<Map>, EntityReferenceHandler<Map>, PrePostStepConfigurationHandler<Map,Object> {

    private static Logger logger = Logger.getLogger(PublishToKafkaComponentService.class);

    @Autowired
    private PublishToKafkaComponentServiceHelper kafkaServiceHelper;

    @Override
    public Class<PublishToKafkaConfigBean> getComponentUIClass()
            {
            return PublishToKafkaConfigBean.class;
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
        kafkaServiceHelper.calculateConfigRemapInfo(remapInfo, configData);
    }

    @Override
    public Class<Map> getComponentDataClass() {
        return Map.class;
        }

    @Override
    public String getComponentType() {
        return PublishToKafkaConstants.PUBLISH_TO_KAFKA;
        }


    @Override
    public Object getInitialInput() {
        return null;
    }

    @Override
    public List<ComponentExportEntity> getLinkedResource(Map configData) {
        return kafkaServiceHelper.getConfigLinkedResources(configData);
    }

    @Override
    public ComponentValidator<Map, Map> getValidator() {
        return new PublishToKafkaValidator();
    }

    @Override
    public void setConfigRemapInfo(Map configData, RemapInfo remapInfo) {
        kafkaServiceHelper.setConfigRemapInfo(remapInfo, configData);
    }


    @Override
    public Object preSaveConfiguration(Map configData, Object saveActivityBean) {
        return true;
    }

    @Override
    public void postFetchConfiguration(Map configData, Object details) {
        // Add logic
    }

    @Override
    public Object getOutputHints(Map configMap, String id, Map mapDetail) {
        // Add logic
        return null;
    }

    private TransportClientService getTransportClientService(){
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }

    public List<TransportInfo> fetchTransportList(){
        List<TransportClientBean> transportList = new ArrayList<>();
        try {
             transportList = new ArrayList<>( getTransportClientService().getTransportDetails().values());
        }catch(BusinessException e){
            logger.error("Error while fetching Transport");
        }

        return transportList.stream().filter(this::isKafkaTransportWithProducerConfigured)
                .map(eqTransport -> {
                    TransportInfo transportInfo = new TransportInfo();
                    transportInfo.setTransportName(eqTransport.getName());
                    transportInfo.setTransportId(eqTransport.getTransportId());
                    transportInfo.setTopicsToPublish(eqTransport.getTopicsToPublish());
                    return transportInfo;
                }).collect(Collectors.toList());
    }

    private boolean isKafkaTransportWithProducerConfigured(TransportClientBean transport) {
        return (transport.getTransportType().equals(TransportClientConstants.KAFKA_TYPE))
                && transport.isProducerConfigured();
    }

}
