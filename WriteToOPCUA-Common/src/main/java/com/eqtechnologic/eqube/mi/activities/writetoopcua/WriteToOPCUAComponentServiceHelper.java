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
import com.eqtechnologic.eqube.logging.LogTemplate;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.CallMethodItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.DataChangeWriteItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.InputParameterItem;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.exception.WriteToOPCUAErrorCode;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.exception.WriteToOPCUAExceptionType;
import com.eqtechnologic.eqube.platform.transport.client.beans.OpcUaTransportClientInfoBean;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaArgumentInfo;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaDataChangeWriteItem;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaMethodWriteItem;
import com.eqtechnologic.eqube.transport.opcuatransport.beans.OpcUaWriteItem;
import com.eqtechnologic.eqube.transport.uiservice.TransportRESTServiceHelper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

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

        List<TransportInfo> list = new ArrayList<>();
        for (TransportClientBean clientBean : transportClientBeans) {
            if (clientBean != null && clientBean.getTransportType() != null && clientBean.getTransportType().equalsIgnoreCase(transportType)) {
                list.add(mapTransportClientToInfo(transportType, clientBean));
            }
        }
        return list;
    }

    private TransportInfo mapTransportClientToInfo(String transportType, TransportClientBean transportClientBean) {
        TransportInfo transportInfo = new TransportInfo();
        transportInfo.setTransportName(transportClientBean.getName());
        transportInfo.setTransportId(transportClientBean.getTransportId());

        if (WriteToOPCUAConstants.OPCUA_TYPE.equalsIgnoreCase(transportType)) {
            processOpcUaWriteItems(transportClientBean.getOpcUaTransportClientInfoBean(), transportInfo);
        }
        return transportInfo;
    }

    private void processOpcUaWriteItems(OpcUaTransportClientInfoBean opcUaInfo, TransportInfo transportInfo) {
        if (opcUaInfo == null || opcUaInfo.getWriteItems() == null) {
            return;
        }

        List<DataChangeWriteItem> dataChangeOptions = new ArrayList<>();
        List<CallMethodItem> callMethodOptions = new ArrayList<>();

        for (OpcUaWriteItem item : opcUaInfo.getWriteItems()) {
            if (item instanceof OpcUaDataChangeWriteItem dataChangeItem) {
                dataChangeOptions.add(createDataChangeOption(dataChangeItem));
            } else if (item instanceof OpcUaMethodWriteItem methodItem) {
                callMethodOptions.add(createCallMethodOption(methodItem));
            }
        }

        transportInfo.setDataChangeOptions(dataChangeOptions);
        transportInfo.setCallMethodOptions(callMethodOptions);
    }

    private DataChangeWriteItem createDataChangeOption(OpcUaDataChangeWriteItem dataChangeItem) {
        DataChangeWriteItem dataChangeOption = new DataChangeWriteItem();
        dataChangeOption.setName(dataChangeItem.getName());
        dataChangeOption.setNodeId(dataChangeItem.getNodeId());
        dataChangeOption.setDataTypeName(dataChangeItem.getDataTypeName());
        dataChangeOption.setDataTypeNodeId(dataChangeItem.getDataTypeNodeId());
        dataChangeOption.setSampleValue(dataChangeItem.getValue());
        return dataChangeOption;
    }

    private CallMethodItem createCallMethodOption(OpcUaMethodWriteItem methodItem) {
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
        return callMethodOption;
    }

    public WriteToOPCUAComponentService getWriteToOPCUAService() {
        return ServiceRegistry.getInstance().getService(WriteToOPCUAConstants.WRITE_TO_OPCUA);
    }

    public boolean testTransportById(Long transportId) {
        if (transportId == null) {
            return false;
        }
        TransportRESTServiceHelper.testTransportByID(transportId);
        return true;
    }
}
