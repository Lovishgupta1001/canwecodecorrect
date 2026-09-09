/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.invokeopcua.constants;

public final class InvokeOPCUAConstants {

    private InvokeOPCUAConstants() {
        // Private constructor
    }

    public static final String INVOKE_OPCUA = "InvokeOPCUA";
    public static final String DATA_CHANGE_WRITE = "DataChangeWrite";
    public static final String CALL_METHOD = "CallMethod";
    public static final String PARALLEL = "Parallel";
    public static final String SEQUENTIAL = "Sequential";
    public static final String CONNECTION_COMBOBOX = "connectionComboBox";
    public static final String CONNECTION_NAME = "connectionName";
    public static final String CONNECTION_ID = "connectionId";
    public static final String CONNECTION_TYPE = "connectionType";
    public static final String SELECT_CONNECTION = "selectConnection";
    public static final String OPERATION = "operation";
    public static final String EXECUTION_MODE = "executionMode";
    public static final String OPCUA_TYPE = "OPCUA";

    // Validation Error Keys
    public static final String ERR_SEL_CONNECTION = "invokeopcua.selConnection";
    public static final String ERR_INVALID_CONNECTION = "invokeopcua.invalidConnection";
    public static final String ERR_EMPTY_DATA_CHANGE_WRITE = "invokeopcua.emptyDataChangeWrite";
    public static final String ERR_EMPTY_CALL_METHOD = "invokeopcua.emptyCallMethod";
    public static final String ERR_EMPTY_DATA_CHANGE_NAME = "invokeopcua.emptyDataChangeName";
    public static final String ERR_EMPTY_NEW_VALUE = "invokeopcua.emptyNewValue";
    public static final String ERR_EMPTY_METHOD_NAME = "invokeopcua.emptyMethodName";
    public static final String ERR_EMPTY_PARAMETER_VALUE = "invokeopcua.emptyParameterValue";
    public static final String ERR_CONNECTION_NOT_FOUND = "invokeopcua.connectionNotFound";
    public static final String ERR_CONNECTION_FRAMEWORK_ERROR = "invokeopcua.connectionFrameworkError_connection";
}
