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
@SuppressWarnings("java:S3740")
public class WriteToOPCUAValidator implements ComponentValidator<Map, Map> {

    public static final String COMPONENT_ERR = "ComponentErr";
    private static final String EXPRESSION_BUILDER_SERVICE = "expressionBuilderService";

    @Override
    public List<eQError> validate(Map configMap, Map additionalInfo) {
        if (configMap == null || configMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<eQError> errorList = new ArrayList<>();
        String transportName = (String) configMap.get(WriteToOPCUAConstants.TRANSPORT_NAME);
        Boolean dynamicTransport = Boolean.TRUE.equals(configMap.get(WriteToOPCUAConstants.DYNAMIC_TRANSPORT));

        if (dynamicTransport) {
            validateExpression(transportName, additionalInfo, errorList, WriteToOPCUAConstants.TRANSPORT_NAME);
        }

        if (transportName == null || transportName.trim().isEmpty()) {
            eQError error = new eQError("writetoopcua.selTransport", COMPONENT_ERR,
                    ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, WriteToOPCUAConstants.TRANSPORT_NAME),
                    false);
            errorList.add(error);
        } else {
            if (!dynamicTransport) {
                validateTransport(transportName, errorList, configMap);
            }
        }

        String operation = (String) configMap.get(WriteToOPCUAConstants.OPERATION);
        if (WriteToOPCUAConstants.DATA_CHANGE_WRITE.equals(operation)) {
            List<Map<String, Object>> dataChangeWriteList = (List<Map<String, Object>>) configMap.get("dataChangeWrite");
            if (dataChangeWriteList == null || dataChangeWriteList.isEmpty()) {
                eQError error = new eQError("writetoopcua.emptyDataChangeWrite", COMPONENT_ERR,
                        ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "dataChangeWrite"),
                        false);
                errorList.add(error);
            } else {
                int row = 1;
                for (Map<String, Object> item : dataChangeWriteList) {
                    if (item != null) {
                        String dcName = (String) item.get("dataChangeName");
                        String newValue = (String) item.get("newValue");
                        if (dynamicTransport && dcName != null) {
                            validateExpression(dcName, additionalInfo, errorList, "dataChangeWrite/" + row + "/dataChangeName");
                        }
                        if (newValue != null && !newValue.isEmpty()) {
                            validateExpression(newValue, additionalInfo, errorList, "dataChangeWrite/" + row + "/newValue");
                        }
                    }
                    row++;
                }
            }
        } else if (WriteToOPCUAConstants.CALL_METHOD.equals(operation)) {
            List<Map<String, Object>> callMethodList = (List<Map<String, Object>>) configMap.get("callMethod");
            if (callMethodList == null || callMethodList.isEmpty()) {
                eQError error = new eQError("writetoopcua.emptyCallMethod", COMPONENT_ERR,
                        ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, "callMethod"),
                        false);
                errorList.add(error);
            } else {
                int row = 1;
                for (Map<String, Object> item : callMethodList) {
                    if (item != null) {
                        String methodName = (String) item.get("methodName");
                        if (dynamicTransport && methodName != null) {
                            validateExpression(methodName, additionalInfo, errorList, "callMethod/" + row + "/methodName");
                        }
                        List<Map<String, Object>> inputParams = (List<Map<String, Object>>) item.get("inputParameters");
                        if (inputParams != null) {
                            int pRow = 1;
                            for (Map<String, Object> param : inputParams) {
                                if (param != null) {
                                    String pVal = (String) param.get("value");
                                    if (pVal != null && !pVal.isEmpty()) {
                                        validateExpression(pVal, additionalInfo, errorList, "callMethod/" + row + "/inputParameters/" + pRow + "/value");
                                    }
                                }
                                pRow++;
                            }
                        }
                    }
                    row++;
                }
            }
        }

        return errorList;
    }

    private void validateTransport(String transportName, List<eQError> errorList, Map<String, Object> configMap) {
        try {
            boolean isDynamicTransport = true;
            TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(transportName);
            if (transportClientBean != null) {
                isDynamicTransport = false;
            }

            if (!isDynamicTransport) {
                errorList.addAll(Collections.emptyList());
            } else {
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
