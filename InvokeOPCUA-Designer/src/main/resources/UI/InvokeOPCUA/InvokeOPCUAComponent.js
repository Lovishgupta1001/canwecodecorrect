/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        template = require("tpl!./template/InvokeOPCUAComponentTemplate"),
        model = require("./model/InvokeOPCUAComponentModel"),
        nls = require("i18n!./nls/InvokeOPCUAComponentNLS"),
        Constants = require("./js/constants"),
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility,
        DeviceConnectorConnComponent = require("Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent"),
        DataChangeGridManager = require("./js/DataChangeGridManager"),
        CallMethodGridManager = require("./js/CallMethodGridManager"),
        AddressSpaceBrowser = require("./js/AddressSpaceBrowser");

    var InvokeOPCUAUIComponent = MIUIComponentI.extend({

        model: model,
        template: template,
        nls: nls,

        events: {
            "click .invokeopcua-delete-row": "_onDeleteGridRow",
            "click .invokeopcua-grid-delete-btn": "_onDeleteToolbarRow",
            "click .input-parameter-badge": "_onInputParameterBadgeClick",
            "click .data-change-write-add-btn": "_onAddDataChangeRow",
            "click .call-method-add-btn": "_onAddCallMethodRow",
            "change .data-change-write-radio": "_updateOperationUI",
            "change .call-method-radio": "_updateOperationUI"
        },

        onInitialize: function (options) {
            this.activityId = options.activityId;
            this.designerReqres = options.reqres;
            this.activityReqres = options.activityReqres || (Backbone?.Wreqr ? new Backbone.Wreqr.RequestResponse() : null);
            this.processModel = this.designerReqres ? this.designerReqres.request("getCurrentActiveEntityModelFromDataStore") : null;

            if (!this.model.getKey("dataChangeWrite")) {
                this.model.setKey("dataChangeWrite", []);
            }

            if (!this.model.getKey("callMethod")) {
                this.model.setKey("callMethod", []);
            }
        },

        onRender: function () {
            var globalSelf = this;
            var deferred = $.Deferred();

            this._initializeControls();

            var actId = this.activityId;
            var operationGroupName = "operation-" + actId;
            var executionModeGroupName = "execution-mode-" + actId;

            this.$(".data-change-write-radio, .call-method-radio")
                .attr("name", operationGroupName);

            this.$(".parallel-mode-radio, .sequential-mode-radio")
                .attr("name", executionModeGroupName);

            var operation = this.model.getKey("operation") || Constants.DATA_CHANGE_WRITE;
            this.$(".data-change-write-radio").prop("checked", operation === Constants.DATA_CHANGE_WRITE);
            this.$(".call-method-radio").prop("checked", operation === Constants.CALL_METHOD);

            var executionMode = this.model.getKey("executionMode") || Constants.PARALLEL;
            this.$(".parallel-mode-radio").prop("checked", executionMode === Constants.PARALLEL);
            this.$(".sequential-mode-radio").prop("checked", executionMode === Constants.SEQUENTIAL);

            this._renderDrawer();
            this._initAddressSpaceBrowser();
            this._fetchPluginTypes();
            this._initConnectionUI();
            this._updateOperationUI();
            this._renderHelp();

            $(window).off("resize.invokeopcua").on("resize.invokeopcua", function () {
                if (globalSelf.dataChangeWriteGrid?.widget) {
                    globalSelf.dataChangeWriteGrid.widget.resize();
                }
                if (globalSelf.callMethodGrid?.widget) {
                    globalSelf.callMethodGrid.widget.resize();
                }
                var drawerElem = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                var isDrawerOpen = drawerElem.length && drawerElem.is(":visible") && drawerElem.width() > 50;
                if (isDrawerOpen) {
                    globalSelf.addressSpaceDrawer?.resizeDrawer("invokeopcua-address-space-drawer-section", "50%");
                    var tree = globalSelf.addressSpaceBrowser?._getTreeWidget ? globalSelf.addressSpaceBrowser._getTreeWidget() : null;
                    if (tree && typeof tree.resize === "function") {
                        tree.resize();
                    }
                }
            });

            deferred.resolve();

            return deferred.promise();
        },

        _renderDrawer: function () {
            var globalSelf = this;
            var containerElem = this.$el.find("#invokeopcua-main-container");
            if (!containerElem.length) {
                containerElem = this.$("#invokeopcua-main-container");
            }
            if (!containerElem.length) {
                containerElem = this.$el;
            }

            this.addressSpaceDrawer = uilayer.drawer({
                elem: containerElem,
                section: {
                    "invokeopcua-address-space-drawer-section": {
                        position: "right",
                        toggleHandle: true,
                        resizable: true,
                        dimensionValue: "50%",
                        min: "30%",
                        max: "70%"
                    }
                }
            });

            this._bindDrawerEvents();
        },

        _bindDrawerEvents: function () {
            var globalSelf = this;
            var drawerSection = this.$el.find("#invokeopcua-address-space-drawer-section");

            this.$el.off("click.invokeopcuaDrawer").on("click.invokeopcuaDrawer",
                ".ul-drawer-toggle, [class*='drawer-toggle'], [class*='toggle-handle'], [class*='toggleHandle'], [class*='splitbar']",
                function () {
                    setTimeout(function () {
                        var $sec = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                        var isVisible = $sec.length && $sec.is(":visible") && $sec.width() > 50 && !$sec.hasClass("ul-state-collapsed");
                        if (isVisible && globalSelf.addressSpaceBrowser && typeof globalSelf.addressSpaceBrowser.openOnDrawerExpand === "function") {
                            globalSelf.addressSpaceBrowser.openOnDrawerExpand();
                        }
                    }, 200);
                }
            );

            if (drawerSection.length && window.MutationObserver) {
                var observer = new MutationObserver(function () {
                    var $sec = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                    var isVisible = $sec.length && $sec.is(":visible") && $sec.width() > 50 && !$sec.hasClass("ul-state-collapsed");
                    if (isVisible && globalSelf.addressSpaceBrowser && typeof globalSelf.addressSpaceBrowser.openOnDrawerExpand === "function") {
                        globalSelf.addressSpaceBrowser.openOnDrawerExpand();
                    }
                });
                observer.observe(drawerSection[0], { attributes: true, attributeFilter: ["style", "class"] });
                this._drawerObserver = observer;
            }
        },

        _initAddressSpaceBrowser: function () {
            AddressSpaceBrowser.init(this, this.$el.find("#invokeopcua-address-space-component"));
            this.addressSpaceBrowser = AddressSpaceBrowser;
        },

        getConnectionPayload: function () {
            if (this.deviceConnComp && typeof this.deviceConnComp.getConnectionData === "function") {
                var connData = this.deviceConnComp.getConnectionData();
                var id = connData.connectionId || this.model.getKey("connectionId") || "";
                var name = connData.connectionName || connData.name || this.model.getKey("connectionName") || "";
                var type = connData.connectionType || connData.type || this.model.getKey("connectionType") || "";
                return {
                    connectionId: id,
                    connectionName: (name && name !== this.nls.SelectConnection) ? name : "",
                    name: (name && name !== this.nls.SelectConnection) ? name : "",
                    type: type,
                    connectionType: type
                };
            }
            var connId = this.model.getKey("connectionId") || "";
            var connText = this.model.getKey("connectionName") || this.model.getKey("connectionComboBox") || "";
            var connType = this.model.getKey("connectionType") || "";

            return {
                connectionId: connId || "",
                connectionName: (connText && connText !== this.nls.SelectConnection) ? connText : "",
                name: (connText && connText !== this.nls.SelectConnection) ? connText : "",
                type: connType,
                connectionType: connType
            };
        },

        _renderHelp: function () {
            var parallelElem = this.$el.find("#parallel-mode-help-container");
            if (parallelElem.length) {
                uilayer.help({
                    elem: parallelElem,
                    position: "top",
                    width: "15%"
                });
            }

            var sequentialElem = this.$el.find("#sequential-mode-help-container");
            if (sequentialElem.length) {
                uilayer.help({
                    elem: sequentialElem,
                    position: "top",
                    width: "15%"
                });
            }
        },

        _initializeControls: function () {
            this.$(".data-change-write-container").hide();
            this.$(".call-method-container").hide();
            this.$(".invokeopcua-config-controls").hide();
            this.$(".invokeopcua-grids-section").hide();
        },

        _getGridInstance: function () {
            if (this.$(".data-change-write-container").is(":visible") && this.dataChangeWriteGrid) {
                return this.dataChangeWriteGrid.widget || this.dataChangeWriteGrid;
            }
            if (this.$(".call-method-container").is(":visible") && this.callMethodGrid) {
                return this.callMethodGrid.widget || this.callMethodGrid;
            }
            return null;
        },

        getSelectedRows: function () {
            var grid = this._getGridInstance();
            if (!grid) {
                return $();
            }

            var selected = grid.select ? grid.select() : $();
            if (selected?.length) {
                return selected;
            }

            var tbody = grid.tbody || (grid.element ? grid.element.find("tbody") : null);
            if (tbody?.length) {
                var checked = tbody.find("input:checked");
                if (checked.length) {
                    return checked.closest("tr");
                }
            }

            return $();
        },

        _collectRowsToDelete: function () {
            var selectedRows = this.getSelectedRows();
            if (selectedRows?.length) {
                var uniqueRows = [];
                selectedRows.each(function () {
                    var tr = $(this).closest("tr");
                    if (tr.length && uniqueRows.indexOf(tr[0]) === -1) {
                        uniqueRows.push(tr[0]);
                    }
                });
                return uniqueRows;
            }
            return [];
        },

        _deleteGridRows: function (grid, rowElements) {
            var globalSelf = this;
            var dataItems = _.compact(_.uniq(rowElements.map(function (elem) {
                return grid.dataItem ? grid.dataItem(elem) : null;
            })));

            if (this.$(".call-method-radio").is(":checked") && dataItems.length) {
                CallMethodGridManager.removeOutputVariablesFromProcessModel(dataItems, globalSelf);
            }

            if (dataItems.length && grid.dataSource) {
                dataItems.forEach(function (item) {
                    grid.dataSource.remove(item);
                });
            } else {
                rowElements.forEach(function (elem) {
                    grid.removeRow?.($(elem));
                });
            }
        },

        _onDeleteGridRow: function (event) {
            var row = $(event.currentTarget).closest("tr");
            var grid = this._getGridInstance();
            if (grid && row.length) {
                this._deleteGridRows(grid, [row[0]]);
            }
        },

        _onDeleteToolbarRow: function () {
            var grid = this._getGridInstance();
            if (!grid) {
                return;
            }

            var rowsToBeDeleted = this._collectRowsToDelete(grid);
            if (rowsToBeDeleted.length) {
                this._deleteGridRows(grid, rowsToBeDeleted);
            }
        },

        _onAddDataChangeRow: function () {
            if (this.dataChangeWriteGrid?.widget?.dataSource) {
                this.dataChangeWriteGrid.widget.dataSource.add({
                    name: "",
                    nodeId: "",
                    sampleValue: "",
                    newValue: ""
                });
            }
        },

        _onAddCallMethodRow: function () {
            if (this.callMethodGrid?.widget?.dataSource) {
                var count = this.callMethodGrid.widget.dataSource.data().length;
                this.callMethodGrid.widget.dataSource.add({
                    name: "",
                    nodeId: "",
                    objectName: "",
                    objectNodeId: "",
                    inputParameters: [],
                    outputValue: "",
                    fieldId: "CM_" + Date.now() + "_" + count
                });
            }
        },

        _fetchPluginTypes: function () {
            var deferred = $.Deferred();

            if (this._pluginTypes) {
                deferred.resolve(this._pluginTypes);
                return deferred.promise();
            }

            AjaxUtility.commonAjaxRequest(
                "GET",
                "activities/InvokeOPCUA/getSupportedPluginType",
                null,
                "JSON"
            ).done(function (pluginType) {
                this._pluginTypes = pluginType;
                deferred.resolve(pluginType);
            }.bind(this)).fail(function () {
                deferred.reject();
            });

            return deferred.promise();
        },

        _initConnectionUI: function () {
            var globalSelf = this;
            this._fetchPluginTypes().done(function (pluginTypes) {
                var container = globalSelf.$el.find("#invokeopcua-connection-component-container");
                var connData = {};
                if (globalSelf.initialData) {
                    connData = _.clone(globalSelf.initialData);
                }
                var initialConn = globalSelf.model.getKey("connectionComboBox") || globalSelf.model.getKey("selectConnection") || globalSelf.model.getKey("connectionName") || (globalSelf.initialData && globalSelf.initialData.selectConnection);
                connData.connectionComboBox = initialConn;
                connData.selectConnection = initialConn;
                connData.connectionName = globalSelf.model.getKey("connectionName") || initialConn;
                connData.connectionId = globalSelf.model.getKey("connectionId") || (globalSelf.initialData && globalSelf.initialData.connectionId);

                var compOptions = {
                    el: container,
                    activityId: globalSelf.activityId,
                    reqres: globalSelf.designerReqres,
                    activityReqres: globalSelf.activityReqres,
                    pluginType: pluginTypes,
                    data: connData
                };

                if (typeof DeviceConnectorConnComponent === "function") {
                    globalSelf.deviceConnComp = new DeviceConnectorConnComponent(compOptions);
                    globalSelf.deviceConnComp.render();
                    globalSelf._setupDeviceConnListeners();
                } else if (typeof MIUIComponent !== "undefined" && typeof MIUIComponent.DeviceConnectorConnComponent === "function") {
                    var promise = MIUIComponent.DeviceConnectorConnComponent(compOptions);
                    if (promise && promise.done) {
                        promise.done(function (comp) {
                            globalSelf.deviceConnComp = comp;
                            globalSelf._setupDeviceConnListeners();
                        });
                    }
                }
            });
        },

        _setupDeviceConnListeners: function () {
            if (!this.deviceConnComp) {
                return;
            }

            this.listenTo(this.deviceConnComp, Constants.EVENTS.CHANGE_CONNECTION_VARIABLE, this._onConnectionChanged.bind(this));
            this.listenTo(this.deviceConnComp, Constants.EVENTS.REFRESH_CONNECTION, this._onConnectionRefreshed.bind(this));
            this.listenTo(this.deviceConnComp, Constants.EVENTS.INVALID_CONNECTION_SELECTED, this._onConnectionInvalid.bind(this));

            var selectedConn = this.deviceConnComp.getSelectedConnection ? this.deviceConnComp.getSelectedConnection() : null;
            if (selectedConn) {
                var connData = this.deviceConnComp.getConnectionData ? this.deviceConnComp.getConnectionData() : { connectionId: selectedConn };
                connData.isInitial = true;
                this._onConnectionChanged(connData);
            }
        },

        _onConnectionChanged: function (connData) {
            if (!connData || !connData.connectionId) {
                this._onConnectionInvalid();
                return;
            }

            this.$(".invokeopcua-config-controls, .invokeopcua-grids-section").show();

            var connId = connData.connectionId;
            var connName = connData.connectionName || connData.name || "";
            var connType = connData.connectionType || connData.type || "";

            this.model.setKey("connectionComboBox", connName);
            this.model.setKey("connectionName", connName);
            this.model.setKey("connectionId", connId);
            this.model.setKey("connectionType", connType);
            this.model.setKey("selectConnection", connName || connId);

            if (!connData.isInitial) {
                var currentDc = this.model.getKey("dataChangeWrite") || [];
                if (!currentDc.length) {
                    this.model.setKey("dataChangeWrite", [{
                        name: "",
                        nodeId: "",
                        sampleValue: "",
                        newValue: ""
                    }]);
                }

                var currentCm = this.model.getKey("callMethod") || [];
                if (!currentCm.length) {
                    this.model.setKey("callMethod", [{
                        name: "",
                        nodeId: "",
                        objectName: "",
                        objectNodeId: "",
                        inputParameters: [],
                        outputValue: ""
                    }]);
                }
            }

            DataChangeGridManager.refreshGridMode(this);
            CallMethodGridManager.refreshGridMode(this);

            if (this.addressSpaceBrowser?.onConnectionChange) {
                var connPayload = this.getConnectionPayload();
                this.addressSpaceBrowser.onConnectionChange(connPayload);
            }
        },

        _onConnectionRefreshed: function () {
            if (this.addressSpaceBrowser?.onConnectionChange) {
                var connPayload = this.getConnectionPayload();
                this.addressSpaceBrowser.onConnectionChange(connPayload);
            }
        },

        _onConnectionInvalid: function () {
            this.$(".invokeopcua-config-controls, .invokeopcua-grids-section").hide();

            this.dataChangeOptions = [];
            this.callMethodOptions = [];

            this.model.setKey("connectionComboBox", "");
            this.model.setKey("connectionName", "");
            this.model.setKey("connectionId", "");
            this.model.setKey("connectionType", "");
            this.model.setKey("selectConnection", "");

            this.model.setKey("dataChangeWrite", []);
            this.model.setKey("callMethod", []);

            if (this.dataChangeWriteGrid?.widget?.dataSource) {
                this.dataChangeWriteGrid.widget.dataSource.data([]);
            }
            if (this.callMethodGrid?.widget?.dataSource) {
                this.callMethodGrid.widget.dataSource.data([]);
            }

            if (this.addressSpaceBrowser?.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(null);
            }
        },

        _updateOperationUI: function () {
            var operation = this.$(".data-change-write-radio").is(":checked")
                ? Constants.DATA_CHANGE_WRITE
                : Constants.CALL_METHOD;

            this.model.setKey("operation", operation);

            if (operation === Constants.DATA_CHANGE_WRITE) {
                this.$(".data-change-write-container").show();
                this.$(".call-method-container").hide();

                DataChangeGridManager.renderDataChangeWriteComponent(this);
            } else {
                this.$(".data-change-write-container").hide();
                this.$(".call-method-container").show();

                CallMethodGridManager.renderCallMethodComponent(this);
            }
        },

        _onInputParameterBadgeClick: function (event) {
            CallMethodGridManager.onInputParameterBadgeClick(event, this);
        },

        getData: function () {
            var isDataChangeWrite = this.$(".data-change-write-radio").is(":checked");
            var operation = isDataChangeWrite ? Constants.DATA_CHANGE_WRITE : Constants.CALL_METHOD;

            this.model.setKey("operation", operation);

            this.model.setKey(
                "executionMode",
                this.$(".parallel-mode-radio").is(":checked")
                    ? Constants.PARALLEL
                    : Constants.SEQUENTIAL
            );

            if (isDataChangeWrite) {
                var dcData = [];
                if (this.dataChangeWriteGrid?.widget?.dataSource) {
                    dcData = this.dataChangeWriteGrid.widget.dataSource.data().toJSON();
                    _.each(dcData, function (item) {
                        if (item?.newValue && typeof item.newValue === "object") {
                            item.newValue = ExpressionBuilderUtility.getExpression(item.newValue);
                        }
                    });
                }
                this.model.setKey("dataChangeWrite", dcData);
                this.model.setKey("callMethod", []);
            } else {
                var cmData = [];
                if (this.callMethodGrid?.widget?.dataSource) {
                    cmData = this.callMethodGrid.widget.dataSource.data().toJSON();
                    _.each(cmData, function (item) {
                        if (item?.inputParameters?.length) {
                            _.each(item.inputParameters, function (param) {
                                if (param?.value && typeof param.value === "object") {
                                    param.value = ExpressionBuilderUtility.getExpression(param.value);
                                }
                            });
                        }
                    });
                }
                this.model.setKey("callMethod", cmData);
                this.model.setKey("dataChangeWrite", []);
            }

            if (this.deviceConnComp && typeof this.deviceConnComp.getData === "function") {
                var compData = this.deviceConnComp.getData();
                var connText = compData.connectionName || compData.connectionComboBox || "";
                var connId = compData.connectionId || "";
                this.model.setKey("connectionComboBox", connText);
                this.model.setKey("connectionName", connText);
                this.model.setKey("connectionId", connId);
                this.model.setKey("selectConnection", connText || connId);
            } else if (this.connectionComboBox) {
                var rawText = this.connectionComboBox.text();
                var connText = (rawText && rawText !== this.nls.SelectConnection) ? rawText : "";
                var connId = this.connectionComboBox.value() || "";

                this.model.setKey("connectionComboBox", connText);
                this.model.setKey("connectionName", connText);
                this.model.setKey("connectionId", connId);
                this.model.setKey("selectConnection", connText || connId);
            }

            return this.model.toJSON();
        },

        setData: function (obj) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    this.model.setKey(key, obj[key]);
                }
            }
            this.initialData = obj;

            if (this.deviceConnComp && typeof this.deviceConnComp.setData === "function") {
                this.deviceConnComp.setData(obj);
            }
        },

        _getGridRowAndCellByField: function (gridWidget, rowIndex, fieldName) {
            if (!gridWidget?.dataSource) {
                return null;
            }
            var colIndex = -1;
            var columns = gridWidget.columns || [];
            for (var c = 0; c < columns.length; c++) {
                if (columns[c].field === fieldName) {
                    colIndex = c;
                    break;
                }
            }
            if (colIndex === -1) {
                return null;
            }
            var pageSize = gridWidget.dataSource.pageSize() || 50;
            var pageNumber = Math.floor(rowIndex / pageSize) + 1;
            var pageRowIndex = rowIndex % pageSize;
            if (gridWidget.dataSource.page() !== pageNumber) {
                gridWidget.dataSource.page(pageNumber);
            }
            var tbody = gridWidget.tbody || gridWidget.element.find("tbody");
            var rows = tbody.find("tr");
            if (pageRowIndex < 0 || pageRowIndex >= rows.length) {
                return null;
            }
            var row = $(rows[pageRowIndex]);
            if (!row.length) {
                return null;
            }
            if (row[0]?.scrollIntoView) {
                row[0].scrollIntoView({ behavior: "smooth", block: "center" });
            }
            var cell = row.find("td:eq(" + colIndex + ")");
            if (!cell.length) {
                return null;
            }
            return { row: row, cell: cell };
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList?.length) {
                return;
            }

            errorObjectList.forEach(function (errorObject) {
                this._processErrorObject(errorObject);
            }, this);
        },

        _processErrorObject: function (errorObject) {
            if (!errorObject) {
                return;
            }

            var path = errorObject.path || errorObject.resource || "";
            if (!path) {
                return;
            }

            path = this._resolveErrorPath(errorObject, path);
            if (path === null) {
                return;
            }

            if (path.indexOf("connectionComboBox") !== -1 || path.indexOf("selectConnection") !== -1 || path.indexOf("connection") !== -1) {
                this._highlightConnectionError(errorObject);
                return;
            }

            if (path.indexOf("dataChangeWrite") !== -1) {
                this._highlightDataChangeWriteError(errorObject, path);
                return;
            }

            if (path.indexOf("callMethod") !== -1) {
                this._highlightCallMethodError(errorObject, path);
            }
        },

        _resolveErrorPath: function (errorObject, path) {
            var pathParts = path.split("/");
            if (pathParts.length <= 1) {
                return path;
            }

            var actPrefix = pathParts[0];

            if (actPrefix === "dataChangeWrite") {
                this._highlightDataChangeWriteGridCell(pathParts, errorObject);
            }
            if (actPrefix === "callMethod") {
                this._highlightCallMethodGridCell(pathParts, errorObject);
            }

            if (actPrefix === "InvokeOPCUA") {
                return pathParts.slice(1).join("/");
            }

            if (this._isPrefixForOtherActivity(actPrefix)) {
                return null;
            }

            return path;
        },

        _isPrefixForOtherActivity: function (actPrefix) {
            var currentActId = this.activityId || "";
            var currentActName = this.model?.getKey
                ? (this.model.getKey("activityName") || this.model.getKey("name") || "")
                : "";

            return !!(currentActId && actPrefix !== currentActId && currentActName && actPrefix !== currentActName);
        },

        _highlightDataChangeWriteGridCell: function (pathParts, errorObject) {
            var column = pathParts[2];
            var row = pathParts[1];
            var columnArr = this.dataChangeWriteGrid.widget.$el.find("." + column);
            var ele = $(columnArr[row - 1]);

            if (!ele.length) {
                return;
            }

            ele.get(0).scrollIntoView();
            ele.addErrorHighlightClass("components-error-red-highlight");
            this.showErrorTooltip(errorObject, ele);
        },

        _highlightCallMethodGridCell: function (pathParts, errorObject) {
            var column = pathParts[2];
            var row = pathParts[1];
            var columnArr = this.callMethodGrid.widget.$el.find("." + column);
            var ele = $(columnArr[row - 1]);

            if (!ele.length) {
                return;
            }

            ele.get(0).scrollIntoView();
            ele.addErrorHighlightClass("components-error-red-highlight");
            this.showErrorTooltip(errorObject, ele);
        },

        _highlightConnectionError: function (errorObject) {
            var element = this.$el.find("#connectionComboBox");
            if (!element.length) {
                return;
            }

            this.focusErrorComponent(element);

            var dropdownWrapper = element.parent().find(".ul-container, [class*='dropdown'], [class*='input']");
            var target = dropdownWrapper.length ? dropdownWrapper : element;
            target.addErrorHighlightClass("components-error-red-highlight");
            this.showErrorTooltip(errorObject, target);
        },

        _highlightDataChangeWriteError: function (errorObject, path) {
            this._ensureDataChangeWriteGridVisible();

            var rowInfo = this._extractGridRowInfo(path, "dataChangeWrite");
            if (!rowInfo) {
                this._highlightGridContainer(".cvt-grid-div-data-change-write", errorObject);
                return;
            }

            if (!this.dataChangeWriteGrid?.widget) {
                return;
            }

            var result = this._getGridRowAndCellByField(
                this.dataChangeWriteGrid.widget,
                rowInfo.rowIndex,
                rowInfo.fieldName
            );

            if (result?.cell) {
                result.cell.addErrorHighlightClass("components-error-red-highlight");
                this.showErrorTooltip(errorObject, result.cell);
            }
        },

        _ensureDataChangeWriteGridVisible: function () {
            if (!this.$(".data-change-write-radio").is(":checked")) {
                this.$(".data-change-write-radio").prop("checked", true);
                this._updateOperationUI();
            } else if (!this.dataChangeWriteGrid) {
                DataChangeGridManager.renderDataChangeWriteComponent(this);
            }
        },

        _highlightCallMethodError: function (errorObject, path) {
            this._ensureCallMethodGridVisible();

            var rowInfo = this._extractGridRowInfo(path, "callMethod");
            if (!rowInfo) {
                this._highlightGridContainer(".cvt-grid-div-call-method", errorObject);
                return;
            }

            var gridWidget = this.callMethodGrid?.widget;
            if (!gridWidget) {
                return;
            }

            if (rowInfo.fieldName === "inputParameters") {
                this._highlightCallMethodInputParameters(gridWidget, rowInfo.rowIndex, errorObject);
                return;
            }

            var result = this._getGridRowAndCellByField(gridWidget, rowInfo.rowIndex, rowInfo.fieldName);
            if (result?.cell) {
                result.cell.addErrorHighlightClass("components-error-red-highlight");
                this.showErrorTooltip(errorObject, result.cell);
            }
        },

        _ensureCallMethodGridVisible: function () {
            if (!this.$(".call-method-radio").is(":checked")) {
                this.$(".call-method-radio").prop("checked", true);
                this._updateOperationUI();
            } else if (!this.callMethodGrid) {
                CallMethodGridManager.renderCallMethodComponent(this);
            }
        },

        _highlightCallMethodInputParameters: function (gridWidget, rowIndex, errorObject) {
            var result = this._getGridRowAndCellByField(gridWidget, rowIndex, "inputParameters");
            if (!result?.row) {
                return;
            }

            var dataItem = gridWidget.dataItem(result.row);
            if (!dataItem) {
                return;
            }

            result.cell.addErrorHighlightClass("components-error-red-highlight");
            this.showErrorTooltip(errorObject, result.cell);
        },

        _extractGridRowInfo: function (path, sectionKey) {
            var parts = path.split("/");
            var rowPartIndex = -1;

            for (var i = 0; i < parts.length; i++) {
                if (parts[i] === sectionKey) {
                    rowPartIndex = i + 1;
                    break;
                }
            }

            if (rowPartIndex === -1 || rowPartIndex >= parts.length || isNaN(parseInt(parts[rowPartIndex], 10))) {
                return null;
            }

            return {
                rowIndex: parseInt(parts[rowPartIndex], 10) - 1,
                fieldName: parts[rowPartIndex + 1] || "name"
            };
        },

        _highlightGridContainer: function (selector, errorObject) {
            var gridElem = this.$el.find(selector);
            if (gridElem.length) {
                gridElem.addErrorHighlightClass("components-error-red-highlight");
                this.showErrorTooltip(errorObject, gridElem);
            }
        },

        getErrorMessage: function () {
            return "";
        },

        _destroyComponent: function (component) {
            if (component?.destroy) {
                component.destroy();
            }
        },

        onBeforeDestroy: function () {
            $(window).off("resize.invokeopcua");
            this.$el.off("click.invokeopcuaDrawer");
            if (this._drawerObserver) {
                this._drawerObserver.disconnect();
                this._drawerObserver = null;
            }

            CallMethodGridManager._destroyInputParametersModal(this);

            this._destroyComponent(this.dataChangeWriteSearchBar);
            this.dataChangeWriteSearchBar = null;

            this._destroyComponent(this.callMethodSearchBar);
            this.callMethodSearchBar = null;

            this._destroyComponent(this.dataChangeWriteGrid);
            this.dataChangeWriteGrid = null;

            this._destroyComponent(this.callMethodGrid);
            this.callMethodGrid = null;

            if (this.addressSpaceBrowser) {
                this.addressSpaceBrowser.onDestroy();
                this.addressSpaceBrowser = null;
            }

            this.addressSpaceDrawer?.destroy();
            this.addressSpaceDrawer = null;

            if (this.deviceConnComp && typeof this.deviceConnComp.destroy === "function") {
                this.deviceConnComp.destroy();
                this.deviceConnComp = null;
            }

            this.selectedCallMethodRow = null;
        }
    });

    return InvokeOPCUAUIComponent;
});