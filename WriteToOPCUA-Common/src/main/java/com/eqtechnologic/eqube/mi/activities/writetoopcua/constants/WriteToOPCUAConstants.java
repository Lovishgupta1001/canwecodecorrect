/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.writetoopcua.constants;

public final class WriteToOPCUAConstants {

    private WriteToOPCUAConstants() {
        // Private constructor
    }

    public static final String WRITE_TO_OPCUA = "WriteToOPCUA";
    public static final String DATA_CHANGE_WRITE = "DataChangeWrite";
    public static final String CALL_METHOD = "CallMethod";
    public static final String PARALLEL = "Parallel";
    public static final String SEQUENTIAL = "Sequential";
    public static final String DYNAMIC_TRANSPORT = "dynamicTransport";
    public static final String TRANSPORT_NAME = "transportName";
    public static final String OPERATION = "operation";
    public static final String EXECUTION_MODE = "executionMode";
    public static final String OPCUA_TYPE = "OPCUA";

    // Validation Error Keys
    public static final String ERR_SEL_TRANSPORT = "writetoopcua.selTransport";
    public static final String ERR_EMPTY_DATA_CHANGE_WRITE = "writetoopcua.emptyDataChangeWrite";
    public static final String ERR_EMPTY_CALL_METHOD = "writetoopcua.emptyCallMethod";
    public static final String ERR_EMPTY_DATA_CHANGE_NAME = "writetoopcua.emptyDataChangeName";
    public static final String ERR_EMPTY_NEW_VALUE = "writetoopcua.emptyNewValue";
    public static final String ERR_EMPTY_METHOD_NAME = "writetoopcua.emptyMethodName";
    public static final String ERR_EMPTY_PARAMETER_VALUE = "writetoopcua.emptyParameterValue";
    public static final String ERR_TRANSPORT_NOT_FOUND = "writetoopcua.transportNotFound";
    public static final String ERR_TRANSPORT_FRAMEWORK_ERROR = "writetoopcua.transportFrameworkError_transport";
}
