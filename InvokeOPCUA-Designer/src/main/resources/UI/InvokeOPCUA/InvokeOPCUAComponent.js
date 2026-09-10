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
        ConnectionManager = require("./js/ConnectionManager"),
        DataChangeGridManager = require("./js/DataChangeGridManager"),
        CallMethodGridManager = require("./js/CallMethodGridManager"),
        AddressSpaceBrowser = require("./js/AddressSpaceBrowser");

    var InvokeOPCUAUIComponent = MIUIComponentI.extend({

        model: model,
        template: template,
        nls: nls,

        events: {
            "click #refresh-connection-button": "_onRefreshConnection",
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
            this.processModel = this.designerReqres.request("getCurrentActiveEntityModelFromDataStore");

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
            var connId = this.connectionComboBox ? this.connectionComboBox.value() : this.model.getKey("connectionId");
            var connText = this.connectionComboBox ? this.connectionComboBox.text() : this.model.getKey("connectionName");
            var connType = this.model.getKey("connectionType") || "OPCUA";
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

        _initConnectionUI: function () {
            ConnectionManager.renderConnectionDropdown(this);
        },

        _onRefreshConnection: function () {
            ConnectionManager.refreshConnection(this);
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

            var connText = "";
            if (this.connectionComboBox) {
                var rawText = this.connectionComboBox.text();
                if (rawText && rawText !== this.nls.SelectConnection) {
                    connText = rawText;
                }
            }

            var connId = this.connectionComboBox ? this.connectionComboBox.value() : "";

            this.model.setKey("connectionComboBox", connText);
            this.model.setKey("connectionName", connText);
            this.model.setKey("connectionId", connId);
            this.model.setKey("selectConnection", connText || connId);

            return this.model.toJSON();
        },

        setData: function (obj) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    this.model.setKey(key, obj[key]);
                }
            }
            this.initialData = obj;

            var connVal = obj?.connectionComboBox || obj?.selectConnection || obj?.connectionName;
            if (connVal && this.connectionComboBox) {
                this.connectionComboBox.text(connVal);
                var currentVal = this.connectionComboBox.value();
                if (currentVal) {
                    ConnectionManager._validateAndHandleConnection(currentVal, this, true);
                }
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

            ConnectionManager.onDestroy(this);

            this.selectedCallMethodRow = null;
        }
    });

    return InvokeOPCUAUIComponent;
});