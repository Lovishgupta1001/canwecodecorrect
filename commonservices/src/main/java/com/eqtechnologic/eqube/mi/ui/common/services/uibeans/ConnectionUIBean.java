package com.eqtechnologic.eqube.mi.ui.common.services.uibeans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.Serializable;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ConnectionUIBean implements Serializable {

    private static final long serialVersionUID = 1L;

    private long connectionId;
    private String connectionName;
    private String connectionDesc;
    private String connectionStatus;
    private Long creationDate;
    private String creator;
    private String lastUpdateBy;
    private Long lastUpdateDate;

    private String pluginName;
    private boolean saveCredentials;
    private String xmldata;
    private boolean isCreateModel;
    private String pluginDisplayName;
    private boolean isRemote;
    private boolean isPluginBased;
    private String pluginVersion;
    private String pluginInstanceName;
    private String pluginClassName;
    private String pluginUIName;
    private String pluginUIDisplayName;
    private String connectionColor;
    private boolean useConnectionForAuthentication;
    private String connectionType;

    public ConnectionUIBean() {
    }

    public long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(long connectionId) {
        this.connectionId = connectionId;
    }

    public String getConnectionName() {
        return connectionName;
    }

    public void setConnectionName(String connectionName) {
        this.connectionName = connectionName;
    }

    public String getConnectionDesc() {
        return connectionDesc;
    }

    public void setConnectionDesc(String connectionDesc) {
        this.connectionDesc = connectionDesc;
    }

    public String getConnectionStatus() {
        return connectionStatus;
    }

    public void setConnectionStatus(String connectionStatus) {
        this.connectionStatus = connectionStatus;
    }

    public Long getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(Long creationDate) {
        this.creationDate = creationDate;
    }

    public String getCreator() {
        return creator;
    }

    public void setCreator(String creator) {
        this.creator = creator;
    }

    public String getLastUpdateBy() {
        return lastUpdateBy;
    }

    public void setLastUpdateBy(String lastUpdateBy) {
        this.lastUpdateBy = lastUpdateBy;
    }

    public Long getLastUpdateDate() {
        return lastUpdateDate;
    }

    public void setLastUpdateDate(Long lastUpdateDate) {
        this.lastUpdateDate = lastUpdateDate;
    }

    public String getPluginName() {
        return pluginName;
    }

    public void setPluginName(String pluginName) {
        this.pluginName = pluginName;
    }

    public boolean isSaveCredentials() {
        return saveCredentials;
    }

    public void setSaveCredentials(boolean saveCredentials) {
        this.saveCredentials = saveCredentials;
    }

    public String getXmldata() {
        return xmldata;
    }

    public void setXmldata(String xmldata) {
        this.xmldata = xmldata;
    }

    public boolean isCreateModel() {
        return isCreateModel;
    }

    public void setCreateModel(boolean createModel) {
        isCreateModel = createModel;
    }

    public String getPluginDisplayName() {
        return pluginDisplayName;
    }

    public void setPluginDisplayName(String pluginDisplayName) {
        this.pluginDisplayName = pluginDisplayName;
    }

    public boolean isRemote() {
        return isRemote;
    }

    public void setRemote(boolean remote) {
        isRemote = remote;
    }

    public boolean isPluginBased() {
        return isPluginBased;
    }

    public void setPluginBased(boolean pluginBased) {
        isPluginBased = pluginBased;
    }

    public String getPluginVersion() {
        return pluginVersion;
    }

    public void setPluginVersion(String pluginVersion) {
        this.pluginVersion = pluginVersion;
    }

    public String getPluginInstanceName() {
        return pluginInstanceName;
    }

    public void setPluginInstanceName(String pluginInstanceName) {
        this.pluginInstanceName = pluginInstanceName;
    }

    public String getPluginClassName() {
        return pluginClassName;
    }

    public void setPluginClassName(String pluginClassName) {
        this.pluginClassName = pluginClassName;
    }

    public String getPluginUIName() {
        return pluginUIName;
    }

    public void setPluginUIName(String pluginUIName) {
        this.pluginUIName = pluginUIName;
    }

    public String getPluginUIDisplayName() {
        return pluginUIDisplayName;
    }

    public void setPluginUIDisplayName(String pluginUIDisplayName) {
        this.pluginUIDisplayName = pluginUIDisplayName;
    }

    public String getConnectionColor() {
        return connectionColor;
    }

    public void setConnectionColor(String connectionColor) {
        this.connectionColor = connectionColor;
    }

    public boolean isUseConnectionForAuthentication() {
        return useConnectionForAuthentication;
    }

    public void setUseConnectionForAuthentication(boolean useConnectionForAuthentication) {
        this.useConnectionForAuthentication = useConnectionForAuthentication;
    }

    public String getConnectionType() {
        return connectionType;
    }

    public void setConnectionType(String connectionType) {
        this.connectionType = connectionType;
    }
}
