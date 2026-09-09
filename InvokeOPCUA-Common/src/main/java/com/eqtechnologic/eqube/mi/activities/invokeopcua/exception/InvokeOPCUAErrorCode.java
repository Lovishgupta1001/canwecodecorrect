/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.invokeopcua.exception;

import com.eqtechnologic.eqube.code.GroupCode;
import com.eqtechnologic.eqube.exception.ErrorCode;
import com.eqtechnologic.eqube.mi.modulecodes.ModuleErrorCode;

/**
 * Error codes for Invoke OPC UA activity
 *
 * @author Lovish
 */
public enum InvokeOPCUAErrorCode implements ErrorCode {

    ERROR_WHILE_FETCHING_CONNECTION_LIST(902001, "Error occurred while getting connection list"),
    ERROR_WHILE_TESTING_CONNECTION(902002, "Error occurred while testing connection"),
    ERROR_WHILE_VALIDATING_CONNECTION(902003, "Error occurred while validating connection"),
    ERROR_WHILE_VALIDATING_EXPRESSION(902004, "Error occurred while validating expression"),
    ERROR_WHILE_FETCHING_CONNECTION_DETAILS(902005, "Error occurred while getting connection details");

    private final int errorCode;
    private final String errorMessage;

    InvokeOPCUAErrorCode(int i, String s) {
        this.errorCode = i;
        this.errorMessage = s;
    }

    @Override
    public int getNumber() {
        return this.errorCode;
    }

    @Override
    public int getGroup() {
        return GroupCode.MI.val();
    }

    @Override
    public int getModule() {
        return ModuleErrorCode.COMPONENT_SERVICE.value();
    }

    @Override
    public String getMessage() {
        return this.errorMessage;
    }
}
