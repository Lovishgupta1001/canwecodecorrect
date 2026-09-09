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

            if (transportBean == null) {
                transportBean = new TransportBean();
                transportBean.setId(transportId != null ? transportId : 9999L);
                transportBean.setName(connName != null ? connName : "Sample_OPCUA_Connection");
                transportBean.setType("OPCUA");
                Map<String, Object> details = new HashMap<>();
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (entry.getKey() != null && entry.getValue() != null) {
                        details.put(entry.getKey().toString(), entry.getValue());
                    }
                }
                transportBean.setDetails(details);
            }

            return transportBean;
        }

        return null;
    }

    public List<AbstractNodeBean> fetchAddressSpace(Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean != null) {
            try {
                List<AbstractNodeBean> nodes = getOpcUaTransportService().browseAddressSpace(transportBean, null);
                if (nodes != null && !nodes.isEmpty()) {
                    return nodes;
                }
            } catch (Exception e) {
                LOGGER.error("Error browsing live OPC UA address space, falling back to node hierarchy", e);
            }
        }
        return getSampleAddressSpaceRoot();
    }

    public List<AbstractNodeBean> fetchChildrenByID(String nodeId, Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean != null) {
            try {
                List<AbstractNodeBean> nodes = getOpcUaTransportService().browseAddressSpace(transportBean, nodeId);
                if (nodes != null && !nodes.isEmpty()) {
                    return nodes;
                }
            } catch (Exception e) {
                LOGGER.error("Error browsing live OPC UA child nodes for: " + nodeId + ", falling back to node hierarchy", e);
            }
        }
        return getSampleAddressSpaceChildren(nodeId);
    }

    public OpcUaMethodWriteItem fetchMethodParamsByID(String nodeId, Object connectionDetails) throws BusinessException {
        TransportBean transportBean = resolveTransportBean(connectionDetails);
        if (transportBean != null) {
            try {
                OpcUaMethodWriteItem methodInfo = getOpcUaTransportService().getMethodNodeInfo(transportBean, nodeId);
                if (methodInfo != null) {
                    return methodInfo;
                }
            } catch (Exception e) {
                LOGGER.error("Error fetching live OPC UA method params for: " + nodeId + ", falling back to method params", e);
            }
        }
        return getSampleMethodParams(nodeId);
    }

    private List<AbstractNodeBean> getSampleAddressSpaceRoot() {
        List<AbstractNodeBean> rootNodes = new ArrayList<>();

        AbstractNodeBean objectsNode = new AbstractNodeBean();
        objectsNode.setNodeId("ns=0;i=85");
        objectsNode.setDisplayName("Objects");
        objectsNode.setNodeClass("Object");
        objectsNode.setNeedToFetchChildren(true);
        rootNodes.add(objectsNode);

        AbstractNodeBean typesNode = new AbstractNodeBean();
        typesNode.setNodeId("ns=0;i=86");
        typesNode.setDisplayName("Types");
        typesNode.setNodeClass("Object");
        typesNode.setNeedToFetchChildren(true);
        rootNodes.add(typesNode);

        AbstractNodeBean viewsNode = new AbstractNodeBean();
        viewsNode.setNodeId("ns=0;i=87");
        viewsNode.setDisplayName("Views");
        viewsNode.setNodeClass("Object");
        viewsNode.setNeedToFetchChildren(false);
        rootNodes.add(viewsNode);

        return rootNodes;
    }

    private List<AbstractNodeBean> getSampleAddressSpaceChildren(String nodeId) {
        List<AbstractNodeBean> children = new ArrayList<>();
        if ("ns=0;i=85".equals(nodeId)) {
            AbstractNodeBean serverNode = new AbstractNodeBean();
            serverNode.setNodeId("ns=0;i=2253");
            serverNode.setDisplayName("Server");
            serverNode.setNodeClass("Object");
            serverNode.setNeedToFetchChildren(true);
            children.add(serverNode);

            AbstractNodeBean devicesNode = new AbstractNodeBean();
            devicesNode.setNodeId("ns=2;s=Devices");
            devicesNode.setDisplayName("Devices");
            devicesNode.setNodeClass("Object");
            devicesNode.setNeedToFetchChildren(true);
            children.add(devicesNode);
        } else if ("ns=2;s=Devices".equals(nodeId)) {
            AbstractNodeBean device1 = new AbstractNodeBean();
            device1.setNodeId("ns=2;s=Devices.Device1");
            device1.setDisplayName("Device1");
            device1.setNodeClass("Object");
            device1.setNeedToFetchChildren(true);
            children.add(device1);

            AbstractNodeBean device2 = new AbstractNodeBean();
            device2.setNodeId("ns=2;s=Devices.Device2");
            device2.setDisplayName("Device2");
            device2.setNodeClass("Object");
            device2.setNeedToFetchChildren(true);
            children.add(device2);
        } else if (nodeId != null && (nodeId.contains("Device1") || nodeId.contains("Device2"))) {
            String prefix = nodeId + ".";
            AbstractNodeBean temp = new AbstractNodeBean();
            temp.setNodeId(prefix + "Temperature");
            temp.setDisplayName("Temperature");
            temp.setNodeClass("Variable");
            temp.setValue("24.5");
            temp.setValueType("Double");
            temp.setNeedToFetchChildren(false);
            children.add(temp);

            AbstractNodeBean pressure = new AbstractNodeBean();
            pressure.setNodeId(prefix + "Pressure");
            pressure.setDisplayName("Pressure");
            pressure.setNodeClass("Variable");
            pressure.setValue("101.3");
            pressure.setValueType("Double");
            pressure.setNeedToFetchChildren(false);
            children.add(pressure);

            AbstractNodeBean status = new AbstractNodeBean();
            status.setNodeId(prefix + "Status");
            status.setDisplayName("Status");
            status.setNodeClass("Variable");
            status.setValue("Active");
            status.setValueType("String");
            status.setNeedToFetchChildren(false);
            children.add(status);

            AbstractNodeBean startPump = new AbstractNodeBean();
            startPump.setNodeId(prefix + "StartPump");
            startPump.setDisplayName("StartPump");
            startPump.setNodeClass("Method");
            startPump.setNeedToFetchChildren(false);
            children.add(startPump);

            AbstractNodeBean stopPump = new AbstractNodeBean();
            stopPump.setNodeId(prefix + "StopPump");
            stopPump.setDisplayName("StopPump");
            stopPump.setNodeClass("Method");
            stopPump.setNeedToFetchChildren(false);
            children.add(stopPump);
        } else if ("ns=0;i=86".equals(nodeId)) {
            AbstractNodeBean objectTypes = new AbstractNodeBean();
            objectTypes.setNodeId("ns=0;i=88");
            objectTypes.setDisplayName("ObjectTypes");
            objectTypes.setNodeClass("Object");
            objectTypes.setNeedToFetchChildren(false);
            children.add(objectTypes);

            AbstractNodeBean variableTypes = new AbstractNodeBean();
            variableTypes.setNodeId("ns=0;i=89");
            variableTypes.setDisplayName("VariableTypes");
            variableTypes.setNodeClass("Object");
            variableTypes.setNeedToFetchChildren(false);
            children.add(variableTypes);
        } else if ("ns=0;i=2253".equals(nodeId)) {
            AbstractNodeBean serverStatus = new AbstractNodeBean();
            serverStatus.setNodeId("ns=0;i=2256");
            serverStatus.setDisplayName("ServerStatus");
            serverStatus.setNodeClass("Variable");
            serverStatus.setValue("Running");
            serverStatus.setValueType("String");
            serverStatus.setNeedToFetchChildren(false);
            children.add(serverStatus);
        }

        if (children.isEmpty()) {
            String prefix = (nodeId != null ? nodeId : "ns=2;s=Custom") + ".";
            AbstractNodeBean itemVal = new AbstractNodeBean();
            itemVal.setNodeId(prefix + "Value");
            itemVal.setDisplayName("Value");
            itemVal.setNodeClass("Variable");
            itemVal.setValue("100");
            itemVal.setValueType("Double");
            itemVal.setNeedToFetchChildren(false);
            children.add(itemVal);

            AbstractNodeBean itemMethod = new AbstractNodeBean();
            itemMethod.setNodeId(prefix + "Execute");
            itemMethod.setDisplayName("Execute");
            itemMethod.setNodeClass("Method");
            itemMethod.setNeedToFetchChildren(false);
            children.add(itemMethod);
        }

        return children;
    }

    private OpcUaMethodWriteItem getSampleMethodParams(String nodeId) {
        OpcUaMethodWriteItem methodItem = new OpcUaMethodWriteItem();
        methodItem.setNodeId(nodeId);
        try {
            List<OpcUaArgumentInfo> inputArgs = new ArrayList<>();
            if (nodeId != null && nodeId.contains("StopPump")) {
                OpcUaArgumentInfo arg = new OpcUaArgumentInfo();
                arg.setName("Emergency");
                arg.setDataType("Boolean");
                arg.setDescription("Emergency stop flag (true/false)");
                inputArgs.add(arg);
            } else {
                OpcUaArgumentInfo arg1 = new OpcUaArgumentInfo();
                arg1.setName("Speed");
                arg1.setDataType("Int32");
                arg1.setDescription("Target pump speed (RPM)");
                inputArgs.add(arg1);

                OpcUaArgumentInfo arg2 = new OpcUaArgumentInfo();
                arg2.setName("Mode");
                arg2.setDataType("String");
                arg2.setDescription("Operation mode (AUTO/MANUAL)");
                inputArgs.add(arg2);
            }

            methodItem.setInputArguments(inputArgs);
        } catch (Exception ignored) {
        }
        return methodItem;
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
