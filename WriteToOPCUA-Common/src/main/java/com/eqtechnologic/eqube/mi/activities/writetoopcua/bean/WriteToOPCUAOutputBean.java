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

import java.util.HashMap;
import java.util.Map;

/**
 * Output bean for Write To OPC UA Activity
 *
 * @author Lovish
 */
public class WriteToOPCUAOutputBean {

    private Boolean status = Boolean.TRUE;
    private String message;
    private Map<String, Object> outputResults = new HashMap<>();

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getOutputResults() {
        return outputResults;
    }

    public void setOutputResults(Map<String, Object> outputResults) {
        this.outputResults = outputResults;
    }
}
