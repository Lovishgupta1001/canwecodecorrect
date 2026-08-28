# Invoke OPC UA: Output Value Hint Generation & Downstream Propagation Guide

This document explains the end-to-end architecture and implementation of **dynamic hint generation** in the OFC / eQube-MI Designer framework, based on the scan of `AddTab.js`, `ProcessModel.js`, and `KeyInfoHelper.js`. It also details how this exact pattern is applied to **Invoke OPC UA (Call Method -> Output Value)** so that variable names entered in the grid column immediately propagate as hints to downstream activities, tabs, and Expression Builders.

---

## 1. Architectural Overview: How Variable Hints Work in OFC

In the eQube-MI Process Designer, hint generation and downstream variable resolution follow a 5-stage reactive pipeline:

```
[User types variable name in Grid / Input Field]
                     │
                     ▼
[1. UI Component Event (cellClose / save)]
  - Gathers grid data, fieldId, new name & old name
  - Calls processModel.addVariable(gridData, fieldId, activityId, tabName)
                     │
                     ▼
[2. KeyInfoHelper.js (ProcessModel mixin)]
  - Updates local ActivityDataModel (_setVariables)
  - Updates Retain tab & Config key list (_setRetainInformation)
  - Fires WebSocket Sync Event (SynchEvents.ADD_VARIABLE / UPDATE_VARIABLE)
                     │
                     ▼
[3. Backend Server & WebSocket Push]
  - Server infers type schema / metadata for the variable
  - Pushes HINT_EVENT with keyHintChangeList to UI via WebSocket
                     │
                     ▼
[4. Hint Registry & KeyInfoModel Storage]
  - ProcessModel.updateHintDetails(data) -> _updateHints(hints)
  - Creates HintModel via new HintGeneratorFactory(metaDataType, hint).getHintModel()
  - Registers into KeyInfoModel: keyInfo.addKeyInfo(key, type, tabName, hintModel, stepId, fieldId)
                     │
                     ▼
[5. Downstream Resolution & Expression Builder Autocomplete]
  - Downstream activity / ExpressionBuilder requests hints:
    processModel.getClosestKeysDetails(stepId, currentTabName)
  - Traverses upstream originator activities backwards in DAG
  - Retrieves hint model from KeyInfoModel and populates autocomplete dropdowns/tooltips!
```

---

## 2. Deep Dive: Code Scan & Line-by-Line Breakdown

### 2.1 `AddTab.js` (UI Layer Trigger)
- **Cell Edit / Save Handler (`onSaveGridChange`)**:
  ```javascript
  onSaveGridChange: function ( event, oldName ) {
      this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore');
      let variableName = typeof event.model.get("variableName") == 'object'
          ? event.model.get("variableName").variableName
          : event.model.get("variableName");
      let expression = _.isObject(event.model.expression)
          ? this.getExpression(event.model.expression)
          : event.model.expression;

      let gridData = this._getGridData();
      if ((!_.isNull(oldName)) && (!_.isUndefined(oldName)) && (!_.isObject(oldName))) {
          this._addOldVariableName(gridData, oldName, event.model.fieldId);
      }
      // CRITICAL CALL: Passes variable list, fieldId, activityId, and tabName ("ADD")
      this.processModel.addVariable(gridData, event.model.fieldId, this.activityId, "ADD");
  }
  ```
- **Row Deletion (`_deleteRow`)**:
  Calls `processModel.removeVariable(variableName, expression, activityId, "ADD", fieldId, rowId)` and updates row indices via `processModel.updateRowOfAddVariables`.
- **Reordering (`onChangeRowIndex`)**:
  Calls `processModel.updateVariables(this._getGridData(), this.activityId, "ADD")`.

---

### 2.2 `ProcessModel.js` (Core Coordinator)
- **Mixin Initialization (`_initializeHelpers`)**:
  ```javascript
  _initializeHelpers: function () {
      _.extend(this.__proto__, CanvasHelper, ProcessDetailsHelper, StepTabHelper, KeyInfoHelper);
  }
  ```
  `ProcessModel` directly inherits all methods from `KeyInfoHelper`.
- **Namespace Generation (`_getHintNotificationNamespace`)**:
  ```javascript
  _getHintNotificationNamespace: function () {
      let processIdentifier = this.get("processIdentifier");
      return `PROCESS_${processIdentifier.getName()}_${processIdentifier.getVersion()}`;
  }
  ```
- **Hint Population on Edit Flow (`populateHintsInEditProcessFlow`)**:
  Pulls cached hints from `socketHintListener.getHintDatafromHintRegistry(...)` and calls `this.updateHintDetails(hintData)`.

---

### 2.3 `KeyInfoHelper.js` (Key & Hint Engine)

#### A. Variable Registration & WebSocket Synchronization
```javascript
addVariable: function addVariable(variables, operatedFieldID, stepID, tabName) {
    var preparedVariables = this._prepareVariables(variables);
    var isUpdate = this._isUpdateVariableOperation(operatedFieldID, stepID);

    this._setVariables(preparedVariables, stepID);
    this._setRetainInformation(stepID);

    var toSyncVariables = this._getVariableDetailsFromFieldID(operatedFieldID, stepID);
    if (toSyncVariables && !_.isEmpty(toSyncVariables)) {
        var syncEvent = isUpdate ? SynchEvents.UPDATE_VARIABLE : SynchEvents.ADD_VARIABLE;
        this._syncVariable(this._prepareToSyncVariableList(toSyncVariables, stepID, tabName), syncEvent);
    }
}
```
- `_prepareToSyncVariable`: Builds payload `{ stepId, tabName, fieldId, row, newName, oldName, expression }`.
- `_syncVariable`: Sends WebSocket event:
  ```javascript
  this.syncEvent(syncEvent, {
      variableList: variableList,
      processName: this.getProcessName(),
      processId: this.getProcessID()
  });
  ```

#### B. Receiving & Storing Hint Metadata
```javascript
updateHintDetails: function updateHintDetails(data) {
    this._removeHints(data.removedKeyHintList);
    this._removeKeys(data.removedKeys);
    this._updateHints(data.keyHintChangeList);
}

_updateHints: function _updateHints(hints) {
    var _this3 = this;
    var keyInfo = this.getKeyInfo();
    if (hints) _.each(hints, function (hint) {
        hint.fieldId = _this3._formatFieldID(hint.fieldId);
        var metaDataType = hint.details ? hint.details.metaDataType : null;
        var hintModel = new HintGeneratorFactory(metaDataType, hint).getHintModel();
        var writer = keyInfo.getOldWriter(hint.key, hint.tabName, hint.stepId, hint.fieldId);
        if (writer) writer.setDetails(hintModel);
        else keyInfo.addKeyInfo(hint.key, null, hint.tabName, hintModel, hint.stepId, hint.fieldId);
    });
}
```

#### C. Downstream Resolution Across the Process DAG
```javascript
getClosestKeysDetails: function getClosestKeysDetails(stepId, currentTabName) {
    return this.getAllKeysWithDetails(currentTabName, this.getBPMEntityById(stepId));
}

getAllKeysWithDetails: function getAllKeysWithDetails(tab, entity) {
    var mapForKeyInfo = {};
    if (entity == null) return mapForKeyInfo;
    this.updateKeyInfoForEntity(tab, mapForKeyInfo, entity);
    return mapForKeyInfo;
}

_getClosestKeyDetailsFromKeyInfo: function (selectedEntity, writerObj, visited, currentTabName, originalStepId) {
    var keyInfo = this.getKeyInfo();
    var queue = [selectedEntity];
    while (queue.length) {
        var entity = queue.shift();
        if (visited.indexOf(entity.getId()) >= 0) continue;
        visited.push(entity.getId());

        // Check if current entity in queue is a writer for the variable
        var writer = keyInfo._getKeyDetails(entity.getId(), writerObj, currentTabName, originalStepId, this);
        if (writer) return writer;

        // Traverse backward to upstream originator activities in the DAG
        var originators = this.getOriginatorsActivity(entity.getId());
        originators.forEach(function (originator) { queue.push(originator); });
    }
}
```

---

## 3. Implementation in Invoke OPC UA (`Output Value` Column)

To enable this exact behavior for Invoke OPC UA Call Method mode:
When the user types a variable name into the **Output Value** column:
1. `CallMethodGridManager.js` tracks the old variable name and new variable name per row.
2. Each row is assigned a unique `fieldId` (`CM_<id>`).
3. On cell edit (`cellClose` / `save` / `change`), `onOutputValueChange` calls:
   `globalSelf.processModel.addVariable(gridData, fieldId, globalSelf.activityId, "CONFIGURATION")`
4. If a variable name is cleared or the row is deleted, `globalSelf.processModel.removeVariable(...)` is called to clean up the key from `KeyInfoModel` and inform downstream activities.

### Modified Files in `InvokeOPCUA-Designer`:
1. `InvokeOPCUA-Designer/src/main/resources/UI/InvokeOPCUA/js/CallMethodGridManager.js`:
   - Added `fieldId` in schema model.
   - Enhanced `_outputValueEditor` to track `options.model._oldOutputValue`.
   - Added `onOutputValueChange`, `_getOutputVariablesGridData`, `_addOldVariableName`, and `onDeleteCallMethodRows`.
   - Wired `cellClose` and `save` events to invoke `onOutputValueChange`.
2. `InvokeOPCUA-Designer/src/main/resources/UI/InvokeOPCUA/InvokeOPCUAComponent.js`:
   - Updated `_deleteGridRows` to call `CallMethodGridManager.onDeleteCallMethodRows`.
   - Updated `_onAddCallMethodRow` to assign a unique `fieldId` (`CM_<timestamp>_<index>`).

---

## 4. Verification Flow

1. Open **Invoke OPC UA** activity in Process Designer.
2. Select **Call Method** mode.
3. In a method row, type `myMethodResult` in the **Output Value** column.
4. Click out of the cell.
5. In any downstream activity (e.g. Script tab, Expression Builder, or subsequent activity), open the Expression Builder or Retain tab.
6. Observe that `myMethodResult` appears in the list of available variable hints and autocomplete suggestions.
