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
 * Bean to hold Input Parameter item details aligned with OpcUaArgumentInfo
 *
 * @author Lovish
 */
@ComparableEntity(name = "WriteToOPCUAInputParameter")
public class InputParameterItem implements eQCVTBeans, Entity {

    private boolean isDisable;

    @EntityAttribute(index = 0, attrName = "Parameter Name", partOfKey = true, displayName = true)
    private String name;

    private String dataType;

    @EntityAttribute(index = 1, attrName = "Data Type")
    private String dataTypeName;

    @EntityAttribute(index = 2, attrName = "Value")
    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, mandatory = false)
    private String value;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDataType() {
        return dataType != null ? dataType : dataTypeName;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
        this.dataTypeName = dataType;
    }

    public String getDataTypeName() {
        return dataTypeName != null ? dataTypeName : dataType;
    }

    public void setDataTypeName(String dataTypeName) {
        this.dataTypeName = dataTypeName;
        this.dataType = dataTypeName;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public boolean isEmpty() {
        return name == null || name.isEmpty();
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
