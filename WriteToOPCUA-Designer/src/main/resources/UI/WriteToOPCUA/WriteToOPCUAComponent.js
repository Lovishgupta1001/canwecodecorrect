/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        template = require("tpl!./template/WriteToOPCUAComponentTemplate"),
        model = require("./model/WriteToOPCUAComponentModel"),
        nls = require("i18n!./nls/WriteToOPCUAComponentNLS"),
        Constants = require("./js/constants"),
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
                var selectedRow = grid.select();
                if (selectedRow?.length) {
                    grid.removeRow(selectedRow);
                } else {
                    var lastRow = grid.tbody.find("tr:last");
                    if (lastRow.length) {
                        grid.removeRow(lastRow);
                    }
                }
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
            this.model.setKey(
                "operation",
                this.$(".data-change-write-radio").is(":checked")
                    ? Constants.DATA_CHANGE_WRITE
                    : Constants.CALL_METHOD
            );

            this.model.setKey(
                "executionMode",
                this.$(".parallel-mode-radio").is(":checked")
                    ? Constants.PARALLEL
                    : Constants.SEQUENTIAL
            );

            if (this.dataChangeWriteGrid?.widget?.dataSource) {
                this.model.setKey(
                    "dataChangeWrite",
                    this.dataChangeWriteGrid.widget.dataSource.data().toJSON()
                );
            }

            if (this.callMethodGrid?.widget?.dataSource) {
                this.model.setKey(
                    "callMethod",
                    this.callMethodGrid.widget.dataSource.data().toJSON()
                );
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
            var globalSelf = this;

            if (!errorObjectList?.length) {
                return;
            }

            var currentActId = globalSelf.activityId || "";
            var currentActName = globalSelf.model?.getKey
                ? (globalSelf.model.getKey("activityName") || globalSelf.model.getKey("name") || "")
                : "";

            errorObjectList.forEach(function (errorObject) {
                if (!errorObject) {
                    return;
                }

                var path = errorObject.path || errorObject.resource || "";
                if (!path) {
                    return;
                }

                var pathParts = path.split("/");
                if (pathParts.length > 1) {
                    var actPrefix = pathParts[0];
                    if (actPrefix === "WriteToOPCUA") {
                        path = pathParts.slice(1).join("/");
                    } else if (currentActId && actPrefix !== currentActId && currentActName && actPrefix !== currentActName) {
                        return;
                    }
                }

                // 1. Transport Dropdown Validation Error
                if (path.indexOf("transportName") !== -1) {
                    var element = globalSelf.$el.find("#transport-selector-dropdown");
                    if (!element.length) {
                        element = globalSelf.$el.find(".transport-selector-dropdown");
                    }

                    if (element.length) {
                        globalSelf.focusErrorComponent(element);

                        var dropdownWrapper = element.closest(".k-widget");
                        var target = dropdownWrapper.length ? dropdownWrapper : element;
                        target.addErrorHighlightClass("components-error-red-highlight");

                        globalSelf.showErrorTooltip(errorObject, target);
                    }
                    return;
                }

                // 2. Data Change Write Grid Validation Errors
                if (path.indexOf("dataChangeWrite") !== -1) {
                    if (!globalSelf.$(".data-change-write-radio").is(":checked")) {
                        globalSelf.$(".data-change-write-radio").prop("checked", true);
                        globalSelf._updateOperationUI();
                    } else if (!globalSelf.dataChangeWriteGrid) {
                        DataChangeGridManager.renderDataChangeWriteComponent(globalSelf);
                    }

                    var dcParts = path.split("/");
                    var dcRowPartIndex = -1;

                    for (var i = 0; i < dcParts.length; i++) {
                        if (dcParts[i] === "dataChangeWrite") {
                            dcRowPartIndex = i + 1;
                            break;
                        }
                    }

                    if (dcRowPartIndex === -1 || dcRowPartIndex >= dcParts.length || isNaN(parseInt(dcParts[dcRowPartIndex], 10))) {
                        var gridElem = globalSelf.$el.find(".cvt-grid-div-data-change-write");
                        if (gridElem.length) {
                            gridElem.addErrorHighlightClass("components-error-red-highlight");
                            globalSelf.showErrorTooltip(errorObject, gridElem);
                        }
                        return;
                    }

                    var dcRowIndex = parseInt(dcParts[dcRowPartIndex], 10) - 1;
                    var dcFieldName = dcParts[dcRowPartIndex + 1] || "name";

                    if (globalSelf.dataChangeWriteGrid?.widget) {
                        var dcResult = globalSelf._getGridRowAndCellByField(
                            globalSelf.dataChangeWriteGrid.widget,
                            dcRowIndex,
                            dcFieldName
                        );
                        if (dcResult?.cell) {
                            dcResult.cell.addErrorHighlightClass("components-error-red-highlight");
                            globalSelf.showErrorTooltip(errorObject, dcResult.cell);
                        }
                    }
                    return;
                }

                // 3. Method Call Grid Validation Errors
                if (path.indexOf("callMethod") !== -1) {
                    if (!globalSelf.$(".call-method-radio").is(":checked")) {
                        globalSelf.$(".call-method-radio").prop("checked", true);
                        globalSelf._updateOperationUI();
                    } else if (!globalSelf.callMethodGrid) {
                        CallMethodGridManager.renderCallMethodComponent(globalSelf);
                    }

                    var cmParts = path.split("/");
                    var cmRowPartIndex = -1;

                    for (var j = 0; j < cmParts.length; j++) {
                        if (cmParts[j] === "callMethod") {
                            cmRowPartIndex = j + 1;
                            break;
                        }
                    }

                    if (cmRowPartIndex === -1 || cmRowPartIndex >= cmParts.length || isNaN(parseInt(cmParts[cmRowPartIndex], 10))) {
                        var cmGridElem = globalSelf.$el.find(".cvt-grid-div-call-method");
                        if (cmGridElem.length) {
                            cmGridElem.addErrorHighlightClass("components-error-red-highlight");
                            globalSelf.showErrorTooltip(errorObject, cmGridElem);
                        }
                        return;
                    }

                    var cmRowIndex = parseInt(cmParts[cmRowPartIndex], 10) - 1;
                    var cmFieldName = cmParts[cmRowPartIndex + 1] || "name";

                    if (globalSelf.callMethodGrid?.widget) {
                        var cmGridWidget = globalSelf.callMethodGrid.widget;

                        if (cmFieldName === "inputParameters") {
                            var cmParamResult = globalSelf._getGridRowAndCellByField(cmGridWidget, cmRowIndex, "inputParameters");

                            if (cmParamResult?.row) {
                                var cmDataItem = cmGridWidget.dataItem(cmParamResult.row);
                                if (cmDataItem) {
                                    cmParamResult.cell.addErrorHighlightClass("components-error-red-highlight");
                                    globalSelf.showErrorTooltip(errorObject, cmParamResult.cell);
                                }
                            }
                        } else {
                            var cmResult = globalSelf._getGridRowAndCellByField(
                                cmGridWidget,
                                cmRowIndex,
                                cmFieldName
                            );
                            if (cmResult?.cell) {
                                cmResult.cell.addErrorHighlightClass("components-error-red-highlight");
                                globalSelf.showErrorTooltip(errorObject, cmResult.cell);
                            }
                        }
                    }
                }
            });
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