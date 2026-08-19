/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.writetoopcua;

import com.eqtechnologic.eqube.commonui.components.eQError;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.CallMethodItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.DataChangeWriteItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.InputParameterItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
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
 * Validator for Write To OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings({"java:S3740", "rawtypes"})
public class WriteToOPCUAValidator implements ComponentValidator<Map, Map> {

    public static final String COMPONENT_ERR = "ComponentErr";
    private static final String EXPRESSION_BUILDER_SERVICE = "expressionBuilderService";
    private static final String CALL_METHOD_PREFIX = "callMethod/";

    @Override
    public List<eQError> validate(Map configMap, Map additionalInfo) {
        if (configMap == null || configMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<eQError> errorList = new ArrayList<>();
        String transportName = (String) configMap.get(WriteToOPCUAConstants.TRANSPORT_NAME);

        if (transportName == null || transportName.trim().isEmpty()) {
            eQError error = new eQError("writetoopcua.selTransport", COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, WriteToOPCUAConstants.TRANSPORT_NAME),
                    false);
            errorList.add(error);
        } else {
            validateTransport(transportName, errorList);
        }

        String operation = (String) configMap.get(WriteToOPCUAConstants.OPERATION);
        if (WriteToOPCUAConstants.DATA_CHANGE_WRITE.equals(operation)) {
            validateDataChangeWrite((List<?>) configMap.get("dataChangeWrite"), additionalInfo, errorList);
        } else if (WriteToOPCUAConstants.CALL_METHOD.equals(operation)) {
            validateCallMethod((List<?>) configMap.get("callMethod"), additionalInfo, errorList);
        }

        return errorList;
    }

    private void validateDataChangeWrite(List<?> dataChangeWriteList, Map additionalInfo, List<eQError> errorList) {
        if (dataChangeWriteList == null || dataChangeWriteList.isEmpty()) {
            eQError error = new eQError("writetoopcua.emptyDataChangeWrite", COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "dataChangeWrite"),
                    false);
            errorList.add(error);
            return;
        }

        int row = 1;
        for (Object item : dataChangeWriteList) {
            if (item != null) {
                String name = getName(item);
                if (name == null || name.trim().isEmpty() || "Select Data Change".equalsIgnoreCase(name.trim())) {
                    eQError error = new eQError("writetoopcua.emptyDataChangeName", COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "dataChangeWrite/" + row + "/name"),
                            false);
                    errorList.add(error);
                }

                String newValue = getNewValue(item);
                if (newValue == null || newValue.trim().isEmpty()) {
                    eQError error = new eQError("writetoopcua.emptyNewValue", COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "dataChangeWrite/" + row + "/newValue"),
                            false);
                    errorList.add(error);
                } else {
                    validateExpression(newValue, additionalInfo, errorList, "dataChangeWrite/" + row + "/newValue");
                }
            }
            row++;
        }
    }

    private void validateCallMethod(List<?> callMethodList, Map additionalInfo, List<eQError> errorList) {
        if (callMethodList == null || callMethodList.isEmpty()) {
            eQError error = new eQError("writetoopcua.emptyCallMethod", COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "callMethod"),
                    false);
            errorList.add(error);
            return;
        }

        int row = 1;
        for (Object item : callMethodList) {
            if (item != null) {
                String name = getName(item);
                if (name == null || name.trim().isEmpty() || "Select Method".equalsIgnoreCase(name.trim())) {
                    eQError error = new eQError("writetoopcua.emptyMethodName", COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "callMethod/" + row + "/name"),
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
                    eQError error = new eQError("writetoopcua.emptyParameterValue", COMPONENT_ERR,
                            ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, CALL_METHOD_PREFIX + row + "/inputParameters/" + pRow + "/value"),
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
                eQError error = new eQError("writetoopcua.transportNotFound", COMPONENT_ERR,
                        ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, WriteToOPCUAConstants.TRANSPORT_NAME),
                        false);
                errorList.add(error);
            }
        } catch (Exception e) {
            eQError errorMsg = new eQError("writetoopcua.transportFrameworkError_transport", COMPONENT_ERR,
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
        try {
            ComponentService expressionBuilderService = ServiceRegistry.getInstance().getService(EXPRESSION_BUILDER_SERVICE);
            if (expressionBuilderService != null && expressionBuilderService.getValidator() != null) {
                List<eQError> generatedErrors = expressionBuilderService.getValidator().validate(expressionValue, map);
                if (generatedErrors != null) {
                    generatedErrors.forEach(er -> er.setResource(WriteToOPCUAConstants.WRITE_TO_OPCUA + "/" + resource));
                    errors.addAll(generatedErrors);
                }
            }
        } catch (Exception e) {
            // Ignore if ExpressionBuilder service is not registered in unit test environment
        }
    }
}
