/** 
 * @(#)eQubeMI version 5.3 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.helper; 

import com.eqtechnologic.eqube.commonconnection.service.CommonConnectionService; 
import com.eqtechnologic.eqube.commonconnection.service.constants.CommonConnectionConstants; 
import com.eqtechnologic.eqube.commonconnection.service.constants.ConnectionConfigurationContants; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.ConnectionConfigClientService; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionConfigurationView; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionPropertiesView; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.util.ConnectionConfigClientUtil; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.ConnectionValidationResult; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 
import com.eqtechnologic.eqube.connectionconfiguration.bean.ConnectionConfigurationBean; 
import com.eqtechnologic.eqube.connectionconfiguration.service.ConnectionConfigurationService; 
import com.eqtechnologic.eqube.connectionconfiguration.startup.ConnectionServiceInitializer; 

import java.util.*; 

import static com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants.PLUGIN_NAME; 
import static com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants.PLUGIN_REMOTE_NAME; 

public class FileSystemHelper { 

    private static final Logger LOGGER; 
    static { 
        LOGGER = Logger.getLogger(FileSystemHelper.class.getName()); 
    } 
    private FileSystemHelper(){ 

    } 
    public static List<Long> getConnectionList() throws BusinessException{ 
        List<Long> connectionIds = new ArrayList<>(); 
        List<ConnectionConfigurationView> connectionConfigurationViewList = getCommonConnectionService().fetchAllApplicationConnections(false); 
        for (ConnectionConfigurationView configurationView : connectionConfigurationViewList) { 
            connectionIds.add(configurationView.getConnectionId()); 
        } 
        return connectionIds; 
    } 

    private static ConnectionConfigClientService getConnectionConfigurationClient() { 
        return ServiceRegistry.getInstance().getService(ConnectionConfigClientUtil.CONNECTION_CONFIGURATION_CLIENT_SERVICE_NAME); 
    } 

    public static Map<Long, String> getFilePathForConnections(List<Long> connectionIds) throws BusinessException { 
        Map<Long, String> connIDVsBaseFilePath = new HashMap<>(); 

        for (Long connectionId : connectionIds) { 
            String path = ""; 
            ConnectionConfigurationView connectionConfigurationView = getConnectionConfigurationClient().fetch(connectionId); 

            // Check if the connection exists and is enabled 
            if (connectionConfigurationView != null && isConnectionEnabled(connectionConfigurationView)) { 
                String pluginClassName = connectionConfigurationView.getPluginClassName(); 

                // Pick the path based on plugin class type 
                if (pluginClassName != null && 
                        (pluginClassName.contains(PLUGIN_NAME) || pluginClassName.contains(PLUGIN_REMOTE_NAME))) { 
                    path = getConnectionPropertyByName(connectionConfigurationView, FileSystemConstants.DIRECTORY); 
                } else { 
                    path = getConnectionPropertyByName(connectionConfigurationView, FileSystemConstants.PATH); 
                } 
            } 

            connIDVsBaseFilePath.put(connectionId, path); 
        } 

        return connIDVsBaseFilePath; 
    } 

    public static String getConnectionPropertyByName(ConnectionConfigurationView connView, String propertyName) { 
        ConnectionPropertiesView connectionProperty = connView.getConnectionProperties().get(propertyName); 
        return Objects.nonNull(connectionProperty) ? connectionProperty.getPropertyValue() : null; 
    } 

    // Utility method to check if the connection is enabled 
    private static boolean isConnectionEnabled(ConnectionConfigurationView connBean) { 
        return connBean.getConnectionStatus() == ConnectionConfigurationContants.STATUS_CONNECTON_ENABLED; 
    } 

    private static String getSchemaDetailsFromConfiguration( ConnectionConfigurationView configuration){ 
        String schemeDetails = getConnectionPropertyByName(configuration, "Scheme"); 
        if (schemeDetails == null || schemeDetails.isEmpty()) { 
            schemeDetails = getConnectionPropertyByName(configuration, "scheme"); 
        } 
        return schemeDetails; 

    } 

    /** 
     * Validates whether the connection is of correct plugin type 
     * For File Activities plugin name should be : FileSystemPlugin or TextFilePlugin 
     * @param connId  : Connection Id 
     * @param pluginDefinitions List of plugin definitions containing name, classes, and schemes 
     */ 

    public static ConnectionValidationResult validateConnection(Long connId, List<FileSystemPluginDefination> pluginDefinitions) { 
        ConnectionValidationResult result = new ConnectionValidationResult(); 
        result.setValid(false); 
        if (pluginDefinitions == null || pluginDefinitions.isEmpty()) { 
            return result; 
        } 
        ConnectionConfigurationView configuration; 
        try { 
            configuration = getConnectionConfigurationClient().fetch(connId); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred while fetching connections."), e); 
            return result; 
        } 
        if (configuration == null) return result; 
        return validateConnectionInternal(connId, configuration, pluginDefinitions, result); 

    } 
    private static ConnectionValidationResult validateConnectionInternal( 
            Long connId, 
            ConnectionConfigurationView configuration, 
            List<FileSystemPluginDefination> pluginDefinitions, 
            ConnectionValidationResult result) { 

        String pluginClass = configuration.getPluginClassName(); 
        result.setPluginClass(pluginClass); 
        String schemeValue = getSchemaDetailsFromConfiguration(configuration); 
        if (schemeValue == null || schemeValue.isEmpty()) { 
            try { 
                ConnectionConfigurationService connService = 
                        ServiceRegistry.getInstance().getService(ConnectionServiceInitializer.CONNECTION_CONFIGURATION_SERVICE); 
                ConnectionConfigurationBean bean = connService.fetch(connId); 
                Map<String, String> map = bean.getAllPropertiesMap(); 
                schemeValue = map.get("scheme"); 
            } 
            catch (BusinessException e) { 
                LOGGER.error(LogTemplate.of( 
                        "Error occurred while loading connection properties." + connId), e); 
                return result; 
            } 
        } 

        result.setScheme(schemeValue); 
        boolean valid = pluginDefinitions.stream() 
                .filter(def -> 
                        def.getPluginClasses() != null && 
                                def.getPluginClasses().contains(pluginClass)) 
                .anyMatch(def -> { 
                    result.setPluginClassValid(true); 
                    List<String> schemes = def.getScheme(); 
                    return (schemes == null || schemes.isEmpty()) || 
                            (result.getScheme() != null && !(result.getScheme().isEmpty()) &&  schemes.contains(result.getScheme())); 
                }); 

        result.setValid(valid); 
        result.setSchemeValid(valid); 

        return result; 
    } 

    public static ConnectionValidationResult validateConnection(Long connId,Long otherConnectionID, List<FileSystemPluginDefination> pluginDefinitions) { 
        ConnectionValidationResult result = new ConnectionValidationResult(); 
        result.setValid(false); 

        if (pluginDefinitions == null || pluginDefinitions.isEmpty()) { 
            return result; 
        } 

        ConnectionConfigurationView configuration; 
        try { 
            configuration = getConnectionConfigurationClient().fetch(connId); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred while fetching connections."), e); 
            return result; 
        } 

        if (configuration == null) return result; 

        validateConnectionInternal(connId, configuration, pluginDefinitions, result); 

        // fixed: configuration is now properly available 
        validateDifferentSourceConnection(otherConnectionID, result, configuration); 

        return result; 
    } 

    public static ConnectionValidationResult validateDifferentSourceConnection(Long otherConnectionID, ConnectionValidationResult result, ConnectionConfigurationView configuration){ 
        if(otherConnectionID>0){ 
            result.setDifferentPluginSrcDest( !validateConnectionOfSamePluginType(configuration.getPluginName(),otherConnectionID)); 
            if(result.isDifferentPluginSrcDest()) 
                result.setValid(false); 
        } 
        return result; 
    } 

    /** 
     * Validates whether the 2 connection is of same plugin type 
     * For File Activities plugin name should be either : FileSystemPlugin or TextFilePlugin 
     * @param pluginClass  : Connection Id 
     * @param destConnId List of plugin definitions containing name, classes, and schemes 
     */ 
    public static boolean validateConnectionOfSamePluginType(String pluginClass, Long destConnId) { 

        ConnectionConfigurationView destConfiguration; 

        try { 
            destConfiguration = getConnectionConfigurationClient().fetch(destConnId); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred while fetching destination connection configuration."), e); 
            return false; 
        } 
        if (destConfiguration == null) return false; 
        String destPluginClass = destConfiguration.getPluginName(); 
        return destPluginClass != null && destPluginClass.equalsIgnoreCase(pluginClass); 
    } 

    private static CommonConnectionService getCommonConnectionService() { 
        return ServiceRegistry.getInstance().getService( 
                CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
    } 

}
