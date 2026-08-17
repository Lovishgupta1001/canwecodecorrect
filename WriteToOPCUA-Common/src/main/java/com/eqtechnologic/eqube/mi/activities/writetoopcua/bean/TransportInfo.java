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

import java.util.List;

/**
 * Bean to hold Write To OPC UA Transport Info
 *
 * @author Lovish
 */
public class TransportInfo {

    private String transportName;
    private Long transportId;
    private List<DataChangeWriteItem> dataChangeOptions;
    private List<CallMethodItem> callMethodOptions;

    public String getTransportName() {
        return transportName;
    }

    public void setTransportName(String transportName) {
        this.transportName = transportName;
    }

    public Long getTransportId() {
        return transportId;
    }

    public void setTransportId(Long transportId) {
        this.transportId = transportId;
    }

    public List<DataChangeWriteItem> getDataChangeOptions() {
        return dataChangeOptions;
    }

    public void setDataChangeOptions(List<DataChangeWriteItem> dataChangeOptions) {
        this.dataChangeOptions = dataChangeOptions;
    }

    public List<CallMethodItem> getCallMethodOptions() {
        return callMethodOptions;
    }

    public void setCallMethodOptions(List<CallMethodItem> callMethodOptions) {
        this.callMethodOptions = callMethodOptions;
    }
}
