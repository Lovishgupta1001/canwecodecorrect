package com.eqtechnologic.eqube.mi.ui.common.services.uibeans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DeviceConnectorBean extends ConnectionUIBean {

    private static final long serialVersionUID = 1L;

    private String connectionType;

    public DeviceConnectorBean() {
        super();
    }

    public String getConnectionType() {
        return connectionType;
    }

    public void setConnectionType(String connectionType) {
        this.connectionType = connectionType;
    }
}
