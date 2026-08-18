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

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.CallMethodItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.DataChangeWriteItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.InputParameterItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.transport.uiservice.TransportRESTServiceHelper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Helper methods required for Write To OPC UA Component
 *
 * @author Lovish
 */
@Component
public class WriteToOPCUAComponentServiceHelper {

    private static final Logger LOGGER = Logger.getLogger(WriteToOPCUAComponentServiceHelper.class.getName());

    public List<TransportInfo> convertTransportClientToTransportInfoBeanList(String transportType, List<TransportClientBean> transportClientBeans) {
        if (transportClientBeans == null) {
            return new ArrayList<>();
        }
        return transportClientBeans.stream()
                .filter(clientBean -> clientBean != null && clientBean.getTransportType() != null && clientBean.getTransportType().equalsIgnoreCase(transportType))
                .map(transportClientBean -> {
                    TransportInfo transportInfo = new TransportInfo();
                    transportInfo.setTransportName(transportClientBean.getName());
                    transportInfo.setTransportId(transportClientBean.getTransportId());

                    if (WriteToOPCUAConstants.OPCUA_TYPE.equalsIgnoreCase(transportType)) {
                        OpcUaTransportClientInfoBean opcUaInfo = transportClientBean.getOpcUaTransportClientInfoBean();
                        if (opcUaInfo != null && opcUaInfo.getWriteItems() != null) {
                            List<DataChangeWriteItem> dataChangeOptions = new ArrayList<>();
                            List<CallMethodItem> callMethodOptions = new ArrayList<>();

                            for (OpcUaWriteItem item : opcUaInfo.getWriteItems()) {
                                if (item instanceof OpcUaDataChangeWriteItem) {
                                    OpcUaDataChangeWriteItem dataChangeItem = (OpcUaDataChangeWriteItem) item;
                                    DataChangeWriteItem dataChangeOption = new DataChangeWriteItem();
                                    dataChangeOption.setName(dataChangeItem.getName());
                                    dataChangeOption.setNodeId(dataChangeItem.getNodeId());
                                    dataChangeOption.setDataTypeName(dataChangeItem.getDataTypeName());
                                    dataChangeOption.setDataTypeNodeId(dataChangeItem.getDataTypeNodeId());
                                    dataChangeOption.setSampleValue(dataChangeItem.getSampleValue());
                                    dataChangeOptions.add(dataChangeOption);
                                } else if (item instanceof OpcUaMethodWriteItem) {
                                    OpcUaMethodWriteItem methodItem = (OpcUaMethodWriteItem) item;
                                    CallMethodItem callMethodOption = new CallMethodItem();
                                    callMethodOption.setName(methodItem.getName());
                                    callMethodOption.setNodeId(methodItem.getNodeId());
                                    callMethodOption.setObjectNodeId(methodItem.getObjectNodeId());

                                    if (methodItem.getInputArguments() != null) {
                                        List<InputParameterItem> inputParams = new ArrayList<>();
                                        for (OpcUaArgumentInfo arg : methodItem.getInputArguments()) {
                                            InputParameterItem param = new InputParameterItem();
                                            param.setName(arg.getName());
                                            param.setDataTypeName(arg.getDataTypeName());
                                            param.setValue("");
                                            inputParams.add(param);
                                        }
                                        callMethodOption.setInputParameters(inputParams);
                                        callMethodOption.setInputArguments(inputParams);
                                    }
                                    callMethodOptions.add(callMethodOption);
                                }
                            }
                            transportInfo.setDataChangeOptions(dataChangeOptions);
                            transportInfo.setCallMethodOptions(callMethodOptions);
                        }
                    }
                    return transportInfo;
                })
                .collect(Collectors.toList());
    }

    public WriteToOPCUAComponentService getWriteToOPCUAService() {
        return ServiceRegistry.getInstance().getService(WriteToOPCUAConstants.WRITE_TO_OPCUA);
    }

    public boolean testTransportById(Long transportId) {
        if (transportId == null) {
            return false;
        }
        try {
            TransportRESTServiceHelper.testTransportByID(transportId);
            return true;
        } catch (Exception e) {
            LOGGER.error("Error testing transport by ID: " + transportId, e);
            return false;
        }
    }
}
