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

import com.eqtechnologic.eqube.certificate.environment.constants.EnvironmentSubType;
import com.eqtechnologic.eqube.certificatemanagement.beans.EncryptionBean;
import com.eqtechnologic.eqube.certificatemanagement.service.CertificateManagementService;
import com.eqtechnologic.eqube.commoncomponents.enums.eQResourceType;
import com.eqtechnologic.eqube.deploymanagement.beans.DeployRemapBean;
import com.eqtechnologic.eqube.eQUtil;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.publish.bean.QueueInfo;
import com.eqtechnologic.eqube.mi.activities.publish.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.mi.enums.eQDestinationType;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.ProcessRemapInfos;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.eQExportEntity;
import com.eqtechnologic.eqube.mi.processhintgeneration.beans.eQIMetaDataDetails;
import com.eqtechnologic.eqube.mi.processhintgeneration.beans.eQListDetails;
import com.eqtechnologic.eqube.mi.util.AdminConsoleConstants;
import com.eqtechnologic.eqube.platform.transport.client.beans.JMSClientInfoBean;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Helper methods required for Publish Component
 * @author vikas
 * @since 5.4
 */
@Component
class PublishComponentServiceHelper {

    private static final String CONNECTION_COMBOBOX = "connectionCombobox";
    private static final String OLD_ELEMENT_NAME = "oldElementName";
    private static final String NEW_ELEMENT_NAME = "newElementName";
    private static final String ELEMENT_TYPE = "elementType";
    private static Logger logger;
    static {
        logger = Logger.getLogger(PublishComponentServiceHelper.class.getName());
    }

    private static CertificateManagementService getCertificateManagementService() {
        return ServiceRegistry.getInstance().getService("certificateManagementService");
    }

    void calculateConfigRemapInfo(RemapInfo completeRemapInfo, Map<String, Object> configData) {

        ProcessRemapInfos processRemapInfos = (ProcessRemapInfos) completeRemapInfo;
        if ((Boolean) configData.get("connectionRadio")) {
            processRemapInfos.addDeployRemapInfo(eQResourceType.CONNECTION.name(), new DeployRemapBean(eQResourceType.CONNECTION, (String) configData.get(CONNECTION_COMBOBOX), (String) configData.get(CONNECTION_COMBOBOX), null));
        } else if ((Boolean) configData.get("transportRadio")) {
            String strTransportName = (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX);
            if (strTransportName != null && !strTransportName.trim().isEmpty()) {
                Object publishVar = configData.get(eQPublishConstants.PUBLISH_VAR);
                if (publishVar == null || publishVar.toString().equals(eQPublishConstants.STATIC)) {
                    calculateTransportRemapInfo(processRemapInfos, configData);
                }
            }

            String authorizationType = (String) configData.get("cmbAuthorizationtype");
            Map credentialMap = (Map) configData.get("authorizationCredentialVariable");
            String decryptor = null;
            if (credentialMap != null) {
                decryptor = (String) credentialMap.get("cmbDecryptor");
            }
            if (eQPublishConstants.CREDENTIAL_AS_VARIABLE.equals(authorizationType) && !eQPublishConstants.DEFAULT_DECRYPTOR.equals(decryptor)) {
                processRemapInfos.addDeployRemapInfo(eQResourceType.ENCRYPTION.name(), new DeployRemapBean(eQResourceType.ENCRYPTION, decryptor, decryptor, null));
            }
        }
    }

    private void calculateTransportRemapInfo(ProcessRemapInfos processRemapInfos, Map<String, Object> configData) {
        String sDestType = (String) configData.get("destType");
        String destination = (String) configData.get("destination");
        if (sDestType == null || sDestType.trim().isEmpty()) {
            if (destination != null && !destination.isEmpty()) {
                DeployRemapBean deployRemapBean = new DeployRemapBean(eQResourceType.TRANSPORT, (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX),
                        (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX), null);
                Map<String, Object> otherDetails = new HashMap<>();
                otherDetails.put(OLD_ELEMENT_NAME, destination);
                otherDetails.put(NEW_ELEMENT_NAME, "");
                otherDetails.put(ELEMENT_TYPE, eQDestinationType.TOPIC.name());
                deployRemapBean.setOtherDetails(otherDetails);
                processRemapInfos.addDeployRemapInfo(eQResourceType.TRANSPORT.name(), deployRemapBean);
            } else {
                DeployRemapBean deployRemapBean = new DeployRemapBean(eQResourceType.TRANSPORT, (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX),
                        (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX), null);
                Map<String, Object> otherDetails = new HashMap<>();
                otherDetails.put(eQPublishConstants.TRANSPORT_TYPE, eQPublishConstants.HTTP);
                deployRemapBean.setOtherDetails(otherDetails);
                processRemapInfos.addDeployRemapInfo(eQResourceType.TRANSPORT.name(),deployRemapBean );
               /* processRemapInfos.addDeployRemapInfo(eQResourceType.TRANSPORT.name(), new DeployRemapBean(eQResourceType.TRANSPORT,
                        (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX), (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX), null));*/
            }
        } else {
            DeployRemapBean deployRemapBean = new DeployRemapBean(eQResourceType.TRANSPORT, (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX),
                    (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX), null);
            Map<String, Object> otherDetails = new HashMap<>();
            otherDetails.put(OLD_ELEMENT_NAME, destination);
            otherDetails.put(NEW_ELEMENT_NAME, "");
            if (sDestType.equals(eQDestinationType.TOPIC.toString())) {
                otherDetails.put(ELEMENT_TYPE, eQDestinationType.TOPIC.name());
            } else if (sDestType.equals(eQDestinationType.QUEUE.toString())) {
                otherDetails.put(ELEMENT_TYPE, eQDestinationType.QUEUE.name());
            }
            otherDetails.put(eQPublishConstants.TRANSPORT_TYPE,eQPublishConstants.JMS);
            otherDetails.put(eQPublishConstants.CONFIGURATION_TYPE, eQPublishConstants.PUBLISHER);
            deployRemapBean.setOtherDetails(otherDetails);
            processRemapInfos.addDeployRemapInfo(eQResourceType.TRANSPORT.name(), deployRemapBean);
        }
    }

    void setConfigRemapInfo(RemapInfo completeRemapInfo, Map<String, Object> configData) {
        ProcessRemapInfos completeRemapInfos = ((ProcessRemapInfos) completeRemapInfo);
        if ((Boolean) configData.get("connectionRadio")) {
            String sTransportName = (String) configData.get(CONNECTION_COMBOBOX);
            for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.CONNECTION.name())) {
                if (remapInfo.getOldValue().equals(sTransportName)) {
                    configData.put(CONNECTION_COMBOBOX, remapInfo.getNewValue());
                    break;
                }
            }
        } else if ((Boolean) configData.get("transportRadio")) {
            String sTransportName = (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX);
            String sDestType = (String) configData.get("destType");
            String sElementName = (String) configData.get("destination");
            if (sDestType == null || sDestType.trim().isEmpty()) {
                if (sElementName != null && !sElementName.isEmpty()) {
                    for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.TRANSPORT.name())) {
                        if (remapInfo.getOldValue().equals(sTransportName) &&
                                remapInfo.getOtherDetails() != null
                                && sElementName.equals(remapInfo.getOtherDetails().get(OLD_ELEMENT_NAME))) {
                            configData.put(eQPublishConstants.TRANSPORT_COMBOBOX, remapInfo.getNewValue());
                            configData.put("destination", remapInfo.getOtherDetails().get(NEW_ELEMENT_NAME));
                            break;
                        }
                    }
                } else {
                    for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.TRANSPORT.name())) {
                        if (remapInfo.getOldValue().equals(sTransportName)) {
                            configData.put(eQPublishConstants.TRANSPORT_COMBOBOX, remapInfo.getNewValue());
                            break;
                        }
                    }
                }
            } else {
                for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.TRANSPORT.name())) {
                    if (remapInfo.getOldValue().equals(sTransportName) &&
                            remapInfo.getOtherDetails() != null
&& sDestType.equals(remapInfo.getOtherDetails().get(ELEMENT_TYPE))
                            && sElementName.equals(remapInfo.getOtherDetails().get(OLD_ELEMENT_NAME))) {
                        configData.put(eQPublishConstants.TRANSPORT_COMBOBOX, remapInfo.getNewValue());
                        configData.put("destination", remapInfo.getOtherDetails().get(NEW_ELEMENT_NAME));
                        break;
                    }
                }
            }
            String authorizationType = (String) configData.get("cmbAuthorizationtype");
            if (eQPublishConstants.CREDENTIAL_AS_VARIABLE.equals(authorizationType)) {
                Map credentialMap = (Map) configData.get("authorizationCredentialVariable");
                if (credentialMap != null) {
                    String decryptor = (String) credentialMap.get("cmbDecryptor");
                    for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.ENCRYPTION.name())) {
                        if (remapInfo.getOldValue().equals(decryptor)) {
                            credentialMap.put("cmbDecryptor", remapInfo.getNewValue());
                            break;
                        }
                    }
                }
            }
        }
    }

    private TransportClientService getTransportClientService(){
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }

    List<eQExportEntity> getConfigLinkedResources(Map<String, Object> configData) {
        List<eQExportEntity> exportEntities = new ArrayList<eQExportEntity>();
        if (configData != null) {
            String authorizationType = (String) configData.get("cmbAuthorizationtype");
            String strTransportName = (String) configData.get(eQPublishConstants.TRANSPORT_COMBOBOX);
            if (eQPublishConstants.CREDENTIAL_AS_VARIABLE.equals(authorizationType)) {
                Map credentialMap = (Map) configData.get("authorizationCredentialVariable");
                String keyConfigName = (String) credentialMap.get("cmbDecryptor");
                try {
                if (!eQPublishConstants.DEFAULT_DECRYPTOR.equals(keyConfigName) && !getCertificateManagementService().isDefaultConfiguration(keyConfigName)) {
                    EncryptionBean encryptionBean = getCertificateManagementService().getkeyConfiguration(keyConfigName);
                    if (!eQUtil.isNullOrEmpty(encryptionBean)) {
                        exportEntities.add(new eQExportEntity(getTransferElementType(encryptionBean),
                                encryptionBean.getId().toString()));
                    }
                }
                } catch (BusinessException e) {
                    LogTemplate logTemplate = LogTemplate.of("Error while getting linked resources for " +
                            "publish activity, cannot populate key configuration - " + keyConfigName);
                    logger.error(logTemplate, e);
                }
            }

            if (strTransportName != null && strTransportName.length() > 0) {
                try {
                    TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(strTransportName);
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

    String fetchTransportTypeByName(String transportName) throws BusinessException{
        List<TransportClientBean> transportClientBeans = new ArrayList<>(getTransportClientService().getTransportDetails().values());
        for (TransportClientBean transportClientBean : transportClientBeans) {
            if (transportClientBean.getName().equals(transportName)) {
                return transportClientBean.getTransportType();
            }
        }
        return "";

    }
    public void postFetchConfiguration(Map configData) {
        if (configData.get("transportTypeCombobox") == null) {
            String transportName = configData.get("transportCombobox") != null ? (String) configData.get("transportCombobox") : null;
            try {
                configData.put("transportTypeCombobox", fetchTransportTypeByName(transportName));
            }catch(BusinessException e){
                logger.error("Error while fetching Transport");
            }
        }

    }
    /**
     * (non-Javadoc)
     *
     * @param encryptionBean
     * @return TransferElement
     */
    private AdminConsoleConstants.TransferElement getTransferElementType(EncryptionBean encryptionBean) {
        AdminConsoleConstants.TransferElement transferElement = null;
        if (encryptionBean.getSubType().equals(EnvironmentSubType.SYMMETRIC_KEY)) {
            transferElement = AdminConsoleConstants.TransferElement.SYMMETRIC_KEY;
        } else if (encryptionBean.getSubType().equals(EnvironmentSubType.ASYMMETRIC_KEY)) {
            transferElement = AdminConsoleConstants.TransferElement.ASYMMETRIC_KEY;
        } else {
            transferElement = AdminConsoleConstants.TransferElement.CERTIFICATE;
        }
        return transferElement;
    }

    eQIMetaDataDetails getOutPutDetails(String id) {
        eQIMetaDataDetails details = null;
        if (id.equals(eQPublishConstants.PUBLISH_NON_REF_ATTACHMENT)) {
            details = new eQListDetails(new ArrayList<String>(1));
        }
        return details;
    }

    public PublishComponentService getPublishService() {
        return ServiceRegistry.getInstance().getService(eQPublishConstants.PUBLISH_SERVICE);
    }

    public List<TransportInfo> convertTransportClientToTransportInfoBeanList(String transportType, List<TransportClientBean> transportClientBeans){

        return transportClientBeans.stream().filter(clientBean -> clientBean.getTransportType().equalsIgnoreCase(transportType))
                .map(transportClientBean -> {
                    TransportInfo transportInfo = new TransportInfo();

                    transportInfo.setName(transportClientBean.getName());
                    transportInfo.setTransportId(transportClientBean.getTransportId());

                    if(TransportClientConstants.JMS_TYPE.equalsIgnoreCase(transportType)){
                        JMSClientInfoBean jmsClientInfoBean = transportClientBean.getJmsClientInfoBean();
                        this.setQueueInfo(transportInfo, jmsClientInfoBean);
                        transportInfo.setTopics(jmsClientInfoBean.getTopicNamesToPublish());

                    } else if (TransportClientConstants.HTTP_TYPE.equalsIgnoreCase(transportType)) {
                        transportInfo.setHttpPublishURL(transportClientBean.getHttpPublishURL());
                    }
                    return transportInfo;

                }).collect(Collectors.toList());


    }

    private void setQueueInfo(TransportInfo transportInfo, JMSClientInfoBean jmsClientInfoBean) {
        if (TransportClientConstants.AWS_SQS_JMS_PROVIDER.equals(jmsClientInfoBean.getJmsProviderName())) {
            transportInfo.setQueues(jmsClientInfoBean.getQueueNamesToPublish().stream().map(queueName -> {
                QueueInfo queueInfo;
                if (queueName != null && queueName.endsWith(TransportClientConstants.FIFO_QUEUE_SUFFIX)) {
                    queueInfo = new QueueInfo(queueName, TransportClientConstants.FIFO_QUEUE_TYPE);
                } else {
                    queueInfo = new QueueInfo(queueName);
                }
                return queueInfo;
            }).collect(Collectors.toList()));
        } else {
            transportInfo.setQueues(jmsClientInfoBean.getQueueNamesToPublish().stream().map(QueueInfo::new).collect(Collectors.toList()));
        }
    }


}
