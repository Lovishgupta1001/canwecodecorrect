# DeviceConnectorConnComponent (Standalone Usage)

A reusable UI connection dropdown component for selecting and validating Device Connector connections outside Process Designer activities (e.g. in dialogs, configuration panels, or standalone forms).

---

## 1. How to Pass Values to Connection

### A. At Initialization (via options)
```javascript
var connComp = new DeviceConnectorConnComponent({
    el: $("#standalone-connection-container"), // Target DOM/jQuery element (Required)
    allowedConnectionTypes: ["OPCUA"],         // Optional: e.g. ["OPCUA"], ["MQTT"]
    data: {
        connectionComboBox: "Local_OPCUA_Server" // Optional: preselected connection name
    }
});
connComp.render();
```

### B. Dynamically at Runtime (via `setData`)
```javascript
connComp.setData({
    connectionComboBox: "Local_OPCUA_Server"
});
```

---

## 2. How to Get Selected Connection & Details

### A. Reactive (When User Selects from Dropdown)
```javascript
connComp.listenTo(connComp, "CHANGE_CONNECTION_VARIABLE", function (data) {
    console.log("ID:", data.connectionId);     // e.g. "102"
    console.log("Name:", data.connectionName); // e.g. "Local_OPCUA_Server"
    console.log("Type:", data.connectionType); // e.g. "OPCUA"
    console.log("Item:", data.connectionItem); // Full item object from dataSource
});

// Optional: listen for unallowed or invalid selection
connComp.listenTo(connComp, "INVALID_CONNECTION_SELECTED", function (err) {
    console.warn("Invalid selection:", err.message);
});
```

### B. On-Demand (Anytime / Button Click / Form Submit)
```javascript
// Get all details at once:
var connData = connComp.getConnectionData();
// => { connectionId: "102", connectionName: "Local_OPCUA_Server", connectionType: "OPCUA", pluginDisplayName: "" }

// Or get individual fields:
var connId   = connComp.getSelectedConnection(); // returns "102" or null
var connType = connComp.getConnectionType();      // returns "OPCUA"
var connName = connComp.getData().connectionComboBox; // returns "Local_OPCUA_Server"
```

---

## 3. Pre-Submit Validation & Teardown

```javascript
// Pre-submit check (returns error message string or ""):
var errorMsg = connComp.getErrorMessage();
if (errorMsg) {
    alert(errorMsg);
    return false; // Abort submission
}

// Cleanup when modal/dialog closes:
connComp.destroy();
```
