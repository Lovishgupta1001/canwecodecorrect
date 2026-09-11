package com.eqtechnologic.eqube.connectionconfiguration.client.service.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.Serializable;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ConnectionPropertiesView implements Serializable {

    private static final long serialVersionUID = -3610956227386322143L;
    private String propertyName;
    private String propertyValue;
    private String connectionPropertiesType;

    public ConnectionPropertiesView() {
    }

    public String getPropertyName() {
        return this.propertyName;
    }

    public String getPropertyValue() {
        return this.propertyValue;
    }

    public String getConnectionPropertiesType() {
        return this.connectionPropertiesType;
    }

    public void setPropertyName(String propertyName) {
        this.propertyName = propertyName;
    }

    public void setPropertyValue(String propertyValue) {
        this.propertyValue = propertyValue;
    }

    public void setConnectionPropertiesType(String connectionPropertiesType) {
        this.connectionPropertiesType = connectionPropertiesType;
    }
}
