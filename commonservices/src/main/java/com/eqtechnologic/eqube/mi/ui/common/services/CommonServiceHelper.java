/* 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into. 
 * 
 */ 
package com.eqtechnologic.eqube.mi.ui.common.services; 

import com.eqtechnologic.eqube.commonconnection.service.CommonConnectionService; 
import com.eqtechnologic.eqube.commonconnection.service.constants.CommonConnectionConstants; 
import com.eqtechnologic.eqube.commonconnection.service.constants.ConnectionConfigurationContants; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionConfigurationView; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionPropertiesView; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.mi.ui.common.services.uibeans.ConnectionUIBean; 
import com.eqtechnologic.eqube.mi.ui.usermgmt.eQUserManager; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 

import java.util.*; 
import java.util.concurrent.TimeUnit; 
import com.eqtechnologic.eqube.logging.Logger; 

/** 
 * Helper class for Common service rest controller 
 *  
 * @author gpolekar 
 * 
 */ 
public class CommonServiceHelper { 
    private static final Logger LOGGER = Logger.getLogger(CommonServiceHelper.class.getName()); 
    private eQUserManager userManager = new eQUserManager(); 
    private static String contextPath; 
    private static final String PLUGIN_VERSION_NA = "NA"; 

    /** 
     * Get TimeZone Map with ID and GMT value 
     * 
     * @return 
     */ 
    public static Map<String, String> getTimeZoneMap() { 
        Map<String, String> timeZones = new LinkedHashMap<>(); 
        timeZones.put(TimeZone.getDefault().getID(), getGMTValue(TimeZone.getDefault())); 
        for (String id : TimeZone.getAvailableIDs()) { 
            timeZones.put(id, getGMTValue(TimeZone.getTimeZone(id))); 
        } 
        return timeZones; 
    } 

    /** 
     * (non-Javadoc) Get GMT value of timezone 
     * 
     * @param tz 
     */ 
    private static String getGMTValue(TimeZone tz) { 
        long hours = TimeUnit.MILLISECONDS.toHours(tz.getRawOffset()); 
        long minutes = TimeUnit.MILLISECONDS.toMinutes(tz.getRawOffset()) - TimeUnit.HOURS.toMinutes(hours); 
        minutes = Math.abs(minutes); 

        String result; 
        if (hours > 0) { 
            result = String.format("(GMT+%d:%02d)", hours, minutes); 
        } else { 
            result = String.format("(GMT%d:%02d)", hours, minutes); 
        } 
        return result; 
    } 

    /** 
     * Returns the context path. 
     * 
     * @return 
     */ 
    public static String getContextPath() { 
        return contextPath; 
    } 

    /** 
     * Set value to contextPath. 
     * 
     * @param path 
     */ 
    private static void setContextPath(String path) { 
        CommonServiceHelper.contextPath = path; 
    } 

    public List<ConnectionUIBean> fetchAccessibleConnections() throws BusinessException { 
        CommonConnectionService commonConnService = ServiceRegistry.getInstance().getService( 
                CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
        List<ConnectionConfigurationView> userConnectionCredentialsBeans = commonConnService.fetchAllAccessibleConn(); 
        List<ConnectionUIBean> connUIBeanList = new ArrayList<>(); 
        if (userConnectionCredentialsBeans != null) { 
            for(ConnectionConfigurationView connConfigBean: userConnectionCredentialsBeans){ 
                if(connConfigBean.isPluginBased()) { 
                    connUIBeanList.add(toUIBean(connConfigBean)); 
                } 
            } 
        } 
        return connUIBeanList; 
    } 

    public List<ConnectionUIBean> fetchAccessibleNonPluginConnections() throws BusinessException { 
        CommonConnectionService commonConnService = ServiceRegistry.getInstance().getService( 
                CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 

        List<ConnectionConfigurationView> userConnectionCredentialsBeans = 
                commonConnService.fetchAllAccessibleConn(); 

        List<ConnectionUIBean> connUIBeanList = new ArrayList<>(); 

        if (userConnectionCredentialsBeans != null) { 
            for (ConnectionConfigurationView connConfigBean : userConnectionCredentialsBeans) { 
                if (!connConfigBean.isPluginBased()) { 
                    connUIBeanList.add(toUIBeanForTransportConnections(connConfigBean)); 
                } 
            } 
        } 

        return connUIBeanList; 
    } 

    public List<ConnectionUIBean> fetchAccessibleTransportConnections() throws BusinessException { 
        CommonConnectionService commonConnService = ServiceRegistry.getInstance().getService( 
                CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
        List<ConnectionConfigurationView> userConnectionCredentialsBeans = commonConnService.fetchAllAccessibleConn(); 
        List<ConnectionUIBean> connUIBeanList = new ArrayList<>(); 
        if (userConnectionCredentialsBeans != null) { 
            for(ConnectionConfigurationView connConfigBean: userConnectionCredentialsBeans){ 
                connUIBeanList.add(toUIBeanForTransportConnections(connConfigBean)); 
            } 
        } 
        return connUIBeanList; 
    } 

    public List<ConnectionUIBean> fetchAccessibleConnections(boolean includeInternalConnection, boolean includeCacheConnection) throws BusinessException { 
        CommonConnectionService commonConnService = ServiceRegistry.getInstance().getService( 
                CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
        List<ConnectionConfigurationView> userConnectionCredentialsBeans = commonConnService.fetchAllAccessibleConn(includeInternalConnection, includeCacheConnection); 
        List<ConnectionUIBean> connUIBeanList = new ArrayList<>(); 
        if (userConnectionCredentialsBeans != null) { 
            for(ConnectionConfigurationView connConfigBean: userConnectionCredentialsBeans){ 
                if(connConfigBean.isPluginBased()) { 
                    connUIBeanList.add(toUIBean(connConfigBean)); 
                } 
            } 
        } 
        return connUIBeanList; 
    } 

    /** 
     * This method will convert connection BO bean to connection UI bean 
     * to pass data to UI layer 
     * 
     * @return ConnectionUIBean 
     */ 
    public static ConnectionUIBean toUIBean(ConnectionConfigurationView boBean) throws BusinessException { 
        if (boBean == null) return null; 

        ConnectionUIBean connectionUIBean = new ConnectionUIBean(); 

        populateBasicFields(boBean, connectionUIBean); 
        Map<String, ConnectionPropertiesView> propertiesMap = boBean.getConnectionProperties(); 
        connectionUIBean.setPluginName(boBean.getPluginName()); 
        connectionUIBean.setSaveCredentials(boBean.isSaveCredentials()); 
        connectionUIBean.setXmldata(boBean.getXmldata()); 
        connectionUIBean.setCreateModel(boBean.isCreateModel()); 
        connectionUIBean.setPluginDisplayName(boBean.getPluginDisplayName()); 
        connectionUIBean.setRemote(boBean.isRemote()); 
        connectionUIBean.setPluginBased(true); 
        connectionUIBean.setPluginVersion(boBean.getPluginVersion()); 
        connectionUIBean.setPluginInstanceName(boBean.getPluginInstanceName()); 
        connectionUIBean.setPluginClassName(boBean.getPluginClassName()); 
        StringBuilder displayName = new StringBuilder(boBean.getPluginDisplayNameWithVersionAndInstance()); 
        try { 
            int lastIndexOfInstance = displayName.lastIndexOf(" " + boBean.getPluginInstanceName()); 
            displayName.replace(lastIndexOfInstance,displayName.length(),""); 
            int lastIndexOfVersion = displayName.lastIndexOf(" " + boBean.getPluginVersion()); 
            displayName.replace(lastIndexOfVersion, displayName.length(), ""); 
            connectionUIBean.setPluginUIName(displayName.toString()); 
        } catch (Exception e) { 
            LOGGER.error("Error while setting plugin UI name. ConnectionId: {},DisplayName: {}, PluginInstance: {}, PluginVersion: {}", 
                    boBean.getConnectionId(), 
                    boBean.getPluginDisplayNameWithVersionAndInstance(), 
                    boBean.getPluginInstanceName(), 
                    boBean.getPluginVersion(), 
                    e); 
            connectionUIBean.setPluginUIName(displayName.toString()); 
        } 
        StringBuilder pluginDisplayName = new StringBuilder(displayName); 
        if (!boBean.getPluginVersion().equals(PLUGIN_VERSION_NA)) { 
            pluginDisplayName.append(" ").append(boBean.getPluginVersion()); 
        } 

        connectionUIBean.setPluginUIDisplayName(pluginDisplayName.toString()); 

        setConnectionColor(connectionUIBean, propertiesMap); 
        setAuthenticationUsage(connectionUIBean, propertiesMap); 
        return connectionUIBean; 
    } 

    public static ConnectionUIBean toUIBeanForTransportConnections(ConnectionConfigurationView boBean) throws BusinessException { 
        if (boBean == null) return null; 

        ConnectionUIBean connectionUIBean = new ConnectionUIBean(); 

        populateBasicFields(boBean, connectionUIBean); 
        Map<String, ConnectionPropertiesView> propertiesMap = boBean.getConnectionProperties(); 
        connectionUIBean.setPluginName(boBean.getPluginName()); 
        connectionUIBean.setSaveCredentials(boBean.isSaveCredentials()); 
        connectionUIBean.setXmldata(boBean.getXmldata()); 
        connectionUIBean.setCreateModel(boBean.isCreateModel()); 
        connectionUIBean.setPluginDisplayName(boBean.getPluginDisplayName()); 
        connectionUIBean.setRemote(boBean.isRemote()); 
        connectionUIBean.setPluginVersion(boBean.getPluginVersion()); 
        connectionUIBean.setPluginInstanceName(boBean.getPluginInstanceName()); 
        connectionUIBean.setPluginClassName(boBean.getPluginClassName()); 
        if (boBean.isPluginBased()){ 
            connectionUIBean.setPluginBased(true); 
            StringBuilder displayName = new StringBuilder(boBean.getPluginDisplayNameWithVersionAndInstance()); 
            int lastIndexOfInstance = displayName.lastIndexOf(" " + boBean.getPluginInstanceName()); 
            displayName.replace(lastIndexOfInstance, displayName.length(), ""); 
            int lastIndexOfVersion = displayName.lastIndexOf(" " + boBean.getPluginVersion()); 
            displayName.replace(lastIndexOfVersion, displayName.length(), ""); 
            connectionUIBean.setPluginUIName(displayName.toString()); 

            StringBuilder pluginDisplayName = new StringBuilder(displayName); 
            if (!boBean.getPluginVersion().equals(PLUGIN_VERSION_NA)) { 
                pluginDisplayName.append(" ").append(boBean.getPluginVersion()); 
            } 

            connectionUIBean.setPluginUIDisplayName(pluginDisplayName.toString()); 
        } else { 
            connectionUIBean.setPluginBased(false); 
            String deviceType = getPropertyValue(propertiesMap, "deviceType", null); 
            String displayName = boBean.getPluginDisplayName() != null ? boBean.getPluginDisplayName() 
                : (boBean.getConnectionName() != null ? boBean.getConnectionName() : deviceType); 
            connectionUIBean.setPluginUIName(displayName); 
            connectionUIBean.setPluginUIDisplayName(displayName); 
        } 
        setConnectionColor(connectionUIBean, propertiesMap); 
        setAuthenticationUsage(connectionUIBean, propertiesMap); 
        return connectionUIBean; 
    } 

    private static void populateBasicFields(ConnectionConfigurationView boBean, ConnectionUIBean connectionUIBean) { 
        connectionUIBean.setConnectionId(boBean.getConnectionId()); 
        connectionUIBean.setConnectionName(boBean.getConnectionName()); 
        connectionUIBean.setConnectionDesc(boBean.getConnectionDesc()); 
        connectionUIBean.setConnectionStatus(String.valueOf(boBean.getConnectionStatus())); 
        connectionUIBean.setCreationDate(boBean.getCreationDate()); 
        connectionUIBean.setCreator(boBean.getCreator()); 
        connectionUIBean.setLastUpdateBy(boBean.getLastUpdateBy()); 
        connectionUIBean.setLastUpdateDate(boBean.getLastUpdateDate()); 
    } 

    private static void setConnectionColor(ConnectionUIBean uiBean, Map<String, ConnectionPropertiesView> propertiesMap) { 
        String color = getPropertyValue(propertiesMap, ConnectionConfigurationContants.ConnectionPropertyNames.CONNECTION_COLOR, "#00000000"); 
        uiBean.setConnectionColor(color); 
    } 

    private static void setAuthenticationUsage(ConnectionUIBean uiBean, Map<String, ConnectionPropertiesView> propertiesMap) { 
        String value = getPropertyValue(propertiesMap, ConnectionConfigurationContants.ConnectionPropertyNames.IS_CONNECTION_USED_FOR_AUTHENTICATION, "false"); 
        uiBean.setUseConnectionForAuthentication(Boolean.parseBoolean(value)); 
    } 

    private static String getPropertyValue(Map<String, ConnectionPropertiesView> map, String key, String defaultValue) { 
        ConnectionPropertiesView view = map.get(key); 
        return (view != null && view.getPropertyValue() != null) ? view.getPropertyValue() : defaultValue; 
    } 

}
