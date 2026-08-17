/**
 * Created by Lovish.
 */
define(function (require) {

    var uilayer = require("uilayer"),
        template = require("tpl!./template/WriteToOPCUAComponentTemplate"),
        model = require("./model/WriteToOPCUAComponentModel"),
        nls = require("i18n!./nls/WriteToOPCUAComponentNLS"),
        Constants = require("./js/constants"),
        GridUtils = require("./js/GridUtils"),
        TransportManager = require("./js/TransportManager"),
        DataChangeGridManager = require("./js/DataChangeGridManager"),
        CallMethodGridManager = require("./js/CallMethodGridManager"),
        ExpressionBuilderManager = require("./js/ExpressionBuilderManager");

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
            "change .transport-name-variable-checkbox": "_updateTransportUI",
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
            var deferred = $.Deferred();

            this.transportNameAsVariable = uilayer.checkbox({
                elem: this.$el.find(".transport-name-variable-checkbox")
            });

            this.$("#transport-name-expression-region").attr("name", Constants.TRANSPORT_NAME);

            this._initializeControls();

            this.$(".transport-name-variable-checkbox").prop(
                "checked",
                this.model.getKey("dynamicTransport")
            );

            var operationGroupName = "operation-" + this.activityId;
            var executionModeGroupName = "execution-mode-" + this.activityId;

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
            this._renderHelpTooltips();

            deferred.resolve();

            return deferred.promise();
        },

        _renderHelpTooltips: function () {
            GridUtils.initializeHelpTooltip(this, "parallel-mode-help");
            GridUtils.initializeHelpTooltip(this, "sequential-mode-help");
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
                if (selectedRow && selectedRow.length) {
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
            if (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget) {
                this.dataChangeWriteGrid.widget.addRow();
                // dataBound does NOT fire for addRow() — initialize the new row's
                // dropdown explicitly so it is not left as a blank placeholder.
                DataChangeGridManager._initializeDataChangeDropdowns(
                    this,
                    this.dataChangeWriteGrid.widget
                );
            }
        },

        _onAddCallMethodRow: function () {
            if (this.callMethodGrid && this.callMethodGrid.widget) {
                this.callMethodGrid.widget.addRow();
                // dataBound does NOT fire for addRow() — initialize the new row's
                // dropdown explicitly so it is not left as a blank placeholder.
                CallMethodGridManager._initializeMethodDropdowns(this);
            }
        },

        _initTransportUI: function () {
            TransportManager.updateTransportUI(this);
        },

        _updateTransportUI: function () {
            var isDynamicTransport = this.$(".transport-name-variable-checkbox").is(":checked");

            // Update model FIRST — grid managers read this when rebuilding columns
            this.model.setKey("dynamicTransport", isDynamicTransport);

            // Clear transport name on every mode switch so the expression editor
            // starts empty and the dropdown resets to the optionLabel placeholder.
            this.model.setKey("transportName", "");

            // Destroy the dropdown so renderTransportDropdown recreates it fresh
            // at the optionLabel (placeholder) state when switching back to static.
            if (this.transportDropdown) {
                this._destroyComponent(this.transportDropdown);
                this.transportDropdown = null;
                this.$(".transport-selector-dropdown").empty();
            }

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
                "dynamicTransport",
                this.$(".transport-name-variable-checkbox").is(":checked")
            );

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

            if (this.dataChangeWriteGrid &&
                this.dataChangeWriteGrid.widget &&
                this.dataChangeWriteGrid.widget.dataSource) {
                this.model.setKey(
                    "dataChangeWrite",
                    this.dataChangeWriteGrid.widget.dataSource.data().toJSON()
                );
            }

            if (this.callMethodGrid &&
                this.callMethodGrid.widget &&
                this.callMethodGrid.widget.dataSource) {
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

        highlightErrors: function (errorObjectList) {
            var globalSelf = this;

            errorObjectList.forEach(function (errorObject) {
                var element = globalSelf.$el.find("#" + errorObject.path);

                if (element.length) {
                    globalSelf.focusErrorComponent(element);

                    if (!element.is(":visible") &&
                        globalSelf.$el.find("#" + errorObject.path + "_wrapper").length) {
                        element = globalSelf.$el.find("#" + errorObject.path + "_wrapper");
                    }

                    element.addErrorHighlightClass(
                        "components-error-red-highlight"
                    );

                    globalSelf.showErrorTooltip(
                        errorObject,
                        element
                    );
                }
            });
        },

        getErrorMessage: function () {
            return "";
        },

        _destroyComponent: function (component) {
            if (!component || typeof component.destroy !== "function") {
                return;
            }

            try {
                component.destroy();
            } catch (error) {
                console.warn("WriteToOPCUA component cleanup failed:", error);
            }
        },

        onBeforeDestroy: function () {
            ExpressionBuilderManager.destroy(this.transportExpressionBuilder);
            this.transportExpressionBuilder = null;

            CallMethodGridManager._destroyInputParametersModal(this);

            this._destroyComponent(this.transportNameAsVariable);
            this.transportNameAsVariable = null;

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
    