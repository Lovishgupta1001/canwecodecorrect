# DeviceConnectorConnComponent

A reusable, generic UI connection dropdown component for eQube MI workflow activities. It provides a standardized Kendo dropdown with color-coded connection badges, real-time connection refreshing, process-variable merging, and error tooltip highlighting.

---

## 1. Overview

- **Generic & Protocol-Agnostic**: Works with any connection type (e.g., OPC UA, MQTT, HTTP, Database, etc.) fetched from `services/fetchAccessibleNonPluginConnections`.
- **Hybrid Connection Source**: Combines server-side connections with in-flight workflow variable connections from the current Process Model (`ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource`).
- **100% UI-Based**: Self-contained client-side component; requires no custom backend Java controllers or server-side services.
- **MIUI Component Ecosystem**: Built on `MIUIComponentI` and Marionette/Backbone, compatible with the `window.MIUIComponent` factory pattern (identical to `FileSystemConnComponent`).

---

## 2. Component Structure

```text
DeviceConnectorConnComponent/
├── DeviceConnectorConnComponent.js    # Core View and dropdown controller
├── build.js                           # RequireJS optimizer build configuration
├── config/
│   └── component.json                 # Component metadata and NLS mapping
├── constants/
│   └── Constants.js                   # Field IDs, event names, and default values
├── model/
│   └── DeviceConnectorConnComponentModel.js # Backbone data model
├── nls/
│   └── DeviceConnectorConnComponentNLS.js  # Multi-language string bundle
├── style/
│   └── style.less                     # Component styling & layout
└── template/
    └── DeviceConnectorConnComponentTemplate.html # Template with input & refresh button
```

---

## 3. Integration Guide

### Step 1: Add Container in HTML Template
In your parent activity's template (e.g. `MyActivityTemplate.html`), add an element where the connection dropdown will be injected:

```html
<div class="my-activity-connection-section">
    <!-- Mounting container for DeviceConnectorConnComponent -->
    <div id="my-activity-conn-container"></div>
</div>
```

---

### Step 2: Import Component & Constants
In your activity's JavaScript file (e.g. `MyActivityComponent.js`):

```javascript
define(function (require) {
    "use strict";

    var MIUIComponentI = require("uilayer"),
        DeviceConnectorConnComponent = require("Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent"),
        DeviceConnConstants = require("Components/Activities/DeviceConnectorConnComponent/constants/Constants");

    var MyActivityComponent = MIUIComponentI.extend({
        // ...
```

*(If using RequireJS optimizer, ensure `"Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent"` is included in your `build.js` paths).*

---

### Step 3: Mount Component in `onRender()`
Instantiate and render the component inside `onRender()`:

```javascript
onRender: function () {
    var globalSelf = this;

    // 1. Prepare initial data (empty object or saved connection details)
    var connData = {
        connectionComboBox: this.model.getKey("connectionComboBox") || "",
        connectionName: this.model.getKey("connectionName") || "",
        connectionId: this.model.getKey("connectionId") || ""
    };

    // 2. Setup component options
    var connOptions = {
        el: this.$el.find("#my-activity-conn-container"), // Target DOM container
        activityId: this.activityId,                     // Current activity ID
        reqres: this.designerReqres,                     // Designer Reqres channel
        activityReqres: this.activityReqres,             // Activity Reqres channel
        data: connData                                   // Initial connection data
    };

    // 3. Mount using Promise pattern
    var deviceConnPromise;
    if (window.MIUIComponent && window.MIUIComponent.DeviceConnectorConnComponent) {
        deviceConnPromise = window.MIUIComponent.DeviceConnectorConnComponent(connOptions);
    } else {
        var deferred = $.Deferred();
        var comp = new DeviceConnectorConnComponent(connOptions);
        comp.render();
        deferred.resolve(comp);
        deviceConnPromise = deferred.promise();
    }

    // 4. Bind events when mounted
    deviceConnPromise.done(function (comp) {
        globalSelf.deviceConnComp = comp;

        // Selection change event
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.CHANGE_CONNECTION_VARIABLE,
            globalSelf._onConnectionChanged.bind(globalSelf)
        );

        // Connection list refreshed event
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.REFRESH_CONNECTION,
            globalSelf._onConnectionRefreshed.bind(globalSelf)
        );

        // Invalid or empty connection selected event
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.INVALID_CONNECTION_SELECTED,
            globalSelf._onConnectionInvalid.bind(globalSelf)
        );
    });
}
```

---

### Step 4: Handle Connection Events

```javascript
_onConnectionChanged: function (connPayload) {
    // connPayload provides:
    // {
    //     connectionId: "101",
    //     connectionName: "OPC_UA_Server",
    //     connectionType: "OPCUA",
    //     pluginType: "OPCUA",
    //     connectionItem: { ... }
    // }

    var connId = connPayload ? connPayload.connectionId : "";
    var connName = connPayload ? connPayload.connectionName : "";
    var connType = connPayload ? connPayload.connectionType : "";

    this.model.setKey("connectionId", connId);
    this.model.setKey("connectionName", connName);
    this.model.setKey("connectionType", connType);
    this.model.setKey("selectConnection", connName || connId);

    // Proactively trigger dependent UI updates (e.g., browse address space, load grids)
},

_onConnectionRefreshed: function (refreshPayload) {
    // Fired when user clicks the refresh icon next to the dropdown
    // refreshPayload: { connectionId, connectionName, connectionData }
},

_onConnectionInvalid: function () {
    // Fired when user selects "Select Connection" or an invalid entry
    this.model.setKey("connectionId", "");
    this.model.setKey("connectionName", "");
    this.model.setKey("selectConnection", "");
}
```

---

### Step 5: Save & Load Data

#### In `getData()`
```javascript
getData: function () {
    if (this.deviceConnComp && this.deviceConnComp.getData) {
        var connData = this.deviceConnComp.getData();
        this.model.setKey("connectionComboBox", connData.connectionComboBox || "");
        this.model.setKey("connectionName", connData.connectionName || "");
        this.model.setKey("connectionId", connData.connectionId || "");
        this.model.setKey("selectConnection", connData.connectionComboBox || connData.connectionId || "");
    }
    return this.model.toJSON();
}
```

#### In `setData(obj)`
```javascript
setData: function (obj) {
    // Update local model
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            this.model.setKey(key, obj[key]);
        }
    }
    // Delegate to child connection component
    if (this.deviceConnComp && this.deviceConnComp.setData) {
        this.deviceConnComp.setData(obj);
    }
}
```

---

### Step 6: Validation & Error Highlighting

Forward activity validation errors directly to the connection component:

```javascript
highlightErrors: function (errorObjectList) {
    if (!errorObjectList || !errorObjectList.length) return;

    errorObjectList.forEach(function (errorObject) {
        var path = errorObject.path || "";
        if (path.indexOf("connection") !== -1 || path.indexOf("selectConnection") !== -1) {
            if (this.deviceConnComp && this.deviceConnComp.highlightErrors) {
                this.deviceConnComp.highlightErrors([errorObject]);
            }
        }
    }, this);
}
```

---

### Step 7: Cleanup & Teardown

Unsubscribe and destroy the component inside `onBeforeDestroy()`:

```javascript
onBeforeDestroy: function () {
    if (this.deviceConnComp) {
        this.stopListening(this.deviceConnComp);
        if (this.deviceConnComp.destroy) {
            this.deviceConnComp.destroy();
        }
        this.deviceConnComp = null;
    }
}
```

---

## 4. Public API Reference

### Methods

| Method | Return Type | Description |
| :--- | :--- | :--- |
| `getData()` | `Object` | Returns `{ connectionComboBox, connectionName, connectionId, connectionType, selectConnection }`. |
| `setData(obj)` | `void` | Selects the connection matching `obj.connectionComboBox` or `obj.connectionId`. |
| `getSelectedConnection()` | `String \| null` | Returns the currently selected `connectionId` (or `null` if placeholder selected). |
| `getConnectionData()` | `Object` | Returns `{ connectionId, connectionName, name, type, connectionType, pluginType }`. |
| `getConnectionType()` | `String` | Returns the `connectionType` string (e.g. `"OPCUA"`). |
| `highlightErrors(errorList)` | `void` | Displays red border highlight and an error tooltip on the dropdown. |
| `destroy()` | `void` | Cleans up Kendo widgets, tooltips, DOM elements, and model bindings. |

### Events

| Event Name | Constant | Payload | Description |
| :--- | :--- | :--- | :--- |
| `CHANGE_CONNECTION_VARIABLE` | `Constants.EVENTS.CHANGE_CONNECTION_VARIABLE` | `{ connectionId, connectionName, connectionType, pluginType, connectionItem }` | Triggered when a valid connection is selected from the dropdown. |
| `REFRESH_CONNECTION` | `Constants.EVENTS.REFRESH_CONNECTION` | `{ connectionId, connectionName, connectionData }` | Triggered when the user clicks the refresh button. |
| `INVALID_CONNECTION_SELECTED` | `Constants.EVENTS.INVALID_CONNECTION_SELECTED` | `undefined` | Triggered when the dropdown is cleared or "Select Connection" is chosen. |

---

## 5. Model Schema

| Field Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `connectionComboBox` | `String` | `""` | Display text of the chosen connection. |
| `connectionName` | `String` | `""` | Name of the chosen connection. |
| `connectionId` | `String` | `""` | Unique identifier of the connection. |
| `connectionType` | `String` | `""` | Protocol or connection type (e.g., `"OPCUA"`). |
| `selectConnection` | `String` | `""` | Fallback field matching `connectionName` or `connectionId`. |
