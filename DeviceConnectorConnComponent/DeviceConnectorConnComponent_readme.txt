# DeviceConnectorConnComponent

A reusable, generic UI connection dropdown component for eQube MI workflow activities and standalone applications. It provides a standardized Kendo dropdown with color-coded connection badges, real-time connection refreshing, process-variable merging, protocol filtering/validation, and error tooltip highlighting.

---

## 1. Standalone (Outside Activity)

Use this pattern when embedding the connection dropdown in modal dialogs, configuration panels, admin screens, or custom standalone views where activity-specific objects (`activityId`, `reqres`, `ActivitiesUtility`, etc.) do not exist.

### How Standalone Mode Operates
- **Zero Activity Dependencies**: Does not require `activityId`, `reqres`, or `activityReqres`.
- **Pure Server Fetch**: Directly fetches accessible connections via `services/fetchAccessibleNonPluginConnections`.
- **Automatic Fallback**: `ActivitiesUtility` is dynamically detected; when not present in the runtime, it cleanly skips process variable merging without errors.
- **Protocol Filtering**: You can optionally supply `allowedConnectionTypes: ["OPCUA"]` to restrict selectable connections, or omit it to allow any connection.

### Step 1: HTML Container
Add a target container element in your template or HTML layout:
```html
<div class="my-custom-form-group">
    <label>Select Connection:</label>
    <div id="standalone-connection-container"></div>
</div>
```

### Step 2: Configuration Options
Prepare the options object. Only `el` is required:
```javascript
var connOptions = {
    el: $("#standalone-connection-container"), // Target DOM/jQuery element
    allowedConnectionTypes: ["OPCUA"],         // Optional: e.g. ["OPCUA"], ["MQTT"], or omit for any
    data: {
        connectionId: "conn_123"               // Optional: preselected connection ID
    }
};
```

### Step 3: Instantiation & Rendering

#### Approach A: Direct Constructor (Standard RequireJS)
```javascript
define(function (require) {
    "use strict";

    var DeviceConnectorConnComponent = require("Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent"),
        DeviceConnConstants = require("Components/Activities/DeviceConnectorConnComponent/constants/Constants");

    var connComp = new DeviceConnectorConnComponent(connOptions);
    connComp.render();

    // Event: Valid connection selected
    connComp.listenTo(connComp, DeviceConnConstants.EVENTS.CHANGE_CONNECTION_VARIABLE, function (data) {
        console.log("Selected connection ID:", data.connectionId);
        console.log("Selected connection Name:", data.connectionName);
        console.log("Selected connection Type:", data.connectionType);
    });

    // Event: Invalid or unallowed connection selected
    connComp.listenTo(connComp, DeviceConnConstants.EVENTS.INVALID_CONNECTION_SELECTED, function (errData) {
        console.warn("Unallowed connection selected:", errData.message);
    });

    // Event: Connections list refreshed
    connComp.listenTo(connComp, DeviceConnConstants.EVENTS.REFRESH_CONNECTION, function (refreshData) {
        console.log("Refreshed connections:", refreshData);
    });
});
```

#### Approach B: Factory Pattern (`window.MIUIComponent`)
```javascript
if (window.MIUIComponent && window.MIUIComponent.DeviceConnectorConnComponent) {
    window.MIUIComponent.DeviceConnectorConnComponent(connOptions).done(function (comp) {
        comp.listenTo(comp, "CHANGE_CONNECTION_VARIABLE", function (data) {
            console.log("Connection chosen:", data.connectionName);
        });
    });
}
```

### Step 4: Validation & Pre-Submit Checks
Before submitting a custom form or applying changes, call `getErrorMessage()`:
```javascript
var errorMsg = connComp.getErrorMessage();
if (errorMsg) {
    // Shows message, e.g.: "Selected connection 'XYZ' is not allowed. Only OPCUA connection(s) are supported."
    alert(errorMsg);
    return false; // Abort submission
}
```

### Step 5: Read Connection Data
```javascript
// Get currently selected connection ID (returns null if empty or invalid)
var connId = connComp.getSelectedConnection();

// Get full connection payload
var connData = connComp.getConnectionData();
// connData => {
//     connectionId: "102",
//     connectionName: "Local_OPCUA_Server",
//     connectionType: "OPCUA"
// }

// Get normalized model object
var modelData = connComp.getData();
```

### Step 6: Teardown & Cleanup
When the dialog or panel is closed, clean up DOM bindings and Kendo widgets:
```javascript
if (connComp) {
    if (connComp.destroy) {
        connComp.destroy();
    } else if (connComp.onBeforeDestroy) {
        connComp.onBeforeDestroy();
    }
    connComp = null;
}
```

---

## 2. Inside Activity (Process Designer)

Follow this pattern when embedding the connection dropdown inside an eQube MI Process Designer Activity (such as `InvokeOPCUAComponent.js`, `FileZip.js`, `PublishUIComponent.js`, etc.).

### How Activity Mode Operates
- **Hybrid Source Merging**: Combines accessible connections with upstream in-flight process model variables via `ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(processModel, activityId)`.
- **Platform Lifecycle**: Integrates with Process Designer's lifecycle (`onRender`, `getData`, `setData`, `getErrorMessage`, `highlightErrors`, `onBeforeDestroy`).
- **Save Blocking**: Pre-save validation prevents invalid or unallowed connections from saving into the Process definition database.

### Step 1: HTML Container in Activity Template
In your activity's HTML template (e.g., `InvokeOPCUAComponentTemplate.html`):
```html
<div class="invokeopcua-connection-section">
    <div id="invokeopcua-connection-component-container"></div>
</div>
```

### Step 2: Mount Component in `onRender()`
In your activity's component JS file:
```javascript
onRender: function () {
    var globalSelf = this;

    // 1. Prepare initial data from activity model
    var connData = {};
    var savedConn = this.model.getKey("connectionComboBox") ||
                    this.model.getKey("selectConnection") ||
                    this.model.getKey("connectionName");
    if (savedConn) {
        connData.connectionComboBox = savedConn;
        connData.connectionName = savedConn;
        connData.connectionId = this.model.getKey("connectionId") || "";
    }

    // 2. Setup options with activity context
    var connOptions = {
        el: this.$el.find("#invokeopcua-connection-component-container"),
        activityId: this.activityId,
        reqres: this.designerReqres,
        activityReqres: this.activityReqres,
        allowedConnectionTypes: ["OPCUA"], // Enforce allowed protocol(s)
        data: connData
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

    // 4. Bind events
    deviceConnPromise.done(function (comp) {
        globalSelf.deviceConnComp = comp;
        globalSelf.connectionComboBox = comp.connectionComboBox;

        // Valid connection chosen
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.CHANGE_CONNECTION_VARIABLE,
            globalSelf._onConnectionChanged.bind(globalSelf)
        );

        // Connections refreshed
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.REFRESH_CONNECTION,
            globalSelf._onConnectionRefreshed.bind(globalSelf)
        );

        // Invalid or unallowed connection selected
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.INVALID_CONNECTION_SELECTED,
            globalSelf._onConnectionInvalid.bind(globalSelf)
        );
    });
}
```

### Step 3: Handle Activity Model Events
```javascript
_onConnectionChanged: function (connData) {
    var connId = connData ? connData.connectionId : "";
    var connName = connData ? (connData.connectionName || connData.name || "") : "";
    var connType = connData ? (connData.connectionType || "OPCUA") : "OPCUA";

    // Update Activity Backbone Model
    this.model.setKey("connectionComboBox", connName);
    this.model.setKey("connectionName", connName);
    this.model.setKey("connectionId", connId);
    this.model.setKey("connectionType", connType);
    this.model.setKey("selectConnection", connName || connId);

    // Reveal configuration controls and trigger downstream data loading
    this.$(".activity-config-section").show();
},

_onConnectionInvalid: function () {
    // Hide configuration sections and clear model
    this.$(".activity-config-section").hide();
    this.model.setKey("connectionComboBox", "");
    this.model.setKey("connectionName", "");
    this.model.setKey("connectionId", "");
    this.model.setKey("selectConnection", "");
    this.model.setKey("connectionType", "");
},

_onConnectionRefreshed: function (refreshData) {
    // Proactively refresh downstream browser or dependent trees
}
```

### Step 4: Block Save via `getErrorMessage()`
When the user clicks "Save" or "Apply", Process Designer automatically queries `activity.getErrorMessage()`. If any non-empty string is returned, the save is rejected:
```javascript
getErrorMessage: function () {
    // 1. Delegate connection validation to DeviceConnectorConnComponent
    if (this.deviceConnComp && this.deviceConnComp.getErrorMessage) {
        var connErr = this.deviceConnComp.getErrorMessage();
        if (connErr) {
            return connErr; // Returns error string; blocks saving to database
        }
    } else if (!this.model.getKey("connectionId")) {
        return "Select a valid connection.";
    }

    // 2. Additional activity validations...
    return "";
}
```

### Step 5: Serialize Data in `getData()`
```javascript
getData: function () {
    if (this.deviceConnComp && this.deviceConnComp.getData) {
        var connData = this.deviceConnComp.getData();
        this.model.setKey("connectionComboBox", connData.connectionComboBox || "");
        this.model.setKey("connectionName", connData.connectionName || "");
        this.model.setKey("connectionId", connData.connectionId || "");
        this.model.setKey("selectConnection", connData.connectionComboBox || connData.connectionId || "");
        if (connData.connectionType) {
            this.model.setKey("connectionType", connData.connectionType);
        }
    }
    return this.model.toJSON();
}
```

### Step 6: Populate Data in `setData(obj)`
```javascript
setData: function (obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            this.model.setKey(key, obj[key]);
        }
    }
    if (this.deviceConnComp && this.deviceConnComp.setData) {
        this.deviceConnComp.setData(obj);
    }
}
```

### Step 7: Forward Platform Validation Errors in `highlightErrors()`
```javascript
highlightErrors: function (errorObjectList) {
    if (!errorObjectList || !errorObjectList.length) return;

    errorObjectList.forEach(function (errorObject) {
        if (!errorObject) return;
        var path = errorObject.path || errorObject.resource || "";

        if (path.indexOf("connection") !== -1 || path.indexOf("selectConnection") !== -1) {
            if (this.deviceConnComp && this.deviceConnComp.highlightErrors) {
                this.deviceConnComp.highlightErrors([errorObject]);
            }
            return;
        }
    }, this);
}
```

### Step 8: Teardown in `onBeforeDestroy()`
```javascript
onBeforeDestroy: function () {
    if (this.deviceConnComp) {
        this.stopListening(this.deviceConnComp);
        if (this.deviceConnComp.destroy) {
            this.deviceConnComp.destroy();
        } else if (this.deviceConnComp.onBeforeDestroy) {
            this.deviceConnComp.onBeforeDestroy();
        }
        this.deviceConnComp = null;
    }
}
```

---

## 3. `allowedConnectionTypes` Filtering & Validation

1. **Full Visibility**:
   - The dropdown displays **all accessible connections** in the user's environment.
2. **Behavior on Selecting an Unallowed Connection**:
   - **Visual Feedback**: Shows red border highlight (`.components-error-red-highlight`) and an error tooltip on the dropdown:
     `"Selected connection '<ConnectionName>' is not allowed. Only <Types> connection(s) are supported."`
   - **Model Reset**: Clears `connectionId`, `connectionType`, and `connectionComboBox` in `this.model` to `""`.
   - **Event**: Triggers `INVALID_CONNECTION_SELECTED` with payload `{ connectionId, connectionName, connectionType, message }`.
   - **Pre-Save Check**: `getErrorMessage()` returns the error message, blocking the activity from being saved.
   - **Sanitization**: `getData()` validates `isConnectionAllowed()` and strips unallowed connection values.
3. **Behavior on Selecting an Allowed Connection**:
   - Hides any existing error tooltip and red border highlight.
   - Populates model attributes and triggers `CHANGE_CONNECTION_VARIABLE`.
   - `getErrorMessage()` returns `""`.

---

## 4. Configuration Options Reference

| Option | Type | Required? | Context | Description |
| :--- | :--- | :--- | :--- | :--- |
| `el` | `jQuery \| HTMLElement \| String` | **Yes** | Both | Container DOM element where the dropdown is rendered. |
| `allowedConnectionTypes` | `Array<String> \| String` | No | Both | List of allowed connection types (e.g. `["OPCUA"]`). If omitted, all connection types are accepted. |
| `data` | `Object` | No | Both | Initial connection data: `{ connectionId, connectionName, connectionComboBox }`. |
| `activityId` | `String` | No | Inside Activity | The current activity ID (used to fetch upstream process variables). Omit outside activities. |
| `reqres` | `Backbone.Wreqr.RequestResponse` | No | Inside Activity | Designer Reqres channel for Process Model access. Omit outside activities. |
| `activityReqres` | `Backbone.Wreqr.RequestResponse` | No | Inside Activity | Activity-level Reqres channel. Omit outside activities. |

---

## 5. Public API Reference

### Methods

| Method | Return Type | Description |
| :--- | :--- | :--- |
| `getData()` | `Object` | Returns `{ connectionComboBox, connectionName, connectionId, connectionType, selectConnection }`. Sanitizes and clears unallowed connections. |
| `setData(obj)` | `void` | Selects the connection matching `obj.connectionComboBox` or `obj.connectionId`. |
| `getSelectedConnection()` | `String \| null` | Returns the currently selected `connectionId` (or `null` if placeholder / unallowed connection). |
| `getConnectionData()` | `Object` | Returns `{ connectionId, connectionName, connectionType }`. |
| `getConnectionType()` | `String` | Returns the `connectionType` string (e.g. `"OPCUA"`). |
| `getErrorMessage()` | `String` | Validates if a connection is selected and permitted by `allowedConnectionTypes`. Returns an error message if invalid, or `""` if valid. Use this to block form / activity saving. |
| `isConnectionAllowed(conn)` | `Boolean` | Checks whether the specified connection object or type matches `allowedConnectionTypes`. |
| `highlightErrors(errorList)` | `void` | Displays red border highlight and an error tooltip on the dropdown for each error object in the list. |
| `destroy()` / `onBeforeDestroy()` | `void` | Cleans up Kendo dropdown widget, tooltips, DOM elements, and model bindings. |

### Events

| Event Name | Constant | Payload | Description |
| :--- | :--- | :--- | :--- |
| `CHANGE_CONNECTION_VARIABLE` | `Constants.EVENTS.CHANGE_CONNECTION_VARIABLE` | `{ connectionId, connectionName, connectionType, connectionItem }` | Triggered when a **valid / allowed** connection is selected from the dropdown. |
| `REFRESH_CONNECTION` | `Constants.EVENTS.REFRESH_CONNECTION` | `{ connectionId, connectionName, connectionData }` | Triggered when the user clicks the refresh button. |
| `INVALID_CONNECTION_SELECTED` | `Constants.EVENTS.INVALID_CONNECTION_SELECTED` | `{ connectionId, connectionName, connectionType, message } \| undefined` | Triggered when an unallowed connection is selected, or when the dropdown is reset to "Select Connection". |

---

## 6. Model Schema

| Field Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `connectionComboBox` | `String` | `""` | Display text of the chosen connection. |

---

## 7. Component File Structure

```text
DeviceConnectorConnComponent/
├── DeviceConnectorConnComponent.js           # Core View and dropdown controller
├── DeviceConnectorConnComponent_readme.txt   # This integration & API guide
├── build.js                                  # RequireJS optimizer build configuration
├── config/
│   └── component.json                        # Component metadata and NLS mapping
├── constants/
│   └── Constants.js                          # Field IDs, event names, and default values
├── model/
│   └── DeviceConnectorConnComponentModel.js  # Backbone data model
├── nls/
│   └── DeviceConnectorConnComponentNLS.js    # Multi-language string bundle
├── style/
│   └── style.less                            # Component styling & layout
└── template/
    └── DeviceConnectorConnComponentTemplate.html # Template with input & refresh button
```
