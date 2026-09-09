/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.invokeopcua.bean;

import com.eqtechnologic.eqube.mi.activities.invokeopcua.constants.InvokeOPCUAConstants;
import com.eqtechnologic.eqube.mi.businessobjects.process.ActivityConfigBean;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration bean for Invoke OPC UA Activity
 *
 * @author Lovish
 */
public class InvokeOPCUAConfigBean extends ActivityConfigBean {

    private String connectionComboBox;
    private String connectionName;
    private String connectionId;
    private String connectionType;
    private String selectConnection;

    private String operation = InvokeOPCUAConstants.DATA_CHANGE_WRITE;
    private String executionMode = InvokeOPCUAConstants.PARALLEL;

    private List<DataChangeWriteItem> dataChangeWrite = new ArrayList<>();

    private List<CallMethodItem> callMethod = new ArrayList<>();

    @Override
    public String getActivityName() {
        return InvokeOPCUAConstants.INVOKE_OPCUA;
    }

    public String getConnectionComboBox() {
        return connectionComboBox;
    }

    public void setConnectionComboBox(String connectionComboBox) {
        this.connectionComboBox = connectionComboBox;
    }

    public String getConnectionName() {
        return connectionName;
    }

    public void setConnectionName(String connectionName) {
        this.connectionName = connectionName;
    }

    public String getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(String connectionId) {
        this.connectionId = connectionId;
    }

    public String getConnectionType() {
        return connectionType;
    }

    public void setConnectionType(String connectionType) {
        this.connectionType = connectionType;
    }

    public String getSelectConnection() {
        return selectConnection;
    }

    public void setSelectConnection(String selectConnection) {
        this.selectConnection = selectConnection;
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
