/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.writetoopcua.bean;

import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.businessobjects.process.ActivityConfigBean;
import com.eqtechnologic.eqube.mi.component.annotations.ComponentData;
import com.eqtechnologic.eqube.mi.componentservices.exprbuilder.constants.ExpressionBuilderConstants;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration bean for Write To OPC UA Activity
 *
 * @author Lovish
 */
public class WriteToOPCUAConfigBean extends ActivityConfigBean {

    private Boolean dynamicTransport = Boolean.FALSE;

    private String transportName;

    private String operation = WriteToOPCUAConstants.DATA_CHANGE_WRITE;
    private String executionMode = WriteToOPCUAConstants.PARALLEL;

    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, allKeys = true, mandatory = false)
    private List<DataChangeWriteItem> dataChangeWrite = new ArrayList<>();

    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, allKeys = true, mandatory = false)
    private List<CallMethodItem> callMethod = new ArrayList<>();

    @Override
    public String getActivityName() {
        return WriteToOPCUAConstants.WRITE_TO_OPCUA;
    }

    public Boolean getDynamicTransport() {
        return dynamicTransport;
    }

    public void setDynamicTransport(Boolean dynamicTransport) {
        this.dynamicTransport = dynamicTransport;
    }

    public String getTransportName() {
        return transportName;
    }

    public void setTransportName(String transportName) {
        this.transportName = transportName;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getExecutionMode() {
        return executionMode;
    }

    public void setExecutionMode(String executionMode) {
        this.executionMode = executionMode;
    }

    public List<DataChangeWriteItem> getDataChangeWrite() {
        return dataChangeWrite;
    }

    public void setDataChangeWrite(List<DataChangeWriteItem> dataChangeWrite) {
        this.dataChangeWrite = dataChangeWrite;
    }

    public List<CallMethodItem> getCallMethod() {
        return callMethod;
    }

    public void setCallMethod(List<CallMethodItem> callMethod) {
        this.callMethod = callMethod;
    }
}
