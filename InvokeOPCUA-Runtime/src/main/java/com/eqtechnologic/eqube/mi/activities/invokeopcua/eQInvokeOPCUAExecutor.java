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

import java.util.Map;

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.logging.transaction.annotation.LogModuleName;
import com.eqtechnologic.eqube.mi.common.mierror.eQMIException;
import com.eqtechnologic.eqube.mi.process.context.eQActivityState;
import com.eqtechnologic.eqube.mi.process.definition.activity.eQActivityExecutor;

/**
* Executor for Invoke OPC UA activity
*
* @author Lovish
*/
@LogModuleName(moduleName = "Activity")
@SuppressWarnings({"java:S101", "rawtypes"})
public class eQInvokeOPCUAExecutor extends eQActivityExecutor {

    private static final Logger LOGGER;

    static {
        LOGGER = Logger.getLogger(eQInvokeOPCUAExecutor.class.getName());
    }

    @Override
    public Object execute(Object configData,
                          eQActivityState activityState,
                          Map<String, String> outPutMap)
            throws eQMIException, BusinessException {

        /*
        Map configMap = (Map) configData;
        eQContext context = activityState.getContext();
        Object response = null;
        InvokeOPCUAOutputBean output = null;
        boolean dynamicTransport = (boolean) configMap.get("dynamicTransport");
        String transportName;

        if (!dynamicTransport) {
            transportName = (String) configMap.get(InvokeOPCUAConstants.CONNECTION_NAME);
        } else {
            transportName = (String) context.get((String) configMap.get(InvokeOPCUAConstants.CONNECTION_NAME));
        }

        eQTransport transport = null;
        transport = getTransportService().getTransport(transportName);

        if (transport != null) {
            Map<String, Object> opcUaWriteMap = new HashMap<>();
            opcUaWriteMap.put("transportName", transportName);
            opcUaWriteMap.put(InvokeOPCUAConstants.EXECUTION_MODE, configMap.get(InvokeOPCUAConstants.EXECUTION_MODE));
            String operation = (String) configMap.get(InvokeOPCUAConstants.OPERATION);
            opcUaWriteMap.put(InvokeOPCUAConstants.OPERATION, operation);
            if (InvokeOPCUAConstants.DATA_CHANGE_WRITE.equals(operation)) {
                List<?> rawItems = (List<?>) configMap.get("dataChangeWrite");
                opcUaWriteMap.put("writeItems", toOpcUaDataChangeWriteItems(rawItems, context));
            } else {
                List<?> rawItems = (List<?>) configMap.get("callMethod");
                opcUaWriteMap.put("writeItems", toOpcUaMethodWriteItems(rawItems, context));
            }

            response = transport.publish(opcUaWriteMap, null, null, configMap, null);
            output = new InvokeOPCUAOutputBean(response);
        } else {
            String errorMessage = "Transport " + transportName + " used in Invoke OPC UA activity does not exist";
            LogTemplate logTemplate = LogTemplate.of(errorMessage)
                    .impact("Invoke OPC UA transport will not work");
            LOGGER.error(logTemplate, null);
            throw new eQMIException(eQInvokeOPCUAErrorCodes.TRANSPORT_DOES_NOT_EXIST, eQInvokeOPCUAErrorCodes.TRANSPORT_DOES_NOT_EXIST_ERROR, errorMessage);
        }

        putResponseInContext(outPutMap, context, response);

        return output;
        */

        return null;
    }

    /*
    private List<OpcUaDataChangeWriteItem> toOpcUaDataChangeWriteItems(List<?> rawItems, eQContext context) throws eQMIException {
        if (rawItems == null || rawItems.isEmpty()) return Collections.emptyList();
        List<OpcUaDataChangeWriteItem> result = new ArrayList<>(rawItems.size());
        for (Object raw : rawItems) {
            DataChangeWriteItem src = (DataChangeWriteItem) raw;
            OpcUaDataChangeWriteItem item = new OpcUaDataChangeWriteItem();
            item.setName(src.getName());
            item.setNodeId(src.getNodeId());
            item.setDataTypeName(src.getDataTypeName());
            item.setDataTypeNodeId(src.getDataTypeNodeId());
            item.setValue("{\"Value\":" + context.get(src.getNewValue()).toString() + "}");
            result.add(item);
        }
        return result;
    }

    private List<OpcUaMethodWriteItem> toOpcUaMethodWriteItems(List<?> rawItems, eQContext context) throws eQMIException {
        if (rawItems == null || rawItems.isEmpty()) return Collections.emptyList();
        List<OpcUaMethodWriteItem> result = new ArrayList<>(rawItems.size());
        for (Object raw : rawItems) {
            CallMethodItem src = (CallMethodItem) raw;
            OpcUaMethodWriteItem item = new OpcUaMethodWriteItem();
            item.setName(src.getName());
            item.setNodeId(src.getNodeId());
            item.setObjectNodeId(src.getObjectNodeId());
            item.setInputArgumentsValue(toJsonValueList(src.getInputParameters(), context));
            result.add(item);
        }
        return result;
    }

    private List<String> toJsonValueList(List<InputParameterItem> inputParameters, eQContext context) throws eQMIException {
        if (inputParameters == null) return Collections.emptyList();
        if (!(inputParameters instanceof List)) return Collections.emptyList();
        List<?> list = (List<?>) inputParameters;
        List<String> jsonValues = new ArrayList<>(list.size());
        for (Object p : list) {
            if (p instanceof InputParameterItem) {
                jsonValues.add("{\"Value\":" + context.get(((InputParameterItem) p).getValue()).toString() + "}");
            } else if (p != null) {
                jsonValues.add("{\"Value\":" + p.toString() + "}");
            }
        }
        return jsonValues;
    }

    private void putResponseInContext(Map<String, String> outPutMap, eQContext context, Object response) {
        if (!(response instanceof Map)) return;
        Map<String, List<String>> result = (Map<String, List<String>>) response;
        String successVar = outPutMap.get("successfulWriteItems");
        String failedVar = outPutMap.get("failedWriteItems");
        String skippedVar = outPutMap.get("skippedWriteItems");
        if (successVar != null)
            context.put(successVar, result.get("successfulWriteItems"));
        if (failedVar != null)
            context.put(failedVar, result.get("failedWriteItems"));
        if (skippedVar != null)
            context.put(skippedVar, result.get("skippedWriteItems"));
    }

    private TransportService getTransportService() {
        return ServiceRegistry.getInstance().getService(TransportServiceConstants.SERVICE_NAME);
    }
    */
}
