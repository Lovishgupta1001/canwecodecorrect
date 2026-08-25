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

import com.eqtechnologic.eqube.commonui.components.eQError;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.bean.CallMethodItem;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.bean.DataChangeWriteItem;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.bean.InputParameterItem;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.constants.InvokeOPCUAConstants;
import com.eqtechnologic.eqube.mi.activities.invokeopcua.exception.InvokeOPCUAErrorCode;
import com.eqtechnologic.eqube.mi.component.service.ComponentService;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.utility.ComponentUtility;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Validator for Invoke OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings({"java:S3740", "rawtypes"})
public class InvokeOPCUAValidator implements ComponentValidator<Map, Map> {

    private static final Logger LOGGER = Logger.getLogger(InvokeOPCUAValidator.class.getName());
    public static final String COMPONENT_ERR = "ComponentErr";
    private static final String EXPRESSION_BUILDER_SERVICE = "expressionBuilderService";
    private static final String CALL_METHOD_PREFIX = "callMethod/";
    private static final String DATA_CHNAGE_WRITE_PREFIX = "dataChangeWrite/";

    @Override
    public List<eQError> validate(Map configMap, Map additionalInfo) {
        if (configMap == null || configMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<eQError> errorList = new ArrayList<>();
        String transportName = (String) configMap.get(InvokeOPCUAConstants.TRANSPORT_NAME);

        if (transportName == null || transportName.trim().isEmpty()) {
            eQError error = new eQError(InvokeOPCUAConstants.ERR_SEL_TRANSPORT, COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, InvokeOPCUAConstants.TRANSPORT_NAME),
                    false);
            errorList.add(error);
        } else {
            validateTransport(transportName, errorList);
        }

        String operation = (String) configMap.get(InvokeOPCUAConstants.OPERATION);
        if (InvokeOPCUAConstants.DATA_CHANGE_WRITE.equals(operation)) {
            validateDataChangeWrite((List<?>) configMap.get("dataChangeWrite"), additionalInfo, errorList);
        } else if (InvokeOPCUAConstants.CALL_METHOD.equals(operation)) {
            validateCallMethod((List<?>) configMap.get("callMethod"), additionalInfo, errorList);
        }

        return errorList;
    }

    private void validateDataChangeWrite(List<?> dataChangeWriteList, Map additionalInfo, List<eQError> errorList) {
        if (dataChangeWriteList == null || dataChangeWriteList.isEmpty()) {
            eQError error = new eQError(InvokeOPCUAConstants.ERR_EMPTY_DATA_CHANGE_WRITE, COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, "dataChangeWrite"),
                    false);
            errorList.add(error);
            return;
        }

        int row = 1;
        for (Object item : dataChangeWriteList) {
            if (item != null) {
                String name = getName(item);
                if (name == null || name.trim().isEmpty() || "Select Data Change".equalsIgnoreCase(name.trim())) {
                    eQError error = new eQError(InvokeOPCUAConstants.ERR_EMPTY_DATA_CHANGE_NAME, COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, DATA_CHNAGE_WRITE_PREFIX + row + "/name"),
                            false);
                    errorList.add(error);
                }

                String newValue = getNewValue(item);
                if (newValue == null || newValue.trim().isEmpty()) {
                    eQError error = new eQError(InvokeOPCUAConstants.ERR_EMPTY_NEW_VALUE, COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, DATA_CHNAGE_WRITE_PREFIX + row + "/newValue"),
                            false);
                    errorList.add(error);
                } else {
                    validateExpression(newValue, additionalInfo, errorList, DATA_CHNAGE_WRITE_PREFIX + row + "/newValue");
                }
            }
            row++;
        }
    }

    private void validateCallMethod(List<?> callMethodList, Map additionalInfo, List<eQError> errorList) {
        if (callMethodList == null || callMethodList.isEmpty()) {
            eQError error = new eQError(InvokeOPCUAConstants.ERR_EMPTY_CALL_METHOD, COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, "callMethod"),
                    false);
            errorList.add(error);
            return;
        }

        int row = 1;
        for (Object item : callMethodList) {
            if (item != null) {
                String name = getName(item);
                if (name == null || name.trim().isEmpty() || "Select Method".equalsIgnoreCase(name.trim())) {
                    eQError error = new eQError(InvokeOPCUAConstants.ERR_EMPTY_METHOD_NAME, COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, CALL_METHOD_PREFIX + row + "/name"),
                            false);
                    errorList.add(error);
                }

                Object inputParamsObj = getInputParametersObj(item);
                if (inputParamsObj instanceof List<?> inputParams) {
                    validateMethodInputParameters(inputParams, row, additionalInfo, errorList);
                }
            }
            row++;
        }
    }

    private void validateMethodInputParameters(List<?> inputParams, int row, Map additionalInfo, List<eQError> errorList) {
        int pRow = 1;
        for (Object param : inputParams) {
            if (param != null) {
                String pVal = getParamValue(param);
                if (pVal == null || pVal.trim().isEmpty()) {
                    eQError error = new eQError(InvokeOPCUAConstants.ERR_EMPTY_PARAMETER_VALUE, COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, CALL_METHOD_PREFIX + row + "/inputParameters/" + pRow + "/value"),
                            false);
                    errorList.add(error);
                } else {
                    validateExpression(pVal, additionalInfo, errorList, CALL_METHOD_PREFIX + row + "/inputParameters/" + pRow + "/value");
                }
            }
            pRow++;
        }
    }

    private String getName(Object obj) {
        if (obj instanceof DataChangeWriteItem item) {
            return item.getName();
        } else if (obj instanceof CallMethodItem item) {
            return item.getName();
        } else if (obj instanceof Map<?, ?> map) {
            return (String) map.get("name");
        }
        return null;
    }

    private String getNewValue(Object obj) {
        if (obj instanceof DataChangeWriteItem item) {
            return item.getNewValue();
        } else if (obj instanceof Map<?, ?> map) {
            return (String) map.get("newValue");
        }
        return null;
    }

    private Object getInputParametersObj(Object obj) {
        if (obj instanceof CallMethodItem item) {
            return item.getInputParameters();
        } else if (obj instanceof Map<?, ?> map) {
            return map.get("inputParameters");
        }
        return null;
    }

    private String getParamValue(Object pObj) {
        if (pObj instanceof InputParameterItem item) {
            return item.getValue();
        } else if (pObj instanceof Map<?, ?> map) {
            return (String) map.get("value");
        }
        return null;
    }

    private void validateTransport(String transportName, List<eQError> errorList) {
        try {
            TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(transportName);
            if (transportClientBean == null) {
                eQError error = new eQError(InvokeOPCUAConstants.ERR_TRANSPORT_NOT_FOUND, COMPONENT_ERR,
                        ComponentUtility.getInstance().createPath(InvokeOPCUAConstants.INVOKE_OPCUA, InvokeOPCUAConstants.TRANSPORT_NAME),
                        false);
                errorList.add(error);
            }
        } catch (BusinessException e) {
            LogTemplate lt = LogTemplate.of(InvokeOPCUAErrorCode.ERROR_WHILE_VALIDATING_TRANSPORT.getMessage());
            LOGGER.error(lt, e);
            eQError errorMsg = new eQError(InvokeOPCUAConstants.ERR_TRANSPORT_FRAMEWORK_ERROR, COMPONENT_ERR,
                    null, true);
            errorList.add(errorMsg);
        }
    }

    private TransportClientService getTransportClientService() {
        return ServiceRegistry.getInstance().getService(TransportClientConstants.SERVICE_NAME);
    }

    private void validateExpression(String expressionValue, Map map, List<eQError> errors, String resource) {
        if (expressionValue == null || expressionValue.isEmpty()) {
            return;
        }
        ComponentService expressionBuilderService = ServiceRegistry.getInstance().getService(EXPRESSION_BUILDER_SERVICE);
        if (expressionBuilderService != null && expressionBuilderService.getValidator() != null) {
            List<eQError> generatedErrors = expressionBuilderService.getValidator().validate(expressionValue, map);
            if (generatedErrors != null) {
                generatedErrors.forEach(er -> er.setResource(InvokeOPCUAConstants.INVOKE_OPCUA + "/" + resource));
                errors.addAll(generatedErrors);
            }
        }
    }
}
