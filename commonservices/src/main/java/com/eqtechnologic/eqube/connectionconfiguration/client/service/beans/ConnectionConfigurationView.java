package com.eqtechnologic.eqube.connectionconfiguration.client.service.beans;

import com.eqtechnologic.eqube.logging.Logger;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.io.Serializable;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ConnectionConfigurationView implements Serializable {

    private static final Logger logger = Logger.getLogger(ConnectionConfigurationView.class.getName());
    private static final long serialVersionUID = 3424457938195955461L;

    private long connectionId;
    private String connectionName;

    @JsonAlias({"connDescription"})
    private String connectionDesc;

    private int connectionStatus;
    private String pluginName;
    private String pluginDisplayName;
    private String pluginVersion;

    @JsonAlias({"pluginInstance"})
    private String pluginInstanceName;

    private String pluginClassName;
    private String pluginDisplayNameWithVersionAndInstance;
    private boolean isPluginBased;
    private boolean isCreateModel;
    private boolean isRemote;
    private boolean saveCredentials;
    private String consumerUrl;
    private String directoryName;
    private String driverName;
    private String applicationPlatform;
    private String xmldata;
    private Map<String, ConnectionPropertiesView> connectionProperties;

    @JsonAlias({"poolProperties"})
    private PoolPropertiesView poolPropertiesBean;

    private String creator;
    private Long creationDate;
    private String lastUpdateBy;
    private Long lastUpdateDate;

    public ConnectionConfigurationView() {
    }

    public ConnectionConfigurationView(long connectionId, String connectionName, String connectionDesc, int connectionStatus,
                                       String pluginName, String pluginDisplayName, String pluginVersion,
                                       String pluginInstanceName, String pluginClassName,
                                       String pluginDisplayNameWithVersionAndInstance, boolean isPluginBased,
                                       boolean isCreateModel, boolean isRemote, boolean saveCredentials,
                                       String consumerUrl, String directoryName, String driverName,
                                       String applicationPlatform, String xmldata,
                                       Map<String, ConnectionPropertiesView> connectionProperties,
                                       PoolPropertiesView poolPropertiesBean, String creator, Long creationDate,
                                       String lastUpdateBy, Long lastUpdateDate) {
        this.connectionId = connectionId;
        this.connectionName = connectionName;
        this.connectionDesc = connectionDesc;
        this.connectionStatus = connectionStatus;
        this.pluginName = pluginName;
        this.pluginDisplayName = pluginDisplayName;
        this.pluginVersion = pluginVersion;
        this.pluginInstanceName = pluginInstanceName;
        this.pluginClassName = pluginClassName;
        this.pluginDisplayNameWithVersionAndInstance = pluginDisplayNameWithVersionAndInstance;
        this.isPluginBased = isPluginBased;
        this.isCreateModel = isCreateModel;
        this.isRemote = isRemote;
        this.saveCredentials = saveCredentials;
        this.consumerUrl = consumerUrl;
        this.directoryName = directoryName;
        this.driverName = driverName;
        this.applicationPlatform = applicationPlatform;
        this.xmldata = xmldata;
        this.connectionProperties = connectionProperties;
        this.poolPropertiesBean = poolPropertiesBean;
        this.creator = creator;
        this.creationDate = creationDate;
        this.lastUpdateBy = lastUpdateBy;
        this.lastUpdateDate = lastUpdateDate;
    }

    @Deprecated(since = "1.0.114", forRemoval = true)
    public String getDirectoryName() {
        return this.directoryName;
    }

    @JsonIgnore
    public boolean isSSOEnabled() {
        if (this.connectionProperties == null) {
            return false;
        } else {
            ConnectionPropertiesView ssoEnabled = this.connectionProperties.get("SSOEnabled");
            return ssoEnabled != null && Boolean.parseBoolean(ssoEnabled.getPropertyValue());
        }
    }

    public long getConnectionId() {
        return this.connectionId;
    }

    public String getConnectionName() {
        return this.connectionName;
    }

    public String getConnectionDesc() {
        return this.connectionDesc;
    }

    public int getConnectionStatus() {
        return this.connectionStatus;
    }

    public String getPluginName() {
        return this.pluginName;
    }

    public String getPluginDisplayName() {
        return this.pluginDisplayName;
    }

    public String getPluginVersion() {
        return this.pluginVersion;
    }

    public String getPluginInstanceName() {
        return this.pluginInstanceName;
    }

    public String getPluginClassName() {
        return this.pluginClassName;
    }

    public String getPluginDisplayNameWithVersionAndInstance() {
        return this.pluginDisplayNameWithVersionAndInstance;
    }

    public boolean isPluginBased() {
        return this.isPluginBased;
    }

    public boolean isCreateModel() {
        return this.isCreateModel;
    }

    public boolean isRemote() {
        return this.isRemote;
    }

    public boolean isSaveCredentials() {
        return this.saveCredentials;
    }

    public String getConsumerUrl() {
        return this.consumerUrl;
    }

    public String getDriverName() {
        return this.driverName;
    }

    public String getApplicationPlatform() {
        return this.applicationPlatform;
    }

    public String getXmldata() {
        return this.xmldata;
    }

    public Map<String, ConnectionPropertiesView> getConnectionProperties() {
        return this.connectionProperties;
    }

    public PoolPropertiesView getPoolPropertiesBean() {
        return this.poolPropertiesBean;
    }

    public String getCreator() {
        return this.creator;
    }

    public Long getCreationDate() {
        return this.creationDate;
    }

    public String getLastUpdateBy() {
        return this.lastUpdateBy;
    }

    public Long getLastUpdateDate() {
        return this.lastUpdateDate;
    }

    public void setConnectionId(long connectionId) {
        this.connectionId = connectionId;
    }

    public void setConnectionName(String connectionName) {
        this.connectionName = connectionName;
    }

    public void setConnectionDesc(String connectionDesc) {
        this.connectionDesc = connectionDesc;
    }

    public void setConnectionStatus(int connectionStatus) {
        this.connectionStatus = connectionStatus;
    }

    public void setPluginName(String pluginName) {
        this.pluginName = pluginName;
    }

    public void setPluginDisplayName(String pluginDisplayName) {
        this.pluginDisplayName = pluginDisplayName;
    }

    public void setPluginVersion(String pluginVersion) {
        this.pluginVersion = pluginVersion;
    }

    public void setPluginInstanceName(String pluginInstanceName) {
        this.pluginInstanceName = pluginInstanceName;
    }

    public void setPluginClassName(String pluginClassName) {
        this.pluginClassName = pluginClassName;
    }

    public void setPluginDisplayNameWithVersionAndInstance(String pluginDisplayNameWithVersionAndInstance) {
        this.pluginDisplayNameWithVersionAndInstance = pluginDisplayNameWithVersionAndInstance;
    }

    public void setPluginBased(boolean isPluginBased) {
        this.isPluginBased = isPluginBased;
    }

    public void setCreateModel(boolean isCreateModel) {
        this.isCreateModel = isCreateModel;
    }

    public void setRemote(boolean isRemote) {
        this.isRemote = isRemote;
    }

    public void setSaveCredentials(boolean saveCredentials) {
        this.saveCredentials = saveCredentials;
    }

    public void setConsumerUrl(String consumerUrl) {
        this.consumerUrl = consumerUrl;
    }

    public void setDirectoryName(String directoryName) {
        this.directoryName = directoryName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public void setApplicationPlatform(String applicationPlatform) {
        this.applicationPlatform = applicationPlatform;
    }

    public void setXmldata(String xmldata) {
        this.xmldata = xmldata;
    }

    public void setConnectionProperties(Map<String, ConnectionPropertiesView> connectionProperties) {
        this.connectionProperties = connectionProperties;
    }

    public void setPoolPropertiesBean(PoolPropertiesView poolPropertiesBean) {
        this.poolPropertiesBean = poolPropertiesBean;
    }

    public void setCreator(String creator) {
        this.creator = creator;
    }

    public void setCreationDate(Long creationDate) {
        this.creationDate = creationDate;
    }

    public void setLastUpdateBy(String lastUpdateBy) {
        this.lastUpdateBy = lastUpdateBy;
    }

    public void setLastUpdateDate(Long lastUpdateDate) {
        this.lastUpdateDate = lastUpdateDate;
    }
}
