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

import com.eqtechnologic.eqube.exception.ExceptionType;

/**
 * Exception types for Invoke OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings("java:S6548")
public enum InvokeOPCUAExceptionType implements ExceptionType {

    INVOKE_OPCUA_ACTIVITY_EXCEPTION;

    @Override
    public String getType() {
        return name();
    }
}
