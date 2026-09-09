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
import com.eqtechnologic.eqube.deploymanagement.beans.DeployRemapBean;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.constants.InvokeOPCUAConstants;
import com.eqtechnologic.eqube.mi.component.service.RemapInfo;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.ProcessRemapInfos;
import com.eqtechnologic.eqube.mi.mdtransfer.beans.eQExportEntity;
import com.eqtechnologic.eqube.mi.util.AdminConsoleConstants;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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

    private TransportClientService getTransportClientService() {
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
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
