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

import com.eqtechnologic.eqube.commonui.components.eQError;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Validator for Write To OPC UA activity
 *
 * @author Lovish
 */
@SuppressWarnings("java:S3740")
public class WriteToOPCUAValidator implements ComponentValidator<Map, Map> {

    @Override
    public List<eQError> validate(Map configMap, Map additionalInfo) {
        if (configMap == null || configMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<eQError> errors = new ArrayList<>();

        Object transportName = configMap.get(WriteToOPCUAConstants.TRANSPORT_NAME);
        if (transportName == null || transportName.toString().trim().isEmpty()) {
            errors.add(new eQError("WriteToOPCUA.TransportName.Required", "Transport Name is required."));
        }

        return errors;
    }
}
