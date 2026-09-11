# DeviceConnectorConnComponent

A reusable, generic UI connection dropdown component for eQube MI workflow activities and standalone applications. It provides a standardized Kendo dropdown with color-coded connection badges, real-time connection refreshing, process-variable merging, server-side protocol validation, and error tooltip highlighting with full NLS localization.

---

## 1. Standalone (Outside Activity)

Use this pattern when embedding the connection dropdown in modal dialogs, configuration panels, admin screens, or custom standalone views where activity-specific objects (`activityId`, `reqres`, `ActivitiesUtility`, etc.) do not exist.

### How Standalone Mode Operates
- **Zero Activity Dependencies**: Does not require `activityId`, `reqres`, or `activityReqres`.
- **Pure Server Fetch**: Directly fetches accessible connections via `services/fetchAccessibleDeviceConnectorConnections`.
- **Automatic Fallback**: `ActivitiesUtility` is dynamically detected; when not present in the runtime, it cleanly skips process variable merging without errors.
- **Server-Side Protocol Validation**: You can optionally supply `allowedConnectionTypes: ["OPCUA"]` to restrict selectable connections. On selection, the component validates against `componentservices/deviceconnector/validateConnection`. Omit it to allow any non-plugin connection.

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
        connectionComboBox: "Local_OPCUA_Server" // Optional: preselected connection display text
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
        console.log("Validation Result:", data.validationResult);
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
if (window.MIUIComponent?.DeviceConnectorConnComponent) {
    window.MIUIComponent.DeviceConnectorConnComponent(connOptions).done(function (comp) {
        comp.listenTo(comp, "CHANGE_CONNECTION_VARIABLE", function (data) {
            console.log("Connection chosen:", data.connectionName);
        });
    });
}
```

### Step 4: Validation & Pre-Submit Checks
Before submitting a custom form or applying changes, call `getErrorMessage()` or `validate()`:
```javascript
var errorMsg = connComp.getErrorMessage();
if (errorMsg) {
    // Displays error message from NLS or backend validation
    alert(errorMsg);
    return false; // Abort submission
}

// Or use synchronous validate() which automatically shows error tooltip if invalid:
if (!connComp.validate()) {
    return false;
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
//     connectionType: "OPCUA",
//     pluginDisplayName: ""
// }

// Get validated connection type directly
var connType = connComp.getConnectionType(); // e.g. "OPCUA"

// Get normalized model object
var modelData = connComp.getData();
// modelData => { connectionComboBox: "Local_OPCUA_Server" }
```

### Step 6: Teardown & Cleanup
When the dialog or panel is closed, clean up DOM bindings and Kendo widgets:
```javascript
if (connComp) {
    connComp?.destroy?.();
    connComp = null;
}
```

---

## 2. Inside Activity (Process Designer)

Follow this pattern when embedding the connection dropdown inside an eQube MI Process Designer Activity (such as `InvokeOPCUAComponent.js`, `FileZip.js`, `PublishUIComponent.js`, etc.).

### How Activity Mode Operates
- **Hybrid Source Merging**: Combines accessible connections with upstream in-flight process model variables via `ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(processModel, activityId)`.
- **Initial Data Fetch**: Queries `componentservices/deviceconnector/getDeviceConnectorConnInitialData` to fetch accessible connection IDs and validate any pre-existing connection.
- **Server-Side Validation**: Validates connections against `componentservices/deviceconnector/validateConnection` using `allowedConnectionTypes`.
- **Platform Lifecycle**: Integrates cleanly with Process Designer's lifecycle (`onRender`, `getData`, `setData`, `getErrorMessage`, `highlightErrors`, `onBeforeDestroy`).
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
    if (window.MIUIComponent?.DeviceConnectorConnComponent) {
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

        // Initial connection fetch on load (for pre-saved connections)
        globalSelf.listenTo(
            globalSelf.deviceConnComp,
            DeviceConnConstants.EVENTS.INITIAL_CONNECTION_FETCH,
            function (initialData) {
                console.log("Initial connection verified:", initialData.connectionName);
            }
        );
    });
}
```

### Step 3: Handle Activity Model Events
```javascript
_onConnectionChanged: function (connData) {
    var connId = connData ? connData.connectionId : "";
    var connName = connData ? (connData.connectionName || "") : "";
    var connType = connData ? (connData.connectionType || "") : "";

    // Update Activity Backbone Model
    this.model.setKey("connectionComboBox", connName);
    this.model.setKey("connectionName", connName);
    this.model.setKey("connectionId", connId);
    this.model.setKey("connectionType", connType);
    this.model.setKey("selectConnection", connName || connId);

    // Reveal configuration controls and trigger downstream data loading
    this.$(".activity-config-section").show();
},

_onConnectionInvalid: function (errData) {
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
    if (this.deviceConnComp?.getErrorMessage) {
        var connErr = this.deviceConnComp.getErrorMessage();
        if (connErr) {
            return connErr; // Blocks saving to database
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
    var connData = this.deviceConnComp?.getConnectionData?.() || {};
    this.model.setKey("connectionComboBox", connData.connectionName || "");
    this.model.setKey("connectionName", connData.connectionName || "");
    this.model.setKey("connectionId", connData.connectionId || "");
    this.model.setKey("connectionType", connData.connectionType || "");
    this.model.setKey("selectConnection", connData.connectionName || connData.connectionId || "");
    return this.model.toJSON();
}
```

### Step 6: Populate Data in `setData(obj)`
```javascript
setData: function (obj) {
    if (!obj) return;
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            this.model.setKey(key, obj[key]);
        }
    }
    this.deviceConnComp?.setData?.(obj);
}
```

### Step 7: Forward Platform Validation Errors in `highlightErrors()`
```javascript
highlightErrors: function (errorObjectList) {
    if (!errorObjectList?.length) return;

    errorObjectList.forEach(function (errorObject) {
        if (!errorObject) return;
        var path = errorObject.path || errorObject.resource || "";

        if (path.indexOf("connection") !== -1 || path.indexOf("selectConnection") !== -1) {
            this.deviceConnComp?.highlightErrors?.([errorObject]);
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
        this.deviceConnComp.destroy?.();
        this.deviceConnComp = null;
    }
}
```

---

## 3. `allowedConnectionTypes` Filtering & Server-Side Validation

1. **Full Visibility at Dropdown Population**:
   - The dropdown displays **all accessible device connector connections** in the user's environment via `services/fetchAccessibleDeviceConnectorConnections`.
   - Populates `connectionId`, `connectionName`, `connectionType`, and `connectionColor` without restricting items up front.
2. **Server-Side Validation at Choosing / Load Time**:
   - When a user selects a connection (or when an existing connection is loaded in `onRender` or `setData`):
     - The component sends `POST componentservices/deviceconnector/validateConnection?connId=<id>` with payload `allowedConnectionTypes` (e.g. `["OPCUA"]`).
     - On the backend, `DeviceConnectorHelper.validateConnection()` fetches the connection configuration, inspects `deviceType` in `connectionProperties`, and verifies if it matches `allowedConnectionTypes`.
3. **Behavior on Selecting an Unallowed or Invalid Connection**:
   - **Visual Feedback**: Shows red border highlight (`.components-error-red-highlight`), an error tooltip on the dropdown with the server or NLS message, and an error notification banner (`uilayer.notifier("error", message)`).
   - **Model Reset**: Clears `connectionComboBox` in `this.model` to `""`.
   - **Event**: Triggers `INVALID_CONNECTION_SELECTED` with payload `{ connectionId, message, validationResult }`.
   - **Pre-Save Check**: `getErrorMessage()` returns the validation error message, blocking the activity from being saved.
4. **Behavior on Selecting an Allowed Connection**:
   - Hides any existing error tooltip and removes the red border highlight.
   - Saves `lastValidatedConnectionId`, `lastValidatedConnectionName`, and `lastValidatedConnectionType`.
   - Updates `this.model.set("connectionComboBox", connText)`.
   - Attaches `connectionType` to the selected item cache.
   - Triggers `CHANGE_CONNECTION_VARIABLE` with payload `{ connectionId, connectionName, connectionType, connectionItem, validationResult }`.
   - `getErrorMessage()` returns `""`.

---

## 4. Configuration Options Reference

| Option | Type | Required? | Context | Description |
| :--- | :--- | :--- | :--- | :--- |
| `el` | `jQuery \| HTMLElement \| String` | **Yes** | Both | Container DOM element where the dropdown is rendered. |
| `allowedConnectionTypes` | `Array<String> \| String` | No | Both | List of allowed connection types (e.g. `["OPCUA"]`). Validated on the server. If omitted, all non-plugin connections are accepted. |
| `data` | `Object` | No | Both | Initial connection data: `{ connectionComboBox }`. |
| `activityId` | `String` | No | Inside Activity | The current activity ID (used to fetch upstream process variables). Omit outside activities. |
| `reqres` | `Backbone.Wreqr.RequestResponse` | No | Inside Activity | Designer Reqres channel for Process Model access. Omit outside activities. |
| `activityReqres` | `Backbone.Wreqr.RequestResponse` | No | Inside Activity | Activity-level Reqres channel. Omit outside activities. |

---

## 5. Public API Reference

### Methods

| Method | Return Type | Description |
| :--- | :--- | :--- |
| `getData()` | `Object` | Returns `{ connectionComboBox: "..." }`. |
| `setData(obj)` | `void` | Selects the connection matching `obj.connectionComboBox`, sets the model, and validates the connection. |
| `getSelectedConnection()` | `String \| null` | Returns the currently selected `connectionId` (or `null` if placeholder / unallowed connection). |
| `getConnectionData()` | `Object` | Returns `{ connectionId, connectionName, connectionType, pluginDisplayName }`. |
| `getConnectionType()` | `String` | Returns the validated `connectionType` string (e.g. `"OPCUA"`). |
| `getAccessibleConnectionIds()` | `Array<Long>` | Returns the array of accessible connection IDs fetched via initial data service. |
| `getErrorMessage()` | `String` | Validates if a connection is selected and permitted by `allowedConnectionTypes` and server validation. Returns an error message if invalid, or `""` if valid. Use this to block form / activity saving. |
| `isValid()` | `Boolean` | Returns `true` if `getErrorMessage() === ""`, otherwise `false`. |
| `validate()` | `Boolean` | Synchronous validation check. Shows the error tooltip if invalid and returns boolean. |
| `validateConnection(callback)` | `Object \| void` | Asynchronous validation method that calls the backend and passes result `{ valid, connectionId, connectionName, connectionType, message }` to callback. |
| `isConnectionAllowed(conn)` | `Boolean` | Checks whether the specified connection or validated type matches `allowedConnectionTypes`. |
| `highlightErrors(errorList)` | `void` | Displays red border highlight and an error tooltip on the dropdown for each error object in the list. |
| `destroy()` / `onBeforeDestroy()` | `void` | Cleans up Kendo dropdown widget, tooltips, DOM elements, and model bindings. |

### Events

| Event Name | Constant | Payload | Description |
| :--- | :--- | :--- | :--- |
| `CHANGE_CONNECTION_VARIABLE` | `Constants.EVENTS.CHANGE_CONNECTION_VARIABLE` | `{ connectionId, connectionName, connectionType, connectionItem, validationResult }` | Triggered when a **valid / allowed** connection is selected and verified by the server. |
| `REFRESH_CONNECTION` | `Constants.EVENTS.REFRESH_CONNECTION` | `{ connectionId, connectionName, connectionData, validationResult }` | Triggered when the user clicks the refresh button and the connection revalidates successfully. |
| `INITIAL_CONNECTION_FETCH` | `Constants.EVENTS.INITIAL_CONNECTION_FETCH` | `{ connectionId, connectionName }` | Triggered during initial load when a pre-existing connection is restored. |
| `INVALID_CONNECTION_SELECTED` | `Constants.EVENTS.INVALID_CONNECTION_SELECTED` | `{ connectionId, message, validationResult }` | Triggered when an unallowed or invalid connection is selected, or when validation fails. |

---

## 6. Model Schema

| Field Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `connectionComboBox` | `String` | `""` | Display text of the chosen connection. |

---

## 7. Backend Architecture & REST Services

The component interacts with two backend services:

1. **`CommonServicesRestController`** (`services/fetchAccessibleDeviceConnectorConnections`):
   - Fetches all accessible device connector connections (returns `List<DeviceConnectorBean>`).
   - Populates the dropdown options with display name, connection ID, connection type, and color badge.
2. **`DeviceConnectorRestController`** (`componentservices/deviceconnector/...`):
   - `GET getDeviceConnectorConnInitialData`:
     - Invoked on component load to fetch accessible connection IDs (`connIds`).
   - `POST validateConnection?connId=<id>`:
     - Invoked whenever a connection is selected, loaded, or refreshed.
     - Accepts request body of `List<String> allowedConnectionTypes`.
     - Delegated to `DeviceConnectorHelper.validateConnection()` which inspects the raw `ConnectionConfigurationView`'s `deviceType` property and returns a `DeviceConnectorValidationResult`.

---

## 8. NLS Internationalization

All user-facing strings are strictly resolved via NLS (`nls/DeviceConnectorConnComponentNLS.js`):
- `labels.connection`: `"Connection"`
- `buttons.refreshConnection`: `"Refresh connection"`
- `messages.selectConnection`: `"Select Connection"`
- `messages.selectValidConnection`: `"Select a valid connection."`
- `messages.connectionsRefreshed`: `"Connections refreshed successfully."`
- `messages.invalidConnection`: `"Select a valid connection."`
- `messages.invalidConnectionType`: `"Selected connection is not allowed."`
- `messages.validationFailed`: `"Failed to validate connection."`

---

## 9. Component File Structure

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
