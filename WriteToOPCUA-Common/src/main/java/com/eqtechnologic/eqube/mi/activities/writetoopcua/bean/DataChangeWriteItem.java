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
import com.eqtechnologic.eqube.mi.component.annotations.ComponentData;
import com.eqtechnologic.eqube.mi.componentservices.exprbuilder.constants.ExpressionBuilderConstants;
import com.eqtechnologic.eqube.mi.util.eQStatusMessage;

import java.util.List;

/**
 * Bean to hold Data Change Write grid item details aligned with OpcUaDataChangeWriteItem
 *
 * @author Lovish
 */
@ComparableEntity(name = "WriteToOPCUADataChangeWrite")
public class DataChangeWriteItem implements eQCVTBeans, Entity {

    private boolean isDisable;

    @EntityAttribute(index = 0, attrName = "Data Change Name", partOfKey = true, displayName = true)
    private String name;

    @EntityAttribute(index = 1, attrName = "Node ID")
    private String nodeId;

    private String dataTypeName;
    private String dataTypeNodeId;

    @EntityAttribute(index = 2, attrName = "Sample Value")
    private String sampleValue;

    @EntityAttribute(index = 3, attrName = "New Value")
    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, mandatory = false)
    private String newValue;

    private String nodeIdHelpText;
    private String sampleValueHelpText;

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

    public String getDataTypeName() {
        return dataTypeName;
    }

    public void setDataTypeName(String dataTypeName) {
        this.dataTypeName = dataTypeName;
    }

    public String getDataTypeNodeId() {
        return dataTypeNodeId;
    }

    public void setDataTypeNodeId(String dataTypeNodeId) {
        this.dataTypeNodeId = dataTypeNodeId;
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
