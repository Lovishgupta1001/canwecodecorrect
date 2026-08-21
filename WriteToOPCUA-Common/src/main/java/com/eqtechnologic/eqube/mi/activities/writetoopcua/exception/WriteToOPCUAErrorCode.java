/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.writetoopcua.exception;

import com.eqtechnologic.eqube.code.GroupCode;
import com.eqtechnologic.eqube.exception.ErrorCode;
import com.eqtechnologic.eqube.mi.modulecodes.ModuleErrorCode;

/**
 * Error codes for Write To OPC UA activity
 *
 * @author Lovish
 */
public enum WriteToOPCUAErrorCode implements ErrorCode {

    ERROR_WHILE_FETCHING_OPCUA_TRANSPORT_LIST(902001, "Error occurred while getting OPC UA transport list"),
    ERROR_WHILE_TESTING_TRANSPORT(902002, "Error occurred while testing transport"),
    ERROR_WHILE_VALIDATING_TRANSPORT(902003, "Error occurred while validating transport"),
    ERROR_WHILE_VALIDATING_EXPRESSION(902004, "Error occurred while validating expression"),
    ERROR_WHILE_FETCHING_TRANSPORT_DETAILS(902005, "Error occurred while getting transport details");

    private final int errorCode;
    private final String errorMessage;

    WriteToOPCUAErrorCode(int i, String s) {
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
