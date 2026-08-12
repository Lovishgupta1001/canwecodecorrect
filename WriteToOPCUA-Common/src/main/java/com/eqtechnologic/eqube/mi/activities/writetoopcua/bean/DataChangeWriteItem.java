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

/**
 * Bean to hold Data Change Write grid item details
 *
 * @author Lovish
 */
public class DataChangeWriteItem {

    private String dataChangeName;
    private String nodeId;
    private String sampleValue;
    private String newValue;
    private String nodeIdHelpText;
    private String sampleValueHelpText;

    public String getDataChangeName() {
        return dataChangeName;
    }

    public void setDataChangeName(String dataChangeName) {
        this.dataChangeName = dataChangeName;
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getSampleValue() {
        return sampleValue;
    }

    public void setSampleValue(String sampleValue) {
        this.sampleValue = sampleValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getNodeIdHelpText() {
        return nodeIdHelpText;
    }

    public void setNodeIdHelpText(String nodeIdHelpText) {
        this.nodeIdHelpText = nodeIdHelpText;
    }

    public String getSampleValueHelpText() {
        return sampleValueHelpText;
    }

    public void setSampleValueHelpText(String sampleValueHelpText) {
        this.sampleValueHelpText = sampleValueHelpText;
    }
}
