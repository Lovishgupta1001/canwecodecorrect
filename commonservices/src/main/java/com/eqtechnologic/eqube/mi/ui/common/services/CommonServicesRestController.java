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
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionConfigurationView; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.Loggable; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.logging.transaction.annotation.LogModuleName; 
import com.eqtechnologic.eqube.mi.ui.ACOperation; 
import com.eqtechnologic.eqube.mi.ui.common.services.uibeans.ConnectionUIBean; 
import com.eqtechnologic.eqube.mi.ui.common.services.uibeans.PasswordPolicyBean; 
import com.eqtechnologic.eqube.property.common.client.interfaces.IPropertyClient; 
import com.eqtechnologic.eqube.servermanagement.service.ServerManagementService; 
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.Authorize; 
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.OperationNames; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 
import org.springframework.web.bind.annotation.*; 

import java.util.ArrayList; 
import java.util.HashMap; 
import java.util.List; 
import java.util.Map; 
import com.eqtechnologic.eqube.mi.servermanagement.MIServerType; 

/** 
 * Common rest service controller 
 * 
 * @author gpolekar 
 */ 
@RestController 
@RequestMapping("/") 
@LogModuleName(moduleName = "Service") 
public class CommonServicesRestController { 

    private static final Logger LOGGER = Logger.getLogger(CommonServicesRestController.class); 
    private static final String KEY_DEFAULT_FILE_PATH = "defaultFilePath"; 

    private static CommonServiceHelper serviceHelper; 

    /** 
     * Constructor 
     */ 
    public CommonServicesRestController() { 
        serviceHelper = new CommonServiceHelper(); 
    } 

    private void authorizeAction() { 
        List<String> operations = new ArrayList<>(); 
        operations.add(ACOperation.UserAuthorization.DESIGNER_LOGIN); 
        authorizeAction(operations); 
    } 

    @Authorize 
    public void authorizeAction(@OperationNames List<String> operations) { 
        //implementation handled by @Authorize annotation 
    } 

    @GetMapping(value = "/isDistributedEnv") 
    public boolean isDistributedEnv() throws BusinessException { 
        return getServerManagementService().isDistributed(); 
    } 

    @Loggable 
    @GetMapping(value = "/fetchDisplayConnectionBasedonUserAccessPermission") 
    public boolean fetchDisplayConnectionBasedonUserAccessPermission() throws BusinessException { 
        authorizeAction(); 
        boolean displayConnectionBasedonUserAccessPermission = Boolean.parseBoolean(getPropertyClientService().getPropertyStringValue("display-connection-based-on-user-access")); 
        return displayConnectionBasedonUserAccessPermission; 
    } 
    private static IPropertyClient getPropertyClientService(){ 
        return ServiceRegistry.getInstance().getService("SimplePropertyInitializer"); 
    } 
    @Loggable 
    @GetMapping(value = "/fetchAccessibleConnections") 
    public List<ConnectionUIBean> fetchAccessibleConnections() throws BusinessException { 
        authorizeAction(); 
        List<ConnectionUIBean> connUIBeanList = serviceHelper.fetchAccessibleConnections(); 
        return connUIBeanList; 
    } 
    @Loggable 
    @GetMapping(value = "/fetchAccessibleNonPluginConnections") 
    public List<ConnectionUIBean> fetchAccessibleNonPluginConnections() throws BusinessException { 
        authorizeAction(); 
        List<ConnectionUIBean> connUIBeanList = serviceHelper.fetchAccessibleNonPluginConnections(); 
        return connUIBeanList; 
    } 
    @Loggable 
    @GetMapping(value = "/fetchAccessibleTransportConnections") 
    public List<ConnectionUIBean> fetchAccessibleTransportConnections() throws BusinessException { 
        List<ConnectionUIBean> connUIBeanList = serviceHelper.fetchAccessibleTransportConnections(); 
        return connUIBeanList; 
    } 
    @Loggable 
    @GetMapping(value = "/fetchAccessibleConnectionsWithParams") 
    public List<ConnectionUIBean> fetchAccessibleConnectionsWithParams(@RequestParam("includeInternalConnection") boolean includeInternalConnection, @RequestParam("includeCacheConnection") boolean includeCacheConnection) throws BusinessException { 
        authorizeAction(); 
        List<ConnectionUIBean> connUIBeanList = serviceHelper.fetchAccessibleConnections(includeInternalConnection, includeCacheConnection); 
        return connUIBeanList; 
    } 
    @Loggable 
    @GetMapping(value = "/fetchAllConnections") 
    public List<ConnectionUIBean> fetchAllConnections() throws BusinessException { 
        authorizeAction(); 
        CommonConnectionService commonConnService = ServiceRegistry.getInstance().getService( 
                CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
        List<ConnectionConfigurationView> userConnectionCredentialsBeans = commonConnService.fetchAllApplicationConnections(false); 
        List<ConnectionUIBean> connUIBeanList = new ArrayList<>(); 
        if (userConnectionCredentialsBeans != null) { 
            for(ConnectionConfigurationView connConfigBean: userConnectionCredentialsBeans){ 
                if(connConfigBean.isPluginBased()) { 
                    connUIBeanList.add(serviceHelper.toUIBean(connConfigBean)); 
                } 
            } 
        } 
        return connUIBeanList; 
    } 

    /** 
     * getCommonAdminConsoleNavigationUrl 
     * Returns cac url and environment id if cac 
     */ 
    @GetMapping("/application-navigation-url/cac") 
    public Map<String, String> getCommonAdminConsoleNavigationUrl() throws BusinessException { 
        Map<String, String>responseMap = new HashMap<String, String>(); 
        final boolean distributedEnv = isDistributedEnv(); 
        if(distributedEnv){ 
            responseMap.put("IS_DISTRIBUTED_DEPLOYMENT","TRUE"); 
            responseMap.put("DESIGNER_SITE_NAME", getPropertyClientService().getPropertyStringValue("site-name", MIServerType.DESIGNER.getServerName())); 
            responseMap.put("EXECUTION_SITE_NAME",getPropertyClientService().getPropertyStringValue("site-name", MIServerType.EXECUTOR.getServerName())); 
            responseMap.put("ENVIRONMENT_NAME",getPropertyClientService().getPropertyStringValue("environment_name")); 
            responseMap.put("ENVIRONMENT_ID",getPropertyClientService().getPropertyStringValue("cac-environment-id")); 
            responseMap.put("URL",getPropertyClientService().getPropertyStringValue("cac-remote-url")+"/AdminConsole#navigateTo"); 
            responseMap.put("SERVICE_NAME",getServerManagementService().getServerType().getServerName()); 
            responseMap.put("PRODUCT_NAME",getPropertyClientService().getPropertyStringValue("security-default-product-name")); 
            responseMap.put("PRODUCT_TYPE",getPropertyClientService().getPropertyStringValue("security-default-product-name")); 
            responseMap.put("PRODUCT_VERSION",getPropertyClientService().getPropertyStringValue("product-version")); 
        } 
        else { 
            responseMap.put("IS_DISTRIBUTED_DEPLOYMENT","FALSE"); 
        } 
        return responseMap; 
    } 

    private static ServerManagementService getServerManagementService(){ 
        return ServiceRegistry.getInstance().getService(ServerManagementService.class); 
    } 
}
