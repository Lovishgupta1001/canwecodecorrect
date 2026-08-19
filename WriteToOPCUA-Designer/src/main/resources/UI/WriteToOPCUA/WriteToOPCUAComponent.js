/**
 * Created by Lovish.
 */
define(function (require) {

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

            deferred.resolve();

            return deferred.promise();
        },

        _renderHelp: function () {
            if (typeof uilayer !== "undefined" && typeof uilayer.help === "function") {
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
                    dataChangeName: "",
                    nodeId: "",
                    sampleValue: "",
                    newValue: ""
                });
            }
        },

        _onAddCallMethodRow: function () {
            if (this.callMethodGrid?.widget?.dataSource) {
                this.callMethodGrid.widget.dataSource.add({
                    methodName: "",
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
            if (component && component.destroy) {
                component.destroy();
            }
        },

        onBeforeDestroy: function () {
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