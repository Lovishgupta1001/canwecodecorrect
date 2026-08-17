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

import java.util.ArrayList;
import java.util.List;

/**
 * Bean to hold Call Method grid item details aligned with OpcUaMethodWriteItem
 *
 * @author Lovish
 */
public class CallMethodItem {

    private String name;
    private String nodeId;
    private String objectNodeId;
    private Object inputParameters; // Can be List<InputParameterItem> or expression String when dynamic
    private List<InputParameterItem> inputArguments = new ArrayList<>();
    private List<InputParameterItem> outputArguments = new ArrayList<>();
    private String outputValue;
    private String nodeIdHelpText;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMethodName() {
        return name;
    }

    public void setMethodName(String methodName) {
        this.name = methodName;
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getObjectNodeId() {
        return objectNodeId;
    }

    public void setObjectNodeId(String objectNodeId) {
        this.objectNodeId = objectNodeId;
    }

    public Object getInputParameters() {
        return inputParameters != null ? inputParameters : inputArguments;
    }

    public void setInputParameters(Object inputParameters) {
        this.inputParameters = inputParameters;
    }

    public List<InputParameterItem> getInputArguments() {
        return inputArguments;
    }

    public void setInputArguments(List<InputParameterItem> inputArguments) {
        this.inputArguments = inputArguments != null ? inputArguments : new ArrayList<>();
    }

    public List<InputParameterItem> getOutputArguments() {
        return outputArguments;
    }

    public void setOutputArguments(List<InputParameterItem> outputArguments) {
        this.outputArguments = outputArguments != null ? outputArguments : new ArrayList<>();
    }

    public String getOutputValue() {
        return outputValue;
    }

    public void setOutputValue(String outputValue) {
        this.outputValue = outputValue;
    }

    public String getNodeIdHelpText() {
        return nodeIdHelpText;
    }

    public void setNodeIdHelpText(String nodeIdHelpText) {
        this.nodeIdHelpText = nodeIdHelpText;
    }
}
