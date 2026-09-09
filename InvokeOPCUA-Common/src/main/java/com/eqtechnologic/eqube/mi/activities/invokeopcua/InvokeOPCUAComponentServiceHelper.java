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

import com.eqtechnologic.eqube.commoncomponents.enums.eQResourceType;
import com.eqtechnologic.eqube.crypto.CipherManager;
import com.eqtechnologic.eqube.crypto.model.Cipher;
import com.eqtechnologic.eqube.deploymanagement.beans.DeployRemapBean;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.constants.InvokeOPCUAConstants;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.exception.InvokeOPCUAErrorCode;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.exception.InvokeOPCUAExceptionType;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.ProcessRemapInfos;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.eQExportEntity;
import com.eqtechnologic.eqube.mi.util.AdminConsoleConstants;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.transport.bean.TransportBean;
import com.eqtechnologic.eqube.transport.constants.TransportServiceConstants;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.AbstractNodeBean;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaArgumentInfo;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaEventField;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaMethodWriteItem;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaNodeReference;
import com.eqtechnologic.eqube.transport.opcuatransport.bo.beans.OpcUaTransportInfoBean;
import com.eqtechnologic.eqube.transport.opcuatransport.service.OpcUaTransportService;
import com.eqtechnologic.eqube.transport.opcuatransport.service.constants.OpcUaTransportServiceConstants;
import com.eqtechnologic.eqube.transport.service.TransportService;
import com.eqtechnologic.eqube.transport.uiservice.TransportConstant;
import com.eqtechnologic.eqube.transport.uiservice.beans.OPCUATransportInfoBean;
import com.eqtechnologic.eqube.transport.uiservice.beans.TransportAbstractUIBean;
import com.eqtechnologic.eqube.transport.uiservice.beans.opcua.OPCUAEventFieldBean;
import com.eqtechnologic.eqube.transport.uiservice.beans.opcua.OPCUAEventTypeBean;
import org.apache.commons.lang3.StringEscapeUtils;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Helper methods required for Invoke OPC UA Component
 *
 * @author Lovish
 */
@Component
public class InvokeOPCUAComponentServiceHelper {

    private static final Logger LOGGER = Logger.getLogger(InvokeOPCUAComponentServiceHelper.class.getName());

    public InvokeOPCUAComponentService getInvokeOPCUAService() {
        return ServiceRegistry.getInstance().getService(InvokeOPCUAConstants.INVOKE_OPCUA);
    }

    private TransportService getTransportService() {
        return ServiceRegistry.getInstance().getService(TransportServiceConstants.SERVICE_NAME);
    }

    private OpcUaTransportService getOpcUaTransportService() {
        return ServiceRegistry.getInstance().getService(OpcUaTransportServiceConstants.SERVICE_NAME);
    }

    private ConversionService getConversionService() {
        return ServiceRegistry.getInstance().getService("conversionService");
    }

    private TransportClientService getTransportClientService() {
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }

    public static String decodeUIContent(String content) {
        if (content != null && !content.isEmpty()) {
            return StringEscapeUtils.unescapeHtml4(content);
        } else {
            return content;
        }
    }

    public static void addPasswordInDetails(TransportAbstractUIBean transportInfoUIBean, TransportBean transportBean, String existingPwd) {
        if (transportBean != null && transportInfoUIBean != null && transportInfoUIBean.getPassword() != null && transportInfoUIBean.getPassword().trim().length() > 0) {
            String pwd = transportInfoUIBean.getPassword();
            String symmetric = CipherManager.getCryptoImpl().getDefaultSymmetricAliasForDAO();
            Cipher cipherService = CipherManager.getCipher(symmetric);
            if (!TransportConstant.DUMMY_PASSWORD_STRING.equals(pwd)) {
                String encPwd = cipherService.encrypt(pwd, null);
                transportBean.getDetails().put(TransportConstant.PASSWORD_TEXT_BOX, encPwd);
            } else if (existingPwd != null && existingPwd.trim().length() > 0) {
                transportBean.getDetails().put(TransportConstant.PASSWORD_TEXT_BOX, existingPwd);
            }
        }
    }

    public static String setExistingPasswordValue(TransportBean existingTransport) {
        String existingPWD = "";
        if (existingTransport != null && existingTransport.getDetails() != null && existingTransport.getDetails().get(TransportConstant.PASSWORD_TEXT_BOX) != null) {
            existingPWD = existingTransport.getDetails().get(TransportConstant.PASSWORD_TEXT_BOX).toString();
        }
        return existingPWD;
    }

    public TransportBean resolveTransportBean(Object connectionObj) {
        if (connectionObj == null) {
            return null;
        }

        if (connectionObj instanceof TransportBean) {
            return (TransportBean) connectionObj;
        }

        if (connectionObj instanceof TransportAbstractUIBean) {
            TransportAbstractUIBean uiBean = (TransportAbstractUIBean) connectionObj;
            TransportBean existingTransport = null;
            if (uiBean.getId() != null && uiBean.getId() > 0) {
                try {
                    existingTransport = getTransportService().getTransportBean(uiBean.getId());
                } catch (Exception e) {
                    LOGGER.error("Could not fetch TransportBean by id: " + uiBean.getId(), e);
                }
            }
            ConversionService conversionService = getConversionService();
            TransportBean transportBean = conversionService != null ? conversionService.convert(uiBean, TransportBean.class) : null;
            if (existingTransport != null) {
                String existingPWD = setExistingPasswordValue(existingTransport);
                if (transportBean != null) {
                    addPasswordInDetails(uiBean, transportBean, existingPWD);
                } else {
                    transportBean = existingTransport;
                }
            }
            return transportBean;
        }

        if (connectionObj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) connectionObj;
            Long transportId = null;
            Object idObj = map.get("id");
            if (idObj == null) idObj = map.get("connectionId");
            if (idObj == null) idObj = map.get("transportId");

            if (idObj instanceof Number) {
                transportId = ((Number) idObj).longValue();
            } else if (idObj instanceof String) {
                try {
                    transportId = Long.parseLong((String) idObj);
                } catch (NumberFormatException ignored) {
                }
            }

            String connName = (String) map.get("name");
            if (connName == null) connName = (String) map.get("connectionName");
            if (connName == null) connName = (String) map.get("connectionComboBox");

            TransportBean transportBean = null;
            if (transportId != null && transportId > 0) {
                try {
                    transportBean = getTransportService().getTransportBean(transportId);
                } catch (Exception e) {
                    LOGGER.error("Could not find TransportBean for ID: " + transportId, e);
                }
            }

            if (transportBean == null && connName != null && !connName.trim().isEmpty()) {
                try {
                    TransportClientBean clientBean = getTransportClientService().getTransportDetail(connName);
                    if (clientBean != null && clientBean.getTransportId() != null) {
                        transportBean = getTransportService().getTransportBean(clientBean.getTransportId());
                    }
                } catch (Exception e) {
                    LOGGER.error("Could not find TransportBean for name: " + connName, e);
                }
            }

            if (transportBean == null) {
                try {
                    List<TransportBean> allTransports = getTransportService().getAllTransportBeans();
                    if (allTransports != null && !allTransports.isEmpty()) {
                        for (TransportBean bean : allTransports) {
                            if (connName != null && connName.equalsIgnoreCase(bean.getName())) {
                                transportBean = bean;
                                break;
                            }
                        }
                        if (transportBean == null) {
                            for (TransportBean bean : allTransports) {
                                if ("OPCUA".equalsIgnoreCase(bean.getType()) || (bean.getType() != null && bean.getType().toUpperCase().contains("OPC"))) {
                                    transportBean = bean;
                                    break;
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    LOGGER.error("Could not query all transport beans for OPC UA fallback", e);
                }
            }

            return transportBean;
        }

        return null;
    }

    public List<AbstractNodeBean> fetchAddressSpace(Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean == null) {
            throw new BusinessException(InvokeOPCUAErrorCode.INVALID_INPUT, "Please select a valid OPC UA connection.");
        }
        try {
            List<AbstractNodeBean> nodes = getOpcUaTransportService().browseAddressSpace(transportBean, null);
            return nodes != null ? nodes : Collections.emptyList();
        } catch (Exception e) {
            LOGGER.error("Error browsing live OPC UA address space for transport: " + transportBean.getName(), e);
            throw new BusinessException(InvokeOPCUAErrorCode.CANNOT_READ_OPCUA_NODE, "Error browsing OPC UA address space: " + e.getMessage(), e);
        }
    }

    public List<AbstractNodeBean> fetchChildrenByID(String nodeId, Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean == null) {
            throw new BusinessException(InvokeOPCUAErrorCode.INVALID_INPUT, "Please select a valid OPC UA connection.");
        }
        try {
            List<AbstractNodeBean> nodes = getOpcUaTransportService().browseAddressSpace(transportBean, nodeId);
            return nodes != null ? nodes : Collections.emptyList();
        } catch (Exception e) {
            LOGGER.error("Error browsing live OPC UA child nodes for: " + nodeId, e);
            throw new BusinessException(InvokeOPCUAErrorCode.CANNOT_READ_OPCUA_NODE, "Error browsing OPC UA child nodes for nodeId: " + nodeId + " - " + e.getMessage(), e);
        }
    }

    public OpcUaMethodWriteItem fetchMethodParamsByID(String nodeId, Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean == null) {
            throw new BusinessException(InvokeOPCUAErrorCode.INVALID_INPUT, "Please select a valid OPC UA connection.");
        }
        try {
            return getOpcUaTransportService().getMethodNodeInfo(transportBean, nodeId);
        } catch (Exception e) {
            LOGGER.error("Error fetching live OPC UA method params for: " + nodeId, e);
            throw new BusinessException(InvokeOPCUAErrorCode.CANNOT_READ_OPCUA_NODE, "Error fetching method parameters for nodeId: " + nodeId + " - " + e.getMessage(), e);
        }
    }

    public Map<String, Object> fetchServerEventFieldsAndTypes(Object connectionDetails) throws BusinessException {
        Map<String, Object> result = new HashMap<>();
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean != null) {
            try {
                List<OpcUaNodeReference> eventTypes = getOpcUaTransportService().getAvailableEventTypes(transportBean);
                ConversionService conversionService = getConversionService();
                if (conversionService != null && eventTypes != null) {
                    List<OPCUAEventTypeBean> convertedEventTypes = (List<OPCUAEventTypeBean>) conversionService.convert(
                            eventTypes,
                            TypeDescriptor.collection(List.class, TypeDescriptor.valueOf(OpcUaNodeReference.class)),
                            TypeDescriptor.collection(List.class, TypeDescriptor.valueOf(OPCUAEventTypeBean.class)));
                    result.put("eventTypes", convertedEventTypes);
                } else {
                    result.put("eventTypes", eventTypes);
                }

                List<OpcUaEventField> eventFields = getOpcUaTransportService().getAvailableEventFields(transportBean);
                if (conversionService != null && eventFields != null) {
                    List<OPCUAEventFieldBean> convertedEventFields = (List<OPCUAEventFieldBean>) conversionService.convert(
                            eventFields,
                            TypeDescriptor.collection(List.class, TypeDescriptor.valueOf(OpcUaEventField.class)),
                            TypeDescriptor.collection(List.class, TypeDescriptor.valueOf(OPCUAEventFieldBean.class)));
                    result.put("eventFields", convertedEventFields);
                } else {
                    result.put("eventFields", eventFields);
                }
                return result;
            } catch (Exception e) {
                LOGGER.error("Error while fetching server event fields and types", e);
            }
        }
        result.put("eventTypes", Collections.emptyList());
        result.put("eventFields", Collections.emptyList());
        return result;
    }

    public String fetchEnrichedMessageByID(String nodeId, String parentNodeId, List<String> enrichmentPath, Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean != null) {
            return getOpcUaTransportService().getEnrichedMessage(transportBean, nodeId, parentNodeId, enrichmentPath);
        }
        return "";
    }

    public Boolean validateMethodWriteItem(String nodeId, String objectNodeId, Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean != null) {
            return getOpcUaTransportService().validateMethodWriteItem(transportBean, nodeId, objectNodeId);
        }
        return true;
    }

    public OPCUATransportInfoBean fetchOPCUATransportInfo() {
        try {
            OpcUaTransportInfoBean boInfoBean = getOpcUaTransportService().getOpcUaTransportInfo();
            ConversionService conversionService = getConversionService();
            if (conversionService != null && boInfoBean != null) {
                return conversionService.convert(boInfoBean, OPCUATransportInfoBean.class);
            }
        } catch (Exception e) {
            LOGGER.error("Error fetching OPC UA transport info", e);
        }
        return null;
    }

    public List<String> fetchConfiguredKeystores() {
        try {
            return getOpcUaTransportService().fetchKeystores();
        } catch (Exception e) {
            LOGGER.error("Error fetching configured keystores", e);
            return Collections.emptyList();
        }
    }

    List<eQExportEntity> getConfigLinkedResources(Map<String, Object> configData) {
        List<eQExportEntity> exportEntities = new ArrayList<>();
        if (configData != null) {
            String strConnName = (String) configData.get(InvokeOPCUAConstants.CONNECTION_COMBOBOX);
            if (strConnName == null || strConnName.trim().isEmpty()) {
                strConnName = (String) configData.get(InvokeOPCUAConstants.SELECT_CONNECTION);
            }
            if (strConnName == null || strConnName.trim().isEmpty()) {
                strConnName = (String) configData.get(InvokeOPCUAConstants.CONNECTION_NAME);
            }
            if (strConnName != null && !strConnName.isEmpty()) {
                try {
                    TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(strConnName);
                    if (transportClientBean != null) {
                        exportEntities.add(new eQExportEntity(AdminConsoleConstants.TransferElement.CONNECTION, transportClientBean.getTransportId().toString()));
                    }
                } catch (BusinessException e) {
                    LOGGER.error("Error while fetching Connection");
                }
            }
        }

        return exportEntities;
    }

    void calculateConfigRemapInfo(RemapInfo completeRemapInfo, Map<String, Object> configData) {
        ProcessRemapInfos processRemapInfos = (ProcessRemapInfos) completeRemapInfo;
        String strConnName = (String) configData.get(InvokeOPCUAConstants.CONNECTION_COMBOBOX);
        if (strConnName == null || strConnName.trim().isEmpty()) {
            strConnName = (String) configData.get(InvokeOPCUAConstants.CONNECTION_NAME);
        }
        if (strConnName != null && !strConnName.trim().isEmpty()) {
            DeployRemapBean deployRemapBean = new DeployRemapBean(eQResourceType.CONNECTION, strConnName, strConnName, null);
            processRemapInfos.addDeployRemapInfo(eQResourceType.CONNECTION.name(), deployRemapBean);
        }
    }

    void setConfigRemapInfo(RemapInfo completeRemapInfo, Map<String, Object> configData) {
        ProcessRemapInfos completeRemapInfos = ((ProcessRemapInfos) completeRemapInfo);
        String strConnName = (String) configData.get(InvokeOPCUAConstants.CONNECTION_COMBOBOX);
        if (strConnName == null || strConnName.trim().isEmpty()) {
            strConnName = (String) configData.get(InvokeOPCUAConstants.CONNECTION_NAME);
        }
        for (DeployRemapBean remapInfo : completeRemapInfos.getDeployRemapInfo(eQResourceType.CONNECTION.name())) {
            if (remapInfo.getOldValue().equals(strConnName)) {
                configData.put(InvokeOPCUAConstants.CONNECTION_COMBOBOX, remapInfo.getNewValue());
                configData.put(InvokeOPCUAConstants.CONNECTION_NAME, remapInfo.getNewValue());
                break;
            }
        }
    }
}
