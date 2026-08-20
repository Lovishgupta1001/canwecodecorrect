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
package com.eqtechnologic.eqube.mi.processdesigner.validators;

import com.eqtechnologic.eqube.commonconnection.service.CommonConnectionService;
import com.eqtechnologic.eqube.commonconnection.service.constants.CommonConnectionConstants;
import com.eqtechnologic.eqube.commonui.components.eQError;
import com.eqtechnologic.eqube.connectionconfiguration.client.service.ConnectionConfigClientService;
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionConfigurationView;
import com.eqtechnologic.eqube.connectionconfiguration.client.service.util.ConnectionConfigClientUtil;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.businessobjects.connection.ConnectionCredentialType;
import com.eqtechnologic.eqube.mi.businessobjects.connection.eQProcessConnection;
import com.eqtechnologic.eqube.mi.caf.provider.SecurityProviderWrapper;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.utility.ComponentUtility;
import com.eqtechnologic.eqube.mi.processdesigner.constants.ProcessDesignerServiceConstants;
import com.eqtechnologic.eqube.mi.util.eQMIUtil;
import com.eqtechnologic.eqube.security.shared.model.db.table.PrimaryAuthenticationHandlerPolicy;
import com.eqtechnologic.eqube.security.shared.model.integration.AuthenticationPolicyFetchInfo;
import com.eqtechnologic.eqube.security.shared.util.PropertiesConstants;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;

import java.util.*;

import static com.eqtechnologic.eqube.commonconnection.service.constants.ConnectionConfigurationContants.HandlerPropertyNames.AUTHENTICATION_HANDLER_NAME;


/**
 * This is validator for connection tab
 *
 * @author amitk
 */
public class ConnectionTabValidator implements ComponentValidator<List<eQProcessConnection>, Object> {

    private static final String COMPONENT_ERROR = "ComponentErr";
    private static final String FALSE = "false";
    private static Logger logger;

    static {
        logger = Logger.getLogger(ConnectionTabValidator.class.getPackage().getName());
    }

    @Override
    public List<eQError> validate(List<eQProcessConnection> connections, Object configObject) {
        List<eQError> messages = new ArrayList<>();
        int rowNo = 1;
        List<ConnectionConfigurationView> connConfigBeanList = null;
        try {
            CommonConnectionService commonConnService = ServiceRegistry.getInstance().getService(
                    CommonConnectionConstants.COMMON_CONNECTION_SERVICE);
            connConfigBeanList = commonConnService.fetchAllAccessibleConn();
        } catch (BusinessException e) {
            logger.error("Failed to fetch accessible connections.", e);
        }
        for (eQProcessConnection connection : connections) {
            boolean accessibleConn = false;
            long connectionId = connection.NOCONNECTION;
            for (ConnectionConfigurationView connectionConfigurationView : connConfigBeanList) {
                if (connectionConfigurationView.getConnectionId() == connection.getConnectionId()) {
                    accessibleConn = true;
                    connectionId = connection.getConnectionId();
                }
            }
            ComponentUtility componentUtility = ComponentUtility.getInstance();
            if (accessibleConn == false) {
                String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "connectionId"), String.valueOf(rowNo));
                eQError errmsg = new eQError("validations.bpm.cvt.accessibleConnection", COMPONENT_ERROR, resource, false);
                messages.add(errmsg);
            } else if (connectionId == connection.NOCONNECTION) {
                String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "connectionId"), String.valueOf(rowNo));
                eQError errmsg = new eQError("validations.bpm.cvt.connectionnull", COMPONENT_ERROR, resource, false);
                messages.add(errmsg);
            } else if (connection.getKey() == null || (connection.getKey() != null && connection.getKey().isEmpty())) {
                String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "key"), String.valueOf(rowNo));
                eQError errmsg = new eQError("validations.bpm.cvt.connectionKeyNull", COMPONENT_ERROR, resource, false);
                messages.add(errmsg);
            }
            if (((connection.getConnectionCredentialType() != null) && (connection.getConnectionCredentialType() != ConnectionCredentialType.NONE) &&
                    (connection.getConnectionCredentialType() != ConnectionCredentialType.ACCESS_TOKEN_AS_VARIABLE) && (connection.getUsername() == null
                    || connection.getUsername().equals("")))) {
                String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "username"), String.valueOf(rowNo));
                eQError errmsg = new eQError("validations.bpm.cvt.userNameNull", COMPONENT_ERROR, resource, false);
                messages.add(errmsg);
            }
            if ((connection.getConnectionCredentialType() == ConnectionCredentialType.APPLICATION_CREDENTIALS_AS_VARIABLES) ||
                    (connection.getConnectionCredentialType() == ConnectionCredentialType.MI_USER_CREDENTIALS_AS_VARIABLES)) {

                if ((connection.getPasswordDecryptor() != null && !connection.getPasswordDecryptor().isEmpty()) &&
                        ((connection.getPassword() == null) || connection.getPassword().isEmpty())) {
                    String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "password"), String.valueOf(rowNo));
                    eQError errmsg = new eQError("validations.bpm.cvt.passwordEmptyPasswordDecryptorNotEmpty", COMPONENT_ERROR, resource, false);
                    messages.add(errmsg);
                }
            }
            if (connection.getConnectionCredentialType() == ConnectionCredentialType.SSO_SESSION_KEY_AS_VARIABLES) {
                if (connection.getSsoSessionKey() == null || connection.getSsoSessionKey().isEmpty()) {
                    String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "ssoSessionKey"), String.valueOf(rowNo));
                    eQError errmsg = new eQError("validations.bpm.cvt.ssoSessionKeyEmpty", COMPONENT_ERROR, resource, false);
                    messages.add(errmsg);
                }
            }
            if (connection.getConnectionCredentialType() == ConnectionCredentialType.STORED_SSO_SESSION_KEY_BY_USER || connection.getConnectionCredentialType() == ConnectionCredentialType.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES) {
                try {
                    validateProcessForStoredSSOSessionKeyByUserConnectionScheme(messages, componentUtility, rowNo, connection);
                } catch (BusinessException e) {
                    LogTemplate logTemplate = LogTemplate.of("Error occurred while validating the process")
                            .impact("Process will not get released.");
                    logger.error(logTemplate, e);
                }
            }
            if (connection.getKey() != null && !connection.getKey().isEmpty()) {
                validateForExpression(messages, rowNo, connection.getKey());
            }
            rowNo++;
        }
        return messages;
    }

    /**
     * This method validated process if the connection scheme used is STORED_SSO_SESSION_KEY_BY_USER or STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLE
     *
     * @param messages
     * @param componentUtility
     * @param rowNo
     */
    public void validateProcessForStoredSSOSessionKeyByUserConnectionScheme(List<eQError> messages, ComponentUtility componentUtility, int rowNo, eQProcessConnection connection) throws BusinessException {
        String isTCSessionKeyStored = isTCSessionKeyStored(connection);
        if (isTCSessionKeyStored != null && isTCSessionKeyStored.equalsIgnoreCase(FALSE)) {
            String resource = componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "connectionsCredType"), String.valueOf(rowNo));
            eQError errmsg = new eQError("validations.bpm.cvt.storeSSOSessionKeyOnLoginPropertyValue", COMPONENT_ERROR, resource, false);
            messages.add(errmsg);
        }
    }

    private String isTCSessionKeyStored(eQProcessConnection connection) throws BusinessException {

        ConnectionConfigClientService connService = ServiceRegistry.getInstance().getService(ConnectionConfigClientUtil.CONNECTION_CONFIGURATION_CLIENT_SERVICE_NAME);
        ConnectionConfigurationView connBean = connService.fetch(connection.getConnectionId());
        String handlerName = "";
        if (connBean != null) {
            handlerName = "";
            if(connBean.getConnectionProperties() != null && connBean.getConnectionProperties().get(AUTHENTICATION_HANDLER_NAME)!=null){
                handlerName = connBean.getConnectionProperties().get(AUTHENTICATION_HANDLER_NAME).getPropertyValue();
            }
        }
        List<PrimaryAuthenticationHandlerPolicy> primaryAuthenticationHandlerPolicies = fetchPrimaryAuthenticationHandlersByName(handlerName);
        for (PrimaryAuthenticationHandlerPolicy primaryAuthenticationHandlerPolicy : primaryAuthenticationHandlerPolicies) {
            if (primaryAuthenticationHandlerPolicy != null && primaryAuthenticationHandlerPolicy.getPolicyMap() != null && primaryAuthenticationHandlerPolicy.getName().equalsIgnoreCase(handlerName)) {
                return primaryAuthenticationHandlerPolicy.getPolicyMap().get(PropertiesConstants.TCSSOPOLICY_STORE_SESSION_KEY) == null ? FALSE : primaryAuthenticationHandlerPolicy.getPolicyMap().get(PropertiesConstants.TCSSOPOLICY_STORE_SESSION_KEY);
            }
        }
        return FALSE;
    }

    public List<PrimaryAuthenticationHandlerPolicy> fetchPrimaryAuthenticationHandlersByName(String handlerName) throws BusinessException {
        return SecurityProviderWrapper.getInstance().fetchHandlers(new ArrayList<>(List.of(handlerName)),new AuthenticationPolicyFetchInfo(false));
    }

    private void validateForExpression(List<eQError> messages, int rowNo, String varName) {
        try {
            List<String> arrVariableName = new ArrayList<>(Arrays.asList(eQMIUtil.getExprVariables(varName)));
            if (arrVariableName.size() == 1) {
                String variablename = arrVariableName.get(0);
                if (variablename.length() != varName.trim().length()) {
                    messages.add(getErrorMsgObject(varName, rowNo));
                }
            } else {
                messages.add(getErrorMsgObject(varName, rowNo));
            }
        } catch (Exception e) {
            messages.add(getErrorMsgObject(varName, rowNo));
        }
    }

    private eQError getErrorMsgObject(String varName, int rowNo) {
        ComponentUtility componentUtility = ComponentUtility.getInstance();
        eQError errmsg = new eQError();
        errmsg.setDescription("validations.bpm.cvt.InvalidParameterName");
        errmsg.setDescriptionParams(Collections.singletonList(varName));
        errmsg.setResource(componentUtility.createPath(componentUtility.createPath(ProcessDesignerServiceConstants.CONNECTION_TAB, "key"), String.valueOf(rowNo)));
        errmsg.setType(COMPONENT_ERROR);
        errmsg.setWarning(false);
        return errmsg;
    }

}
