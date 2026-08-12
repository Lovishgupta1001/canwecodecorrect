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
 * Bean to hold Call Method grid item details
 *
 * @author Lovish
 */
public class CallMethodItem {

    private String methodName;
    private String nodeId;
    private Object inputParameters; // Can be List<InputParameterItem> or expression String when dynamic
    private String outputValue;
    private String nodeIdHelpText;

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public Object getInputParameters() {
        return inputParameters;
    }

    public void setInputParameters(Object inputParameters) {
        this.inputParameters = inputParameters;
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
