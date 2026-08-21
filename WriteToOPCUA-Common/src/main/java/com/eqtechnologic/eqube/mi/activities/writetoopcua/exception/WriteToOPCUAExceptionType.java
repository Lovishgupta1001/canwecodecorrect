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

import com.eqtechnologic.eqube.exception.ExceptionType;

/**
 * Exception types for Write To OPC UA activity
 *
 * @author Lovish
 */
public enum WriteToOPCUAExceptionType implements ExceptionType {

    WRITE_TO_OPCUA_ACTIVITY_EXCEPTION;

    @Override
    public String getType() {
        return name();
    }
}
