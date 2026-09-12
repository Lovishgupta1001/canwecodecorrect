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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Output bean for Invoke OPC UA Activity
 *
 * @author Lovish
 */
public class InvokeOPCUAOutputBean {

    private List<Object> successfulWriteItems = new ArrayList<>();
    private List<Object> failedWriteItems = new ArrayList<>();
    private List<Object> skippedWriteItems = new ArrayList<>();

    public InvokeOPCUAOutputBean(Object response) {
        if (response instanceof Map) {
            Map<String, List<String>> result = (Map<String, List<String>>) response;
            if (result.get("successfulWriteItems") != null) {
                this.successfulWriteItems = new ArrayList<>(result.get("successfulWriteItems"));
            }
            if (result.get("failedWriteItems") != null) {
                this.failedWriteItems = new ArrayList<>(result.get("failedWriteItems"));
            }
            if (result.get("skippedWriteItems") != null) {
                this.skippedWriteItems = new ArrayList<>(result.get("skippedWriteItems"));
            }
        }
    }

    public List<Object> getSuccessfulWriteItems() {
        return successfulWriteItems;
    }

    public void setSuccessfulWriteItems(List<Object> successfulWriteItems) {
        this.successfulWriteItems = successfulWriteItems;
    }

    public List<Object> getFailedWriteItems() {
        return failedWriteItems;
    }

    public void setFailedWriteItems(List<Object> failedWriteItems) {
        this.failedWriteItems = failedWriteItems;
    }

    public List<Object> getSkippedWriteItems() {
        return skippedWriteItems;
    }

    public void setSkippedWriteItems(List<Object> skippedWriteItems) {
        this.skippedWriteItems = skippedWriteItems;
    }
}
