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
 * Bean to hold Input Parameter item details aligned with OpcUaArgumentInfo
 *
 * @author Lovish
 */
public class InputParameterItem {

    private String name;
    private String dataType;
    private String dataTypeName;
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
}
