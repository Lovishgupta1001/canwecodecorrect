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

import com.eqtechnologic.eqube.commonui.components.eQCVTBeans;
import com.eqtechnologic.eqube.entitydiff.api.Entity;
import com.eqtechnologic.eqube.entitydiff.api.annotations.ComparableEntity;
import com.eqtechnologic.eqube.entitydiff.api.annotations.EntityAttribute;
import com.eqtechnologic.eqube.mi.util.eQStatusMessage;

import java.util.ArrayList;
import java.util.List;

/**
 * Bean to hold Call Method grid item details aligned with OpcUaMethodWriteItem
 *
 * @author Lovish
 */
@ComparableEntity(name = "WriteToOPCUACallMethod")
public class CallMethodItem implements eQCVTBeans, Entity {

    private boolean isDisable;

    @EntityAttribute(index = 0, attrName = "Method Name", partOfKey = true, displayName = true)
    private String name;

    @EntityAttribute(index = 1, attrName = "Node ID")
    private String nodeId;

    @EntityAttribute(index = 2, attrName = "Object Node ID")
    private String objectNodeId;

    private Object inputParameters;
    private List<InputParameterItem> inputArguments = new ArrayList<>();
    private List<InputParameterItem> outputArguments = new ArrayList<>();

    @EntityAttribute(index = 3, attrName = "Output Value")
    private String outputValue;

    private String nodeIdHelpText;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    @Override
    public boolean isEmpty() {
        return (name == null || name.isEmpty()) && (nodeId == null || nodeId.isEmpty());
    }

    @Override
    public boolean isSelectTable() {
        return isDisable;
    }

    @Override
    public void setSelectTable(boolean disabled) {
        this.isDisable = disabled;
    }

    @Override
    public List<eQStatusMessage> validate() {
        return null;
    }
}
