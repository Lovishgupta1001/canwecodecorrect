# WriteToOPCUA Activity - Complete Changes & Code Snippets Guide

This document contains the exact **Before (Old Code)** and **After (New Code)** code snippets for all files modified in the WriteToOPCUA activity (from base commit `0860f74` to `9c18805`).

You can use this guide as a direct reference or ask to re-apply any of these changes at any time.

---

## Table of Contents
1. [Backend Java: Error Codes & Exception Handling](#1-backend-java-error-codes--exception-handling)
2. [Backend Java: Entity Comparison Support (@ComparableEntity)](#2-backend-java-entity-comparison-support)
3. [Designer: ComparisonUIFormat.xml](#3-designer-comparisonuiformatxml)
4. [Designer UI: WriteToOPCUAComponent.js (Multi-Row Deletion)](#4-designer-ui-writetoopcuacomponentjs-multi-row-deletion)
5. [Designer UI: GridUtils.js (Search Bar Configuration)](#5-designer-ui-gridutilsjs-search-bar-configuration)
6. [Designer UI: TransportManager.js (AdminConsole Hash Routing)](#6-designer-ui-transportmanagerjs-adminconsole-hash-routing)
7. [Designer UI: constants.js (Routing URLs)](#7-designer-ui-constantsjs-routing-urls)
8. [ProGuard Configuration Files](#8-proguard-configuration-files)

---

## 1. Backend Java: Error Codes & Exception Handling

### 1.1 `WriteToOPCUAErrorCode.java` [NEW FILE]
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/exception/WriteToOPCUAErrorCode.java`

```java
package com.eqtechnologic.eqube.mi.activities.writetoopcua.exception;

import com.eqtechnologic.eqube.code.GroupCode;
import com.eqtechnologic.eqube.exception.ErrorCode;
import com.eqtechnologic.eqube.mi.modulecodes.ModuleErrorCode;

public enum WriteToOPCUAErrorCode implements ErrorCode {

    ERROR_WHILE_FETCHING_OPCUA_TRANSPORT_LIST(902001, "Error occurred while getting OPC UA transport list"),
    ERROR_WHILE_TESTING_TRANSPORT(902002, "Error occurred while testing transport"),
    ERROR_WHILE_VALIDATING_TRANSPORT(902003, "Error occurred while validating transport"),
    ERROR_WHILE_VALIDATING_EXPRESSION(902004, "Error occurred while validating expression"),
    ERROR_WHILE_FETCHING_TRANSPORT_DETAILS(902005, "Error occurred while getting transport details");

    private final int errorCode;
    private final String errorMessage;

    WriteToOPCUAErrorCode(int i, String s) {
        this.errorCode = i;
        this.errorMessage = s;
    }

    @Override
    public int getNumber() {
        return this.errorCode;
    }

    @Override
    public int getGroup() {
        return GroupCode.MI.val();
    }

    @Override
    public int getModule() {
        return ModuleErrorCode.COMPONENT_SERVICE.value();
    }

    @Override
    public String getMessage() {
        return this.errorMessage;
    }
}
```

---

### 1.2 `WriteToOPCUAExceptionType.java` [NEW FILE]
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/exception/WriteToOPCUAExceptionType.java`

```java
package com.eqtechnologic.eqube.mi.activities.writetoopcua.exception;

import com.eqtechnologic.eqube.exception.ExceptionType;

public enum WriteToOPCUAExceptionType implements ExceptionType {

    WRITE_TO_OPCUA_ACTIVITY_EXCEPTION;

    @Override
    public String getType() {
        return name();
    }
}
```

---

### 1.3 `WriteToOPCUAComponentService.java`
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/WriteToOPCUAComponentService.java`

#### 🔴 OLD CODE:
```java
    public List<TransportInfo> fetchTransportListByType(String transportType) {
        List<TransportClientBean> transportClientBeans = new ArrayList<>();
        try {
            TransportClientService service = getTransportClientService();
            if (service != null && service.getTransportDetails() != null) {
                transportClientBeans = new ArrayList<>(service.getTransportDetails().values());
            }
        } catch (Exception e) {
            LOGGER.error("Error while fetching Transport details", e);
        }
        return opcuaHelper.convertTransportClientToTransportInfoBeanList(transportType, transportClientBeans);
    }
```

#### 🟢 NEW CODE:
```java
    public List<TransportInfo> fetchTransportListByType(String transportType) throws BusinessException {
        List<TransportClientBean> transportClientBeans = new ArrayList<>();
        try {
            TransportClientService service = getTransportClientService();
            if (service != null && service.getTransportDetails() != null) {
                transportClientBeans = new ArrayList<>(service.getTransportDetails().values());
            }
        } catch (BusinessException e) {
            LogTemplate lt = LogTemplate.of(WriteToOPCUAErrorCode.ERROR_WHILE_FETCHING_TRANSPORT_DETAILS.getMessage());
            LOGGER.error(lt, e);
            throw new BusinessException(WriteToOPCUAExceptionType.WRITE_TO_OPCUA_ACTIVITY_EXCEPTION,
                    WriteToOPCUAErrorCode.ERROR_WHILE_FETCHING_TRANSPORT_DETAILS, e.getMessage());
        }
        return opcuaHelper.convertTransportClientToTransportInfoBeanList(transportType, transportClientBeans);
    }
```

---

### 1.4 `WriteToOPCUAComponentServiceHelper.java`
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/WriteToOPCUAComponentServiceHelper.java`

#### 🔴 OLD CODE:
```java
    public boolean testTransportById(Long transportId) {
        if (transportId == null) {
            return false;
        }
        try {
            TransportRESTServiceHelper.testTransportByID(transportId);
            return true;
        } catch (Exception e) {
            LOGGER.error("Error testing transport by ID: " + transportId, e);
            return false;
        }
    }
```

#### 🟢 NEW CODE:
```java
    public boolean testTransportById(Long transportId) {
        if (transportId == null) {
            return false;
        }
        TransportRESTServiceHelper.testTransportByID(transportId);
        return true;
    }
```

---

### 1.5 `WriteToOPCUAValidator.java`
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/WriteToOPCUAValidator.java`

#### 🔴 OLD CODE:
```java
    private void validateTransport(String transportName, List<eQError> errorList) {
        try {
            TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(transportName);
            if (transportClientBean == null) {
                eQError error = new eQError("writetoopcua.transportNotFound", COMPONENT_ERR,
                        ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, WriteToOPCUAConstants.TRANSPORT_NAME),
                        false);
                errorList.add(error);
            }
        } catch (Exception e) {
            LOGGER.error("Error while validating transport: " + transportName, e);
            eQError errorMsg = new eQError("writetoopcua.transportFrameworkError_transport", COMPONENT_ERR,
                    null, true);
            errorList.add(errorMsg);
        }
    }

    private void validateExpression(String expressionValue, Map map, List<eQError> errors, String resource) {
        if (expressionValue == null || expressionValue.isEmpty()) {
            return;
        }
        try {
            ComponentService expressionBuilderService = ServiceRegistry.getInstance().getService(EXPRESSION_BUILDER_SERVICE);
            if (expressionBuilderService != null && expressionBuilderService.getValidator() != null) {
                List<eQError> generatedErrors = expressionBuilderService.getValidator().validate(expressionValue, map);
                if (generatedErrors != null) {
                    generatedErrors.forEach(er -> er.setResource(WriteToOPCUAConstants.WRITE_TO_OPCUA + "/" + resource));
                    errors.addAll(generatedErrors);
                }
            }
        } catch (Exception e) {
            LOGGER.warn("Expression builder service validation failed for expression: " + expressionValue, e);
        }
    }
```

#### 🟢 NEW CODE:
```java
    private void validateTransport(String transportName, List<eQError> errorList) {
        try {
            TransportClientBean transportClientBean = getTransportClientService().getTransportDetail(transportName);
            if (transportClientBean == null) {
                eQError error = new eQError("writetoopcua.transportNotFound", COMPONENT_ERR,
                        ComponentUtility.getInstance().createPath(WriteToOPCUAConstants.WRITE_TO_OPCUA, WriteToOPCUAConstants.TRANSPORT_NAME),
                        false);
                errorList.add(error);
            }
        } catch (BusinessException e) {
            LogTemplate lt = LogTemplate.of(WriteToOPCUAErrorCode.ERROR_WHILE_VALIDATING_TRANSPORT.getMessage());
            LOGGER.error(lt, e);
            eQError errorMsg = new eQError("writetoopcua.transportFrameworkError_transport", COMPONENT_ERR,
                    null, true);
            errorList.add(errorMsg);
        }
    }

    private void validateExpression(String expressionValue, Map map, List<eQError> errors, String resource) {
        if (expressionValue == null || expressionValue.isEmpty()) {
            return;
        }
        ComponentService expressionBuilderService = ServiceRegistry.getInstance().getService(EXPRESSION_BUILDER_SERVICE);
        if (expressionBuilderService != null && expressionBuilderService.getValidator() != null) {
            List<eQError> generatedErrors = expressionBuilderService.getValidator().validate(expressionValue, map);
            if (generatedErrors != null) {
                generatedErrors.forEach(er -> er.setResource(WriteToOPCUAConstants.WRITE_TO_OPCUA + "/" + resource));
                errors.addAll(generatedErrors);
            }
        }
    }
```

---

### 1.6 `WriteToOPCUAComponentRestController.java`
**Path:** `WriteToOPCUA-Designer/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/WriteToOPCUAComponentRestController.java`

#### 🔴 OLD CODE:
```java
    @GetMapping(value = "/fetchTransportListByType")
    public List<TransportInfo> fetchTransportListByType(@RequestParam("transportType") String transportType) {
        checkMultipleOperations(operations);
        return opcuaHelper.getWriteToOPCUAService().fetchTransportListByType(transportType);
    }

    @GetMapping(value = "/fetchOPCUATransportList")
    public List<TransportInfo> fetchOPCUATransportList() {
        checkMultipleOperations(operations);
        return opcuaHelper.getWriteToOPCUAService().fetchOPCUATransportList();
    }

    @GetMapping(value = "/testTransportById")
    public boolean testTransportById(@RequestParam("transportId") Long transportId) {
        checkMultipleOperations(operations);
        return opcuaHelper.testTransportById(transportId);
    }
```

#### 🟢 NEW CODE:
```java
    @GetMapping(value = "/fetchOPCUATransportList")
    public List<TransportInfo> fetchOPCUATransportList() throws BusinessException {
        checkMultipleOperations(operations);
        List<TransportInfo> transportInfos = new ArrayList<>();
        try {
            transportInfos = opcuaHelper.getWriteToOPCUAService().fetchOPCUATransportList();
        } catch (BusinessException e) {
            LogTemplate lt = LogTemplate.of(WriteToOPCUAErrorCode.ERROR_WHILE_FETCHING_OPCUA_TRANSPORT_LIST.getMessage());
            LOGGER.error(lt, e);
            throw new BusinessException(WriteToOPCUAExceptionType.WRITE_TO_OPCUA_ACTIVITY_EXCEPTION,
                    WriteToOPCUAErrorCode.ERROR_WHILE_FETCHING_OPCUA_TRANSPORT_LIST, e.getMessage());
        }
        return transportInfos;
    }

    @GetMapping(value = "/testTransportById")
    public boolean testTransportById(@RequestParam("transportId") Long transportId) {
        checkMultipleOperations(operations);
        return opcuaHelper.testTransportById(transportId);
    }
```

---

## 2. Backend Java: Entity Comparison Support (@ComparableEntity)

### 2.1 `DataChangeWriteItem.java`
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/bean/DataChangeWriteItem.java`

#### 🔴 OLD CODE:
```java
public class DataChangeWriteItem {

    private String name;
    private String nodeId;
    private String dataTypeName;
    private String dataTypeNodeId;
    private String sampleValue;
    private String newValue;
    private String nodeIdHelpText;
    private String sampleValueHelpText;

    // getters and setters...
}
```

#### 🟢 NEW CODE:
```java
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

    // getters and setters...

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
```

---

### 2.2 `CallMethodItem.java`
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/bean/CallMethodItem.java`

#### 🔴 OLD CODE:
```java
public class CallMethodItem {

    private String name;
    private String nodeId;
    private String objectNodeId;
    private Object inputParameters;
    private List<InputParameterItem> inputArguments = new ArrayList<>();
    private List<InputParameterItem> outputArguments = new ArrayList<>();
    private String outputValue;
    private String nodeIdHelpText;

    // getters and setters...
}
```

#### 🟢 NEW CODE:
```java
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

    // getters and setters...

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
```

---

### 2.3 `InputParameterItem.java`
**Path:** `WriteToOPCUA-Common/src/main/java/com/eqtechnologic/eqube/mi/activities/writetoopcua/bean/InputParameterItem.java`

#### 🔴 OLD CODE:
```java
public class InputParameterItem {

    private String name;
    private String dataType;
    private String dataTypeName;
    private String value;

    // getters and setters...
}
```

#### 🟢 NEW CODE:
```java
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

    // getters and setters...

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
```

---

## 3. Designer: ComparisonUIFormat.xml
**Path:** `WriteToOPCUA-Designer/src/main/resources/ComparisonUIFormat.xml`

#### 🔴 OLD CODE:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<activity xmlns="http://www.w3.org/activitycomparison/activitycapabilitiescomparison">
    <capability name="Configuration">
        <component name="i18n:writetoopcua.transport" id="transportName"/>
        <component name="i18n:writetoopcua.operation" id="operation"/>
        <component name="i18n:writetoopcua.executionMode" id="executionMode"/>
    </capability>
    <capability name="Output">
        <component name="i18n:writetoopcua.outputSuccessfulWriteItems" id="successfulWriteItems"/>
        <component name="i18n:writetoopcua.outputFailedWriteItems" id="failedWriteItems"/>
        <component name="i18n:writetoopcua.outputSkippedWriteItems" id="skippedWriteItems"/>
    </capability>
</activity>
```

#### 🟢 NEW CODE:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<activity xmlns="http://www.w3.org/activitycomparison/activitycapabilitiescomparison">
    <capability name="Configuration">
        <component name="i18n:writetoopcua.TransportName" id="transportName"/>
        <component name="i18n:writetoopcua.Operation" id="operation"/>
        <component name="i18n:writetoopcua.ExecutionMode" id="executionMode"/>

        <group name="i18n:writetoopcua.DataChangeWrite">
            <component id="WriteToOPCUADataChangeWrite" addHeader="true"/>
        </group>

        <group name="i18n:writetoopcua.CallMethod">
            <component id="WriteToOPCUACallMethod" addHeader="true"/>
        </group>
    </capability>
    <capability name="Output">
        <component name="i18n:writetoopcua.outputSuccessfulWriteItems" id="successfulWriteItems"/>
        <component name="i18n:writetoopcua.outputFailedWriteItems" id="failedWriteItems"/>
        <component name="i18n:writetoopcua.outputSkippedWriteItems" id="skippedWriteItems"/>
    </capability>
</activity>
```

---

## 4. Designer UI: WriteToOPCUAComponent.js (Multi-Row Deletion)
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/WriteToOPCUAComponent.js`

#### 🔴 OLD CODE:
```javascript
        _onDeleteGridRow: function (event) {
            var row = $(event.currentTarget).closest("tr");
            var grid = this._getGridInstance();

            if (grid && row.length) {
                grid.removeRow(row);
            }
        },

        _onDeleteToolbarRow: function () {
            var grid = this._getGridInstance();

            if (grid) {
                var selected = grid.select();
                if (selected?.length) {
                    var uniqueRows = [];
                    selected.each(function () {
                        var row = $(this).closest("tr");
                        if (row.length && uniqueRows.indexOf(row[0]) === -1) {
                            uniqueRows.push(row[0]);
                        }
                    });
                    $.each(uniqueRows, function (index, rowElem) {
                        grid.removeRow($(rowElem));
                    });
                } else {
                    var lastRow = grid.tbody.find("tr:last");
                    if (lastRow.length) {
                        grid.removeRow(lastRow);
                    }
                }
            }
        },
```

#### 🟢 NEW CODE:
```javascript
        _onDeleteGridRow: function (event) {
            var row = $(event.currentTarget).closest("tr");
            var grid = this._getGridInstance();

            if (grid && row.length) {
                var dataItem = grid.dataItem ? grid.dataItem(row) : null;
                if (dataItem && grid.dataSource) {
                    grid.dataSource.remove(dataItem);
                } else if (grid.removeRow) {
                    grid.removeRow(row);
                }
            }
        },

        _onDeleteToolbarRow: function () {
            var grid = this._getGridInstance();

            if (!grid) {
                return;
            }

            var selectedElements = grid.select ? grid.select() : [];
            var checkedBoxes = grid.tbody ? grid.tbody.find("input:checked, .k-checkbox:checked") : [];
            var uniqueRowElements = [];

            if (selectedElements && selectedElements.length) {
                selectedElements.each(function () {
                    var row = $(this).closest("tr");
                    if (row.length && uniqueRowElements.indexOf(row[0]) === -1) {
                        uniqueRowElements.push(row[0]);
                    }
                });
            }

            if (checkedBoxes && checkedBoxes.length) {
                checkedBoxes.each(function () {
                    var row = $(this).closest("tr");
                    if (row.length && uniqueRowElements.indexOf(row[0]) === -1) {
                        uniqueRowElements.push(row[0]);
                    }
                });
            }

            if (uniqueRowElements.length) {
                var dataItems = [];
                $.each(uniqueRowElements, function (index, rowElem) {
                    var item = grid.dataItem ? grid.dataItem(rowElem) : null;
                    if (item && dataItems.indexOf(item) === -1) {
                        dataItems.push(item);
                    }
                });

                if (dataItems.length && grid.dataSource) {
                    $.each(dataItems, function (index, item) {
                        grid.dataSource.remove(item);
                    });
                } else {
                    $.each(uniqueRowElements, function (index, rowElem) {
                        grid.removeRow($(rowElem));
                    });
                }
            } else {
                var lastRow = grid.tbody ? grid.tbody.find("tr:last") : [];
                if (lastRow.length) {
                    var lastItem = grid.dataItem ? grid.dataItem(lastRow) : null;
                    if (lastItem && grid.dataSource) {
                        grid.dataSource.remove(lastItem);
                    } else if (grid.removeRow) {
                        grid.removeRow(lastRow);
                    }
                }
            }
        },
```

---

## 5. Designer UI: GridUtils.js (Search Bar Configuration)
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/js/GridUtils.js`

#### 🔴 OLD CODE:
```javascript
        renderGridSearchBar: function (searchClass, grid, fields, globalSelf, nls) {
            var searchElement = globalSelf.$("." + searchClass);

            if (!searchElement.length || !grid?.widget?.dataSource) {
                return null;
            }

            var ds = grid.widget.dataSource;
            var searchFields = Array.isArray(fields) ? fields : [fields, "nodeId"];

            searchElement.off("keyup.gridSearch input.gridSearch").on("keyup.gridSearch input.gridSearch", function () {
                var val = $(this).val();
                if (!val || val.trim() === "") {
                    ds.filter([]);
                } else {
                    var query = val.trim();
                    var filterList = searchFields.map(function (f) {
                        return { field: f, operator: "contains", value: query };
                    });
                    ds.filter({
                        logic: "or",
                        filters: filterList
                    });
                }
            });

            var searchBarFilters = searchFields.map(function (f) {
                return { field: f, operator: "contains" };
            });

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: ds,
                filter: {
                    logic: "or",
                    filters: searchBarFilters
                },
                placeholder: nls.Search,
                filterAfter: 1
            });
        },
```

#### 🟢 NEW CODE:
```javascript
        renderGridSearchBar: function (searchClass, grid, fields, globalSelf, nls) {
            var searchElement = globalSelf.$("." + searchClass);

            if (!searchElement.length || !grid?.widget?.dataSource) {
                return null;
            }

            var ds = grid.widget.dataSource;
            var searchFields = Array.isArray(fields) ? fields : [fields, "nodeId"];

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: [ds],
                filter: {
                    field: searchFields,
                    operator: "contains"
                },
                placeholder: nls.Search,
                filterAfter: 0,
                filterEvent: "keyup"
            });
        },
```

---

## 6. Designer UI: TransportManager.js (AdminConsole Hash Routing)
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/js/TransportManager.js`

#### 🔴 OLD CODE:
```javascript
        renderTransportButtons: function (globalSelf) {
            if (!globalSelf.refreshButton) {
                globalSelf.refreshButton = uilayer.button({
                    elem: globalSelf.$(".transports-refresh-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (globalSelf.transportDropdown) {
                            globalSelf.transportDropdown.destroy();
                            globalSelf.transportDropdown = null;
                            globalSelf.$(".transport-selector-dropdown").empty();
                        }
                        TransportManager.renderTransportDropdown(globalSelf);
                    }
                });
            }

            if (!globalSelf.createButton) {
                globalSelf.createButton = uilayer.button({
                    elem: globalSelf.$(".transports-create-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        window.open(
                            Constants.CREATE_TRANSPORT_URL,
                            "_blank"
                        );
                    }
                });
            }

            if (!globalSelf.openButton) {
                globalSelf.openButton = uilayer.button({
                    elem: globalSelf.$(".transports-open-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (!globalSelf.transportDropdown?.dataItem()) {
                            return;
                        }

                        var item = globalSelf.transportDropdown.dataItem();
                        var transportId = item.toJSON ? item.toJSON().transportId : item.transportId;

                        if (transportId) {
                            window.open(
                                Constants.EDIT_TRANSPORT_URL + transportId,
                                "_blank"
                            );
                        }
                    }
                });
            }
        },
```

#### 🟢 NEW CODE:
```javascript
        navigateToCAC: function (response, hashPath) {
            var navigationURL;
            if (response && response.IS_DISTRIBUTED_DEPLOYMENT === "TRUE") {
                navigationURL = response.URL + "/" + encodeURIComponent(response.ENVIRONMENT_ID) + "/EXECUTOR/" + encodeURIComponent(hashPath);
            } else {
                var appPath = window.location.pathname.split("/")[1] || "eQubeMI";
                navigationURL = window.location.origin + "/" + appPath + "/AdminConsole#" + hashPath;
            }
            window.open(navigationURL, "_blank");
        },

        renderTransportButtons: function (globalSelf) {
            var self = this;

            if (!globalSelf.refreshButton) {
                globalSelf.refreshButton = uilayer.button({
                    elem: globalSelf.$(".transports-refresh-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (globalSelf.transportDropdown) {
                            globalSelf.transportDropdown.dataSource.read();
                        } else {
                            self.renderTransportDropdown(globalSelf);
                        }
                    }
                });
            }

            if (!globalSelf.createButton) {
                globalSelf.createButton = uilayer.button({
                    elem: globalSelf.$(".transports-create-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        var promise = AjaxUtility.cachedAjaxRequest("GET", "services/application-navigation-url/cac", null, "json", null, true);
                        promise.done(function (response) {
                            self.navigateToCAC(response, "transports/create");
                        });
                        promise.fail(function () {
                            self.navigateToCAC(null, "transports/create");
                        });
                    }
                });
            }

            if (!globalSelf.openButton) {
                globalSelf.openButton = uilayer.button({
                    elem: globalSelf.$(".transports-open-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        var selectedTransportId = null;
                        if (globalSelf.transportDropdown && globalSelf.transportDropdown.dataItem()) {
                            var item = globalSelf.transportDropdown.dataItem();
                            selectedTransportId = item.toJSON ? item.toJSON().transportId : item.transportId;
                        }

                        var hashPath = selectedTransportId ? ("transports/edit/" + selectedTransportId) : "transports";

                        var promise = AjaxUtility.cachedAjaxRequest("GET", "services/application-navigation-url/cac", null, "json", null, true);
                        promise.done(function (response) {
                            self.navigateToCAC(response, hashPath);
                        });
                        promise.fail(function () {
                            self.navigateToCAC(null, hashPath);
                        });
                    }
                });
            }
        },
```

---

## 7. Designer UI: constants.js (Routing URLs)
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/js/constants.js`

#### 🔴 OLD CODE:
```javascript
        CREATE_TRANSPORT_URL: "/ADMINCONSOLE?servicePath=transports/create",
        EDIT_TRANSPORT_URL: "/ADMINCONSOLE?servicePath=transports/edit/"
```

#### 🟢 NEW CODE:
```javascript
        TRANSPORTS_URL: "/AdminConsole#transports",
        CREATE_TRANSPORT_URL: "/AdminConsole#transports/create",
        EDIT_TRANSPORT_URL: "/AdminConsole#transports/edit/"
```

---

## 8. ProGuard Configuration Files

**Paths:**
- `WriteToOPCUA-Common/proguard.conf`
- `WriteToOPCUA-Designer/proguard.conf`
- `WriteToOPCUA-Runtime/proguard.conf`

#### 🟢 NEW PROGUARD RULES:
```proguard
-dontnote
-dontwarn
-dontshrink
-dontoptimize

-keeppackagenames

-keepattributes Signature,InnerClasses,SourceFile,LineNumberTable
-keepnames class com.eqtechnologic.eqube.mi.activities.writetoopcua.**

-keep class com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.**{
	*;
}

-keep class com.eqtechnologic.eqube.mi.activities.writetoopcua.**{
	public *;
}
```
