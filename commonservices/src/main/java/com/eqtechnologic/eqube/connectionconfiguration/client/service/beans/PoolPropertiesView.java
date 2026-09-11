package com.eqtechnologic.eqube.connectionconfiguration.client.service.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.Serializable;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PoolPropertiesView implements Serializable {

    private static final long serialVersionUID = 1L;

    public PoolPropertiesView() {
    }
}
