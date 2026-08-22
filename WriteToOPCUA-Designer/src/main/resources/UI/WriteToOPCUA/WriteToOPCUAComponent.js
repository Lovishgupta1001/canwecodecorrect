/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        template = require("tpl!./template/WriteToOPCUAComponentTemplate"),
        model = require("./model/WriteToOPCUAComponentModel"),
        nls = require("i18n!./nls/WriteToOPCUAComponentNLS"),
        Constants = require("./js/constants"),
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        TransportManager = require("./js/TransportManager"),
        DataChangeGridManager = require("./js/DataChangeGridManager"),
        CallMethodGridManager = require("./js/CallMethodGridManager");

    var WriteToOPCUAUIComponent = MIUIComponentI.extend({

        model: model,
        template: template,
        nls: nls,

        events: {
            "click .writetoopcua-delete-row": "_onDeleteGridRow",
            "click .writetoopcua-grid-delete-btn": "_onDeleteToolbarRow",
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

            this.dataChangeOptions = [];
            this.callMethodOptions = [];

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

            this._initTransportUI();
            this._updateOperationUI();
            this._renderHelp();

            $(window).off("resize.writetoopcua").on("resize.writetoopcua", function () {
                if (globalSelf.dataChangeWriteGrid?.widget) {
                    globalSelf.dataChangeWriteGrid.widget.resize();
                }
                if (globalSelf.callMethodGrid?.widget) {
                    globalSelf.callMethodGrid.widget.resize();
                }
            });

            deferred.resolve();

            return deferred.promise();
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
            this.$("#transport-name-expression-region").hide();
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
                var checked = tbody.find("input:checked, .k-checkbox:checked");
                if (checked.length) {
                    return checked.closest("tr");
                }
            }

            return $();
        },

        _collectRowsToDelete: function (grid) {
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
            var lastRow = (grid.tbody || grid.element?.find("tbody"))?.find("tr:last");
            return lastRow?.length ? [lastRow[0]] : [];
        },

        _deleteGridRows: function (grid, rowElements) {
            var dataItems = _.compact(_.uniq(rowElements.map(function (elem) {
                return grid.dataItem ? grid.dataItem(elem) : null;
            })));

            if (dataItems.length && grid.dataSource) {
                dataItems.forEach(function (item) {
                    grid.dataSource.remove(item);
                });
            } else {
                rowElements.forEach(function (elem) {
                    grid.removeRow?.($(elem));
                });
            }

            if (this.$(".data-change-write-radio").is(":checked")) {
                DataChangeGridManager.refreshDropdownOptions(this);
            } else {
                CallMethodGridManager.refreshDropdownOptions(this);
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
                this.callMethodGrid.widget.dataSource.add({
                    name: "",
                    nodeId: "",
                    objectNodeId: "",
                    inputParameters: [],
                    outputValue: ""
                });
            }
        },

        _initTransportUI: function () {
            TransportManager.updateTransportUI(this);
        },

        _updateTransportUI: function () {
            TransportManager.updateTransportUI(this);
            DataChangeGridManager.refreshGridMode(this);
            CallMethodGridManager.refreshGridMode(this);
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

            return this.model.toJSON();
        },

        setData: function (obj) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    this.model.setKey(key, obj[key]);
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

            if (path.indexOf("transportName") !== -1) {
                this._highlightTransportError(errorObject);
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

            if (actPrefix === "WriteToOPCUA") {
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

        _highlightTransportError: function (errorObject) {
            var element = this.$el.find("#transport-selector-dropdown");
            if (!element.length) {
                element = this.$el.find(".transport-selector-dropdown");
            }
            if (!element.length) {
                return;
            }

            this.focusErrorComponent(element);

            var dropdownWrapper = element.closest(".k-widget");
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
            $(window).off("resize.writetoopcua");

            CallMethodGridManager._destroyInputParametersModal(this);

            this._destroyComponent(this.dataChangeWriteSearchBar);
            this.dataChangeWriteSearchBar = null;

            this._destroyComponent(this.callMethodSearchBar);
            this.callMethodSearchBar = null;

            this._destroyComponent(this.dataChangeWriteGrid);
            this.dataChangeWriteGrid = null;

            this._destroyComponent(this.callMethodGrid);
            this.callMethodGrid = null;

            this._destroyComponent(this.transportDropdown);
            this.transportDropdown = null;

            this._destroyComponent(this.refreshButton);
            this.refreshButton = null;

            this._destroyComponent(this.createButton);
            this.createButton = null;

            this._destroyComponent(this.openButton);
            this.openButton = null;

            this.selectedCallMethodRow = null;
        }
    });

    return WriteToOPCUAUIComponent;
});