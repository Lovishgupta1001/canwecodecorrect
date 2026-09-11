#!/bin/bash
# ==============================================================================
# Script to generate DeviceConnectorConnection folder structure and source files
# Run this script from the directory where you want DeviceConnectorConnection to be created:
#   sh create_device_connector_connection.sh
#   or: bash create_device_connector_connection.sh
# ==============================================================================

set -e

TARGET_DIR="${1:-$(pwd)}"
ROOT_DIR="$TARGET_DIR/DeviceConnectorConnection"

echo "Creating DeviceConnectorConnection structure at: $ROOT_DIR"

mkdir -p "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/beans"
mkdir -p "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/constants"
mkdir -p "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/service"

mkdir -p "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/helper"
mkdir -p "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/service"
mkdir -p "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/validator"

mkdir -p "$ROOT_DIR/DeviceConnectorConnection-UIServices/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/controller"

# ------------------------------------------------------------------------------
# 1. Root pom.xml
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/pom.xml"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>device-connector-components</artifactId>
        <groupId>com.eqtechnologic.eqube.mi</groupId>
        <version>8.1.0.0.13</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>deviceconnector-connection</artifactId>
    <packaging>pom</packaging>
    <modules>
        <module>DeviceConnectorConnection-ServiceImpl</module>
        <module>DeviceConnectorConnection-UIServices</module>
        <module>DeviceConnectorConnection-Service</module>
    </modules>

</project>
EOF

# ------------------------------------------------------------------------------
# 2. Root project-tree.txt
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/project-tree.txt"
Folder PATH listing 

Volume serial number is 00000017 C401:EE1D 

D:\DeviceConnectorConnection 
|   pom.xml 
|   project-tree.txt 
|    
+---DeviceConnectorConnection-Service 
|   |   pom.xml 
|   |   proguard.conf 
|   |    
|   \---src 
|       \---main 
|           \---java 
|               \---com 
|                   \---eqtechnologic 
|                       \---eqube 
|                           \---mi 
|                               \---componentservices 
|                                   \---deviceconnectorconnection 
|                                       +---beans 
|                                       |       DeviceConnectorConnCompInitialInput.java 
|                                       |       DeviceConnectorPluginDefinition.java 
|                                       |       DeviceConnectorValidationResult.java 
|                                       |        
|                                       +---constants 
|                                       |       DeviceConnectorConstants.java 
|                                       |        
|                                       \---service 
|                                               DeviceConnectorConnectionService.java 
|                                                
+---DeviceConnectorConnection-ServiceImpl 
|   |   pom.xml 
|   |   proguard.conf 
|   |    
|   \---src 
|       \---main 
|           \---java 
|               \---com 
|                   \---eqtechnologic 
|                       \---eqube 
|                           \---mi 
|                               \---componentservices 
|                                   \---deviceconnectorconnection 
|                                       +---helper 
|                                       |       DeviceConnectorHelper.java 
|                                       |        
|                                       +---service 
|                                       |       DeviceConnectorConnection.java 
|                                       |        
|                                       \---validator 
|                                               DeviceConnectorConnectionValidator.java 
|                                                
\---DeviceConnectorConnection-UIServices 
    |   pom.xml 
    |   proguard.conf 
    |   project-tree.txt 
    |    
    \---src 
        \---main 
            \---java 
                \---com 
                    \---eqtechnologic 
                        \---eqube 
                            \---mi 
                                \---componentservices 
                                    \---deviceconnectorconnection 
                                        \---controller 
                                                DeviceConnectorControllerHelper.java 
                                                DeviceConnectorRestController.java 
EOF

# ------------------------------------------------------------------------------
# 3. DeviceConnectorConnection-Service / pom.xml
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/pom.xml"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>deviceconnector-connection</artifactId>
        <groupId>com.eqtechnologic.eqube.mi</groupId>
        <version>8.1.0.0.13</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>deviceconnector-connection-service</artifactId>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>com.github.wvengen</groupId>
                <artifactId>proguard-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
    <dependencies>
        <dependency>
            <groupId>com.eqtechnologic.eqube.adminconsole</groupId>
            <artifactId>componentframework-service</artifactId>
            <version>${adminconsole.version}</version>
            <classifier>${jarClassifier}</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.soa</groupId>
            <artifactId>servicemanagement</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-annotations</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.utils</groupId>
            <artifactId>exception</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>

</project>
EOF

# ------------------------------------------------------------------------------
# 4. DeviceConnectorConnection-Service / proguard.conf
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/proguard.conf"
-dontnote 
-dontwarn 
-dontshrink 
-dontoptimize 

-keeppackagenames 

-keepattributes Signature,Exceptions,InnerClasses,SourceFile,LineNumberTable,*Annotation* 

-keep class com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.**{ 
    public *; 
}
EOF

# ------------------------------------------------------------------------------
# 5. DeviceConnectorValidationResult.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/beans/DeviceConnectorValidationResult.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into. 
 */ 

package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans; 

/** 
 * Validation result for a device connector connection. 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorValidationResult { 

    private boolean valid = false; 
    private boolean connectionTypeValid = false; 
    private String connectionType = ""; 
    private String connectionName = ""; 
    private String message = ""; 

    public boolean isValid() { 
        return valid; 
    } 

    public void setValid(boolean valid) { 
        this.valid = valid; 
    } 

    public boolean isConnectionTypeValid() { 
        return connectionTypeValid; 
    } 

    public void setConnectionTypeValid(boolean connectionTypeValid) { 
        this.connectionTypeValid = connectionTypeValid; 
    } 

    public String getConnectionType() { 
        return connectionType; 
    } 

    public void setConnectionType(String connectionType) { 
        this.connectionType = connectionType; 
    } 

    public String getConnectionName() { 
        return connectionName; 
    } 

    public void setConnectionName(String connectionName) { 
        this.connectionName = connectionName; 
    } 

    public String getMessage() { 
        return message; 
    } 

    public void setMessage(String message) { 
        this.message = message; 
    } 

    @Override 
    public String toString() { 
        return "DeviceConnectorValidationResult{" + 
                "valid=" + valid + 
                ", connectionTypeValid=" + connectionTypeValid + 
                ", connectionType='" + connectionType + '\'' + 
                ", connectionName='" + connectionName + '\'' + 
                ", message='" + message + '\'' + 
                '}'; 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 6. DeviceConnectorConnCompInitialInput.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/beans/DeviceConnectorConnCompInitialInput.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans; 

import java.util.List; 

/** 
 * Initial input for device connector connection component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorConnCompInitialInput { 
    private List<Long> connIds; 

    public List<Long> getConnIds() { 
        return connIds; 
    } 

    public void setConnIds(List<Long> connIds) { 
        this.connIds = connIds; 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 7. DeviceConnectorPluginDefinition.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/beans/DeviceConnectorPluginDefinition.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into. 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans; 

import java.util.List; 
import com.fasterxml.jackson.annotation.JsonProperty; 

/** 
 * Plugin / connection type definition for device connector connection component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorPluginDefinition { 

    @JsonProperty("connectionType") 
    private String connectionType; 

    @JsonProperty("allowedTypes") 
    private List<String> allowedTypes; 

    public DeviceConnectorPluginDefinition() { 
    } 

    public DeviceConnectorPluginDefinition(String connectionType, List<String> allowedTypes) { 
        this.connectionType = connectionType; 
        this.allowedTypes = allowedTypes; 
    } 

    public String getConnectionType() { 
        return connectionType; 
    } 

    public void setConnectionType(String connectionType) { 
        this.connectionType = connectionType; 
    } 

    public List<String> getAllowedTypes() { 
        return allowedTypes; 
    } 

    public void setAllowedTypes(List<String> allowedTypes) { 
        this.allowedTypes = allowedTypes; 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 8. DeviceConnectorConstants.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/constants/DeviceConnectorConstants.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants; 

/** 
 * Constants for device connector connection component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorConstants { 

    private DeviceConnectorConstants(){ 
        // Empty private constructor 
    } 

    public static final String CONNECTION = "connectionComboBox"; 
    public static final String DEVICE_CONNECTOR_CONNECTION_SERVICE = "deviceConnectorConnectionService"; 
    public static final String CONNECTION_ID = "connectionId"; 
    public static final String CONNECTION_NAME = "connectionName"; 
    public static final String CONNECTION_TYPE = "connectionType"; 
    public static final String TYPE_OPCUA = "OPCUA"; 
}
EOF

# ------------------------------------------------------------------------------
# 9. DeviceConnectorConnectionService.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-Service/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/service/DeviceConnectorConnectionService.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 

package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.service; 

import com.eqtechnologic.eqube.mi.component.service.ComponentService; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorPluginDefinition; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import java.util.List; 
import java.util.Map; 

/** 
 * Service interface for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public interface DeviceConnectorConnectionService 
        extends ComponentService<DeviceConnectorConnCompInitialInput, Map, Object> { 

    /** 
     * Validate a device connector connection. 
     * 
     * @param connId ID of the connection to validate 
     * @param allowedConnectionTypes List of allowed connection types (e.g. OPCUA) 
     * @return DeviceConnectorValidationResult 
     */ 
    DeviceConnectorValidationResult validateConnection(Long connId, List<String> allowedConnectionTypes); 
}
EOF

# ------------------------------------------------------------------------------
# 10. DeviceConnectorConnection-ServiceImpl / pom.xml
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/pom.xml"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>deviceconnector-connection</artifactId>
        <groupId>com.eqtechnologic.eqube.mi</groupId>
        <version>8.1.0.0.13</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>deviceconnector-connection-serviceimpl</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.eqtechnologic.eqube.adminconsole</groupId>
            <artifactId>commonconnection-service</artifactId>
            <classifier>${jarClassifier}</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.applicationconnection</groupId>
            <artifactId>connectionconfigurationclient-service</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.eqtechnologic.eqube.adminconsole</groupId>
            <artifactId>componentframework-service</artifactId>
            <version>${adminconsole.version}</version>
            <classifier>${jarClassifier}</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.eqtechnologic.eqube.mi</groupId>
            <artifactId>deviceconnector-connection-service</artifactId>
            <version>${project.version}</version>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.utils</groupId>
            <artifactId>logging</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.utils</groupId>
            <artifactId>exception</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.soa</groupId>
            <artifactId>servicemanagement</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>com.github.wvengen</groupId>
                <artifactId>proguard-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
EOF

# ------------------------------------------------------------------------------
# 11. DeviceConnectorConnection-ServiceImpl / proguard.conf
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/proguard.conf"
-dontnote 
-dontwarn 
-dontshrink 
-dontoptimize 

-keeppackagenames 

-keepattributes Signature,Exceptions,InnerClasses,SourceFile,LineNumberTable,*Annotation* 

-keep class com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.**{ 
    public *; 
}
EOF

# ------------------------------------------------------------------------------
# 12. DeviceConnectorHelper.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/helper/DeviceConnectorHelper.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.helper; 

import com.eqtechnologic.eqube.commonconnection.service.CommonConnectionService; 
import com.eqtechnologic.eqube.commonconnection.service.constants.CommonConnectionConstants; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.ConnectionConfigClientService; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.beans.ConnectionConfigurationView; 
import com.eqtechnologic.eqube.connectionconfiguration.client.service.util.ConnectionConfigClientUtil; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 

import java.util.ArrayList; 
import java.util.List; 

/** 
 * Helper class for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorHelper { 

    private static final Logger LOGGER = Logger.getLogger(DeviceConnectorHelper.class.getName()); 

    private DeviceConnectorHelper() { 
        // Private constructor 
    } 

    public static List<Long> getConnectionList() throws BusinessException { 
        List<Long> connectionIds = new ArrayList<>(); 
        List<ConnectionConfigurationView> connectionConfigurationViewList = getCommonConnectionService().fetchAllAccessibleConn(); 
        if (connectionConfigurationViewList != null) { 
            for (ConnectionConfigurationView configurationView : connectionConfigurationViewList) { 
                if (!configurationView.isPluginBased()) { 
                    connectionIds.add(configurationView.getConnectionId()); 
                } 
            } 
        } 
        return connectionIds; 
    } 

    private static ConnectionConfigClientService getConnectionConfigurationClient() { 
        return ServiceRegistry.getInstance().getService(ConnectionConfigClientUtil.CONNECTION_CONFIGURATION_CLIENT_SERVICE_NAME); 
    } 

    public static DeviceConnectorValidationResult validateConnection(Long connId, List<String> allowedConnectionTypes) { 
        DeviceConnectorValidationResult result = new DeviceConnectorValidationResult(); 
        result.setValid(false); 

        if (connId == null || connId <= 0) { 
            result.setMessage("Connection ID is required."); 
            return result; 
        } 

        ConnectionConfigurationView configuration; 
        try { 
            configuration = getConnectionConfigurationClient().fetch(connId); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred while fetching connection: " + connId), e); 
            result.setMessage("Failed to retrieve connection details."); 
            return result; 
        } 

        if (configuration == null) { 
            result.setMessage("Connection configuration not found."); 
            return result; 
        } 

        String connType = configuration.getConnectionType(); 
        result.setConnectionType(connType != null ? connType : ""); 
        result.setConnectionName(configuration.getConnectionName()); 

        if (allowedConnectionTypes != null && !allowedConnectionTypes.isEmpty()) { 
            boolean typeMatched = allowedConnectionTypes.stream().anyMatch(type -> 
                type != null && type.equalsIgnoreCase(connType) 
            ); 
            result.setConnectionTypeValid(typeMatched); 
            result.setValid(typeMatched); 
            if (!typeMatched) { 
                result.setMessage("Connection type '" + connType + "' is not allowed. Supported: " + String.join(", ", allowedConnectionTypes)); 
            } 
        } else { 
            result.setConnectionTypeValid(true); 
            result.setValid(true); 
        } 

        return result; 
    } 

    private static CommonConnectionService getCommonConnectionService() { 
        return ServiceRegistry.getInstance().getService(CommonConnectionConstants.COMMON_CONNECTION_SERVICE); 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 13. DeviceConnectorConnection.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/service/DeviceConnectorConnection.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.service; 

import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.mi.component.handlers.EntityReferenceHandler; 
import com.eqtechnologic.eqube.mi.component.service.ComponentExportEntity; 
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator; 
import com.eqtechnologic.eqube.mi.component.service.RemapInfo; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.helper.DeviceConnectorHelper; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.validator.DeviceConnectorConnectionValidator; 
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported; 
import org.springframework.stereotype.Service; 

import java.util.Collections; 
import java.util.List; 
import java.util.Map; 

/** 
 * Component service for Device Connector Connection 
 * 
 * Author: Lovish 
 */ 
@Exported 
@Service(DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE) 
public class DeviceConnectorConnection implements DeviceConnectorConnectionService, EntityReferenceHandler<Map> { 

    private static final Logger LOGGER = Logger.getLogger(DeviceConnectorConnection.class.getName()); 

    @Override 
    public DeviceConnectorConnCompInitialInput getInitialInput() { 
        DeviceConnectorConnCompInitialInput initialInputBean = new DeviceConnectorConnCompInitialInput(); 
        try { 
            List<Long> connectionIds = DeviceConnectorHelper.getConnectionList(); 
            initialInputBean.setConnIds(connectionIds); 
        } catch (BusinessException e) { 
            LOGGER.error(LogTemplate.of("Error occurred creating input data bean for " + DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE), e); 
        } 
        return initialInputBean; 
    } 

    @Override 
    public DeviceConnectorValidationResult validateConnection(Long connId, List<String> allowedConnectionTypes) { 
        return DeviceConnectorHelper.validateConnection(connId, allowedConnectionTypes); 
    } 

    @Override 
    public String getComponentType() { 
        return DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE; 
    } 

    @Override 
    public ComponentValidator<Map, Object> getValidator() { 
        return new DeviceConnectorConnectionValidator(); 
    } 

    @Override 
    public Class<Map> getComponentDataClass() { 
        return Map.class; 
    } 

    @Override 
    public void calculateConfigRemapInfo(Map configData, RemapInfo configRemapInfo) { 
    } 

    @Override 
    public List<? extends ComponentExportEntity> getLinkedResource(Map componentData) { 
        return Collections.emptyList(); 
    } 

    @Override 
    public void setConfigRemapInfo(Map configData, RemapInfo configRemapInfo) { 
    } 

    @Override 
    public void initialize() { 
    } 

    @Override 
    public void destroy() { 
    } 

    @Override 
    public boolean isRunning() { 
        return false; 
    } 

    @Override 
    public void suspend() { 
    } 

    @Override 
    public void resume() { 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 14. DeviceConnectorConnectionValidator.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-ServiceImpl/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/validator/DeviceConnectorConnectionValidator.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.validator; 

import com.eqtechnologic.eqube.commonui.components.eQError; 
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 

import java.util.ArrayList; 
import java.util.List; 
import java.util.Map; 

/** 
 * Validator for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorConnectionValidator implements ComponentValidator<Map, Object> { 

    private static final String CONNECTION_NOT_EMPTY = "deviceconnectorconn.connectionNotEmpty"; 
    private static final String INVALID_CONNECTION_TYPE = "deviceconnectorconn.invalidConnectionType"; 

    @Override 
    public List<eQError> validate(Map componentBean, Object configObject) { 
        List<eQError> messages = new ArrayList<>(); 

        if (componentBean == null) { 
            messages.add(new eQError(CONNECTION_NOT_EMPTY, "ComponentErr", DeviceConnectorConstants.CONNECTION, false)); 
            return messages; 
        } 

        Object connection = componentBean.get(DeviceConnectorConstants.CONNECTION); 
        if (connection == null || ((String) connection).trim().isEmpty()) { 
            messages.add(new eQError(CONNECTION_NOT_EMPTY, "ComponentErr", DeviceConnectorConstants.CONNECTION, false)); 
        } 

        return messages; 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 15. DeviceConnectorConnection-UIServices / pom.xml
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-UIServices/pom.xml"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>deviceconnector-connection</artifactId>
        <groupId>com.eqtechnologic.eqube.mi</groupId>
        <version>8.1.0.0.13</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>deviceconnector-connection-uiservices</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-web</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.adminconsole</groupId>
            <artifactId>componentframework-service</artifactId>
            <version>${adminconsole.version}</version>
            <classifier>${jarClassifier}</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.mi</groupId>
            <artifactId>deviceconnector-connection-service</artifactId>
            <version>${project.version}</version>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.soa</groupId>
            <artifactId>methodauthorization-service</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.soa</groupId>
            <artifactId>soa-aspects</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.soa</groupId>
            <artifactId>servicemanagement</artifactId>
            <classifier>signed</classifier>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.eqtechnologic.eqube.platform.utils</groupId>
            <artifactId>exception</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>*</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>com.github.wvengen</groupId>
                <artifactId>proguard-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
EOF

# ------------------------------------------------------------------------------
# 16. DeviceConnectorConnection-UIServices / proguard.conf
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-UIServices/proguard.conf"
-dontnote 
-dontwarn 
-dontshrink 
-dontoptimize 

-keeppackagenames 

-keepattributes Signature,Exceptions,InnerClasses,SourceFile,LineNumberTable,*Annotation* 

-keep class com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.controller.**{ 
    public *; 
}
EOF

# ------------------------------------------------------------------------------
# 17. DeviceConnectorConnection-UIServices / project-tree.txt
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-UIServices/project-tree.txt"
Folder PATH listing 

Volume serial number is 00000017 C401:EE1D 

D:\DeviceConnectorConnection\DeviceConnectorConnection-UIServices 
|   pom.xml 
|   proguard.conf 
|   project-tree.txt 
|    
\---src 
    \---main 
        \---java 
            \---com 
                \---eqtechnologic 
                    \---eqube 
                        \---mi 
                            \---componentservices 
                                \---deviceconnectorconnection 
                                    \---controller 
                                            DeviceConnectorControllerHelper.java 
                                            DeviceConnectorRestController.java 
EOF

# ------------------------------------------------------------------------------
# 18. DeviceConnectorControllerHelper.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-UIServices/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/controller/DeviceConnectorControllerHelper.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.controller; 

import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.constants.DeviceConnectorConstants; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.service.DeviceConnectorConnectionService; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 

/** 
 * Controller Helper for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
public class DeviceConnectorControllerHelper { 
    private static DeviceConnectorControllerHelper controllerHelper; 

    public static DeviceConnectorControllerHelper getInstance() { 
        if (controllerHelper == null) { 
            controllerHelper = new DeviceConnectorControllerHelper(); 
        } 
        return controllerHelper; 
    } 

    public DeviceConnectorConnectionService getDeviceConnectorConnectionService() { 
        return ServiceRegistry.getInstance().getService(DeviceConnectorConstants.DEVICE_CONNECTOR_CONNECTION_SERVICE); 
    } 
}
EOF

# ------------------------------------------------------------------------------
# 19. DeviceConnectorRestController.java
# ------------------------------------------------------------------------------
cat << 'EOF' > "$ROOT_DIR/DeviceConnectorConnection-UIServices/src/main/java/com/eqtechnologic/eqube/mi/componentservices/deviceconnectorconnection/controller/DeviceConnectorRestController.java"
/** 
 * @(#)eQubeMI version 2025.02 
 * <p> 
 * Copyright (c) eQ Technologic (India) Pvt. Ltd. 
 * All Rights Reserved. 
 * <p> 
 * This software is the confidential and proprietary information of eQTechnologic 
 * ("Confidential Information"). You shall not 
 * disclose such Confidential Information and shall use it only in 
 * accordance with the terms of the license agreement you entered into 
 */ 
package com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.controller; 

import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorConnCompInitialInput; 
import com.eqtechnologic.eqube.mi.componentservices.deviceconnectorconnection.beans.DeviceConnectorValidationResult; 
import org.springframework.web.bind.annotation.*; 
import com.eqtechnologic.eqube.mi.ui.MIOperation; 
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.*; 

import java.util.List; 
import java.util.ArrayList; 

/** 
 * REST controller for Device Connector Connection Component 
 * 
 * Author: Lovish 
 */ 
@RestController 
@RequestMapping("/deviceconnector") 
public class DeviceConnectorRestController { 

    @GetMapping(value = "/getDeviceConnectorConnInitialData") 
    public DeviceConnectorConnCompInitialInput fetchDeviceConnectorConnInitialData() { 
        List<String> operations = new ArrayList<>(); 
        operations.add(MIOperation.Process.LIST_PROCESS); 
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS); 
        checkMultipleOperations(operations); 
        return DeviceConnectorControllerHelper.getInstance().getDeviceConnectorConnectionService().getInitialInput(); 
    } 

    @PostMapping(value = "/validateConnection") 
    public DeviceConnectorValidationResult validateConnection(@RequestParam("connId") Long connId, 
                                                              @RequestBody(required = false) List<String> allowedConnectionTypes) { 
        List<String> operations = new ArrayList<>(); 
        operations.add(MIOperation.Process.LIST_PROCESS); 
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS); 
        checkMultipleOperations(operations); 
        return DeviceConnectorControllerHelper.getInstance().getDeviceConnectorConnectionService().validateConnection(connId, allowedConnectionTypes); 
    } 

    @Authorize 
    public void checkMultipleOperations(@OperationNames List<String> operations) { 
        // implementation handled by @Authorize annotation 
    } 
}
EOF

echo "All files for DeviceConnectorConnection generated successfully under $ROOT_DIR"
