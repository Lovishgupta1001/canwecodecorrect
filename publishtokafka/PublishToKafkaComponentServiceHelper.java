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

import com.eqtechnologic.eqube.certificate.environment.serviceprovider.EnvironmentProvider;
import com.eqtechnologic.eqube.deploymanagement.beans.DeployRemapBean;
import com.eqtechnologic.eqube.eQUtil;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.publishtokafka.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.publishtokafka.constants.PublishToKafkaConstants;
import com.eqtechnologic.eqube.mi.businessobjects.enums.BOType;
import com.eqtechnologic.eqube.mi.businessobjects.factory.BOFactory;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.mi.enums.eQDestinationType;
import com.eqtechnologic.eqube.commoncomponents.enums.eQResourceType;
import com.eqtechnologic.eqube.certificate.key.api.bo.KeyBO;
import com.eqtechnologic.eqube.certificate.key.bean.EncryptionBean;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.ProcessRemapInfos;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.eQExportEntity;
import com.eqtechnologic.eqube.platform.transport.client.beans.KafkaConfigUIProperties;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.mi.util.AdminConsoleConstants;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.util.eQDbException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Helper methods required for Kafka Producer Component
 * @author avdhut
 */
@Component
class PublishToKafkaComponentServiceHelper {

    private static Logger logger = Logger.getLogger(PublishToKafkaComponentServiceHelper.class);


    List<TransportInfo> fetchTransportList() {
        return new ArrayList<>();
    }

    public List<KafkaConfigUIProperties> fetchProducerPropertyNames() throws BusinessException {
        List<KafkaConfigUIProperties> kafkaConfigUIProperties = getTransportClientService().getKafkaProducerConfigProperties();
        return kafkaConfigUIProperties.stream().filter(kafkaProp -> !kafkaProp.isMandatory()).collect(Collectors.toList());
    }


    public void calculateConfigRemapInfo(RemapInfo completeRemapInfo, Map<String, Object> configData) {
        ProcessRemapInfos processRemapInfos = (ProcessRemapInfos) completeRemapInfo;
        boolean dynamicTransport = (boolean) configData.get(PublishToKafkaConstants.DYNAMIC_TRANSPORT);
        if(!dynamicTransport) {
            String transportName = (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME);
            if (transportName != null && !transportName.trim().isEmpty()) {
                calculateTransportRemapInfo(processRemapInfos, configData);
            }
        }
    }


    private void calculateTransportRemapInfo(ProcessRemapInfos processRemapInfos, Map<String, Object> configData) {
        String topicToPublish = ((List<String>) configData.get(PublishToKafkaConstants.TOPIC)).get(0);
        if (topicToPublish != null && !topicToPublish.isEmpty()) {
            DeployRemapBean deployRemapBean = new DeployRemapBean(eQResourceType.TRANSPORT, (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME),
                    (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME), null);
            Map<String, Object> otherDetails = new HashMap<>();
            otherDetails.put("oldElementName", topicToPublish);
            otherDetails.put("newElementName", "");
            otherDetails.put("topicType", configData.get(PublishToKafkaConstants.TOPIC_TYPE));
            otherDetails.put("elementType", eQDestinationType.TOPIC.name());
            otherDetails.put(PublishToKafkaConstants.TRANSPORT_TYPE, PublishToKafkaConstants.KAFKA);
            otherDetails.put(PublishToKafkaConstants.CONFIGURATION_TYPE, PublishToKafkaConstants.PRODUCER);
            deployRemapBean.setOtherDetails(otherDetails);
            processRemapInfos.addDeployRemapInfo(eQResourceType.TRANSPORT.name(), deployRemapBean);
        } else {
            processRemapInfos.addDeployRemapInfo(eQResourceType.TRANSPORT.name(), new DeployRemapBean(eQResourceType.TRANSPORT,
                    (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME), (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME), null));
        }
    }

    public void setConfigRemapInfo(RemapInfo completeRemapInfo, Map<String, Object> configData) {
        ProcessRemapInfos completeRemapInfos = ((ProcessRemapInfos) completeRemapInfo);
        String transportName = (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME);
        String topicToPublish = ((List<String>) configData.get(PublishToKafkaConstants.TOPIC)).get(0);
        List<String> newTopicToPublish = new ArrayList<>();
        if (topicToPublish != null && !topicToPublish.isEmpty()) {
            for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.TRANSPORT.name())) {
                if (remapInfo.getOldValue().equals(transportName) &&
                        remapInfo.getOtherDetails() != null
                        && topicToPublish.equals(remapInfo.getOtherDetails().get("oldElementName"))) {
                    configData.put(PublishToKafkaConstants.TRANSPORT_NAME, remapInfo.getNewValue());
                    if(("").equals(remapInfo.getOtherDetails().get("newElementName"))){
                        newTopicToPublish.add((String) remapInfo.getOtherDetails().get("oldElementName"));
                    }else {
                        newTopicToPublish.add((String) remapInfo.getOtherDetails().get("newElementName"));
                    }
                    configData.put(PublishToKafkaConstants.TOPIC, newTopicToPublish);
                    break;
                }
            }
        } else {
            for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.TRANSPORT.name())) {
                if (remapInfo.getOldValue().equals(transportName)) {
                    configData.put(PublishToKafkaConstants.TRANSPORT_NAME, remapInfo.getNewValue());
                    break;
                }
            }
        }
    }

    public List<eQExportEntity> getConfigLinkedResources(Map<String, Object> configData) {
        List<eQExportEntity> exportEntities = new ArrayList<>();
        if (configData != null) {
            String transportName = (String) configData.get(PublishToKafkaConstants.TRANSPORT_NAME);
            if (transportName != null && transportName.length() > 0) {
                try {
                    TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(transportName);
                    if (transportClientBean != null) {
                        exportEntities.add(new eQExportEntity(AdminConsoleConstants.TransferElement.TRANSPORT, transportClientBean.getTransportId().toString()));
                    }
                }catch(BusinessException e){
                    logger.error("Error while fetching Transport");
                }
            }
        }
        return exportEntities;
    }

    /**
     * convert transport client beans to transport UI beans
     * @param transportClientBeans
     * @return
     */
    public List<TransportInfo> convertTransportClientsToTransportInfoBeans(List<TransportClientBean> transportClientBeans){
        List<TransportInfo> transportInfoList = new ArrayList<>(transportClientBeans.size());

        transportClientBeans.forEach(clientBean -> {
            TransportInfo transportInfo = new TransportInfo();
            transportInfo.setTransportId(clientBean.getTransportId());
            transportInfo.setTransportName(clientBean.getName());
            transportInfo.setTopicsToPublish(clientBean.getTopicsToPublish());

            transportInfoList.add(transportInfo);
        });
        return transportInfoList;
    }

    private TransportClientService getTransportClientService(){
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }


    public PublishToKafkaComponentService getPublishToKafkaService() {
        return ServiceRegistry.getInstance().getService(PublishToKafkaConstants.PUBLISH_TO_KAFKA);
    }
}
