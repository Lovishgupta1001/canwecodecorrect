/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.helper; 

import com.eqtechnologic.eqube.commonconnection.service.CommonConnectionService; 
import com.eqtechnologic.eqube.commonconnection.service.constants.CommonConnectionConstants; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.ConnectionConfigClientService; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionConfigurationView; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.util.ConnectionConfigClientUtil; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionPropertiesView; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 

import java.util.ArrayList; 
import java.util.List; 
import java.util.Map; 

/** 
 * Helper class for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorHelper { 

    private static final Logger LOGGER = Logger.getLogger(DeviceConnectorHelper.class.getName()); 

    private DeviceConnectorHelper() { 
        // Private constructor 
    } 

    public static List<Long> getConnectionList() throws BusinessException { 
        List<Long> connectionIds = new ArrayList<>(); 
        List<ConnectionConfigurationView> connectionConfigurationViewList = getCommonConnectionService().fetchAllAccessibleConn(); 
        if (connectionConfigurationViewList != null) { 
            for (ConnectionConfigurationView configurationView : connectionConfigurationViewList) { 
                if (configurationView != null 
                        && !configurationView.isPluginBased() 
                        && DeviceConnectorConstants.DEVICE_CONNECTOR.equalsIgnoreCase(configurationView.getPluginDisplayName())) { 
                    connectionIds.add(configurationView.getConnectionId()); 
                } 
            } 
        } 
        return connectionIds; 
    } 

    private static ConnectionConfigClientService getConnectionConfigurationClient() { 
        return ServiceRegistry.getInstance().getService(ConnectionConfigClientUtil.CONNECTION_CONFIGURATION_CLIENT_SERVICE_NAME); 
    } 

    public static DeviceConnectorValidationResult validateConnection(Long connId, List<String> allowedConnectionTypes) { 
        DeviceConnectorValidationResult result = new DeviceConnectorValidationResult(); 
        result.setValid(false); 

        if (connId == null || connId <= 0) { 
            result.setMessage("Connection ID is required."); 
            return result; 
        } 

        ConnectionConfigurationView configuration; 
        try { 
            configuration = getConnectionConfigurationClient().fetch(connId); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred while fetching connection: " + connId), e); 
            result.setMessage("Failed to retrieve connection details."); 
            return result; 
        } 

        if (configuration == null) { 
            result.setMessage("Connection configuration not found."); 
            return result; 
        } 

        String connType = null; 
        if (configuration.getConnectionProperties() != null) { 
            ConnectionPropertiesView view = configuration.getConnectionProperties().get("deviceType"); 
            if (view != null && view.getPropertyValue() != null && !view.getPropertyValue().trim().isEmpty()) { 
                connType = view.getPropertyValue().trim(); 
            } 
        } 
        result.setConnectionType(connType != null ? connType : ""); 
        result.setConnectionName(configuration.getConnectionName()); 

        if (allowedConnectionTypes != null && !allowedConnectionTypes.isEmpty()) { 
            final String finalConnType = connType != null ? connType : ""; 
            boolean typeMatched = allowedConnectionTypes.stream().anyMatch(type -> 
                type != null && (type.equalsIgnoreCase(finalConnType) || 
                                 type.replace("_", "").equalsIgnoreCase(finalConnType.replace("_", ""))) 
            ); 
            result.setConnectionTypeValid(typeMatched); 
            result.setValid(typeMatched); 
            if (!typeMatched) { 
                result.setMessage("Connection type '" + connType + "' is not allowed. Supported: " + String.join(", ", allowedConnectionTypes)); 
            } 
        } else { 
            result.setConnectionTypeValid(true); 
            result.setValid(true); 
        } 

        return result; 
    } 

    private static CommonConnectionService getCommonConnectionService() { 
        return ServiceRegistry.getInstance().getService(CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
    } 
}
