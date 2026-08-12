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
        CallMethodGridManager = require("./js/CallMethodGridManager"),
        ExpressionBuilderManager = require("./js/ExpressionBuilderManager");

    var WriteToOPCUAUIComponent = MIUIComponentI.extend({

        model: model,
        template: template,
        nls: nls,

        events: {
            "click .writetoopcua-delete-row": "_onDeleteGridRow",
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

            // ─── SAMPLE DATA — comment this block out when API is ready ──────────

            // Dropdown option lists (what appears inside each row's picker)
            this.dataChangeOptions = [
                {
                    dataChangeName: "Temperature Sensor",
                    nodeId: "ns=2;i=1001",
                    sampleValue: "25.6"
                },
                {
                    dataChangeName: "Pressure Gauge",
                    nodeId: "ns=2;i=1002",
                    sampleValue: "101.3"
                },
                {
                    dataChangeName: "Flow Rate",
                    nodeId: "ns=2;i=1003",
                    sampleValue: "15.0"
                }
            ];

            this.callMethodOptions = [
                {
                    methodName: "StartProcess",
                    nodeId: "ns=2;i=2001",
                    inputParameters: [
                        { name: "Speed", dataType: "Int32", value: "" },
                        { name: "Direction", dataType: "String", value: "" }
                    ]
                },
                {
                    methodName: "StopProcess",
                    nodeId: "ns=2;i=2002",
                    inputParameters: [
                        { name: "EmergencyStop", dataType: "Boolean", value: "" }
                    ]
                },
                {
                    methodName: "ResetCounter",
                    nodeId: "ns=2;i=2003",
                    inputParameters: []
                }
            ];

            // Pre-populate grid rows so data is visible when radio is selected.
            // Guard: only set sample rows when there is no previously saved data.
            if (!this.model.getKey("dataChangeWrite") ||
                this.model.getKey("dataChangeWrite").length === 0) {
                this.model.setKey("dataChangeWrite", [
                    {
                        dataChangeName: "Temperature Sensor",
                        nodeId: "ns=2;i=1001",
                        sampleValue: "25.6",
                        newValue: ""
                    },
                    {
                        dataChangeName: "Pressure Gauge",
                        nodeId: "ns=2;i=1002",
                        sampleValue: "101.3",
                        newValue: ""
                    },
                    {
                        dataChangeName: "Flow Rate",
                        nodeId: "ns=2;i=1003",
                        sampleValue: "15.0",
                        newValue: ""
                    }
                ]);
            }

            if (!this.model.getKey("callMethod") ||
                this.model.getKey("callMethod").length === 0) {
                this.model.setKey("callMethod", [
                    {
                        methodName: "StartProcess",
                        nodeId: "ns=2;i=2001",
                        inputParameters: [
                            { name: "Speed", dataType: "Int32", value: "" },
                            { name: "Direction", dataType: "String", value: "" }
                        ],
                        outputValue: ""
                    },
                    {
                        methodName: "StopProcess",
                        nodeId: "ns=2;i=2002",
                        inputParameters: [
                            { name: "EmergencyStop", dataType: "Boolean", value: "" }
                        ],
                        outputValue: ""
                    },
                    {
                        methodName: "ResetCounter",
                        nodeId: "ns=2;i=2003",
                        inputParameters: [],
                        outputValue: ""
                    }
                ]);
            }

            // ─── END SAMPLE DATA ─────────────────────────────────────────────────

            // ─── API CALL — uncomment this block when API is ready ───────────────
            // var self = this;
            // this.dataChangeOptions = [];
            // this.callMethodOptions = [];
            // this.model.setKey("dataChangeWrite", []);
            // this.model.setKey("callMethod", []);
            // AjaxUtility.ajaxCall({
            //     url: "/api/dataChangeOptions?transportId=" + this.model.getKey("transportId"),
            //     method: "GET"
            // }).then(function (response) {
            //     self.dataChangeOptions = response;
            //     // Map response to grid rows:
            //     self.model.setKey("dataChangeWrite", response.map(function (item) {
            //         return { dataChangeName: item.dataChangeName, nodeId: item.nodeId,
            //                  sampleValue: item.sampleValue, newValue: "" };
            //     }));
            // });
            // AjaxUtility.ajaxCall({
            //     url: "/api/callMethodOptions?transportId=" + this.model.getKey("transportId"),
            //     method: "GET"
            // }).then(function (response) {
            //     self.callMethodOptions = response;
            //     // Map response to grid rows:
            //     self.model.setKey("callMethod", response.map(function (item) {
            //         return { methodName: item.methodName, nodeId: item.nodeId,
            //                  inputParameters: item.inputParameters, outputValue: "" };
            //     }));
            // });
            // ─── END API CALL ────────────────────────────────────────────────────
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

            deferred.resolve();

            return deferred.promise();
        },

        _initializeControls: function () {
            this.$(".data-change-write-container").hide();
            this.$(".call-method-container").hide();
            this.$("#transport-name-expression-region").hide();
        },

        _onDeleteGridRow: function (event) {
            var row = $(event.currentTarget).closest("tr");
            var gridElement = $(event.currentTarget).closest(".k-grid");
            var grid = gridElement.data("kendoGrid");

            if (grid && row.length) {
                grid.removeRow(row);
            }
        },

        _onAddDataChangeRow: function () {
            if (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget) {
                this.dataChangeWriteGrid.widget.addRow();
            }
        },

        _onAddCallMethodRow: function () {
            if (this.callMethodGrid && this.callMethodGrid.widget) {
                this.callMethodGrid.widget.addRow();
            }
        },

        _initTransportUI: function () {
            TransportManager.updateTransportUI(this);
        },

        _updateTransportUI: function () {
            var isDynamicTransport = this.$(".transport-name-variable-checkbox").is(":checked");

            // Update model FIRST — grid managers read this when rebuilding columns
            this.model.setKey("dynamicTransport", isDynamicTransport);

            TransportManager.updateTransportUI(this);
            DataChangeGridManager.refreshGridMode(this, isDynamicTransport);
            CallMethodGridManager.refreshGridMode(this, isDynamicTransport);
        },


        _updateOperationUI: function () {
            var operation = this.$(".data-change-write-radio").is(":checked")
                ? Constants.DATA_CHANGE_WRITE
                : Constants.CALL_METHOD;

            this.model.setKey("operation", operation);

            if (operation === Constants.DATA_CHANGE_WRITE) {
                this.$(".data-change-write-container").show();
                this.$(".call-method-container").hide();

                // ─── SAMPLE DATA FALLBACK — remove this block when API is ready ──
                if (!this.model.getKey("dataChangeWrite") ||
                    this.model.getKey("dataChangeWrite").length === 0) {
                    this.model.setKey("dataChangeWrite", [
                        { dataChangeName: "Temperature Sensor", nodeId: "ns=2;i=1001", sampleValue: "25.6", newValue: "" },
                        { dataChangeName: "Pressure Gauge",     nodeId: "ns=2;i=1002", sampleValue: "101.3", newValue: "" },
                        { dataChangeName: "Flow Rate",          nodeId: "ns=2;i=1003", sampleValue: "15.0", newValue: "" }
                    ]);
                }
                // ─── END SAMPLE DATA FALLBACK ─────────────────────────────────────

                DataChangeGridManager.renderDataChangeWriteComponent(this);
            } else {
                this.$(".data-change-write-container").hide();
                this.$(".call-method-container").show();

                // ─── SAMPLE DATA FALLBACK — remove this block when API is ready ──
                if (!this.model.getKey("callMethod") ||
                    this.model.getKey("callMethod").length === 0) {
                    this.model.setKey("callMethod", [
                        {
                            methodName: "StartProcess", nodeId: "ns=2;i=2001",
                            inputParameters: [
                                { name: "Speed", dataType: "Int32", value: "" },
                                { name: "Direction", dataType: "String", value: "" }
                            ],
                            outputValue: ""
                        },
                        {
                            methodName: "StopProcess", nodeId: "ns=2;i=2002",
                            inputParameters: [
                                { name: "EmergencyStop", dataType: "Boolean", value: "" }
                            ],
                            outputValue: ""
                        },
                        {
                            methodName: "ResetCounter", nodeId: "ns=2;i=2003",
                            inputParameters: [], outputValue: ""
                        }
                    ]);
                }
                // ─── END SAMPLE DATA FALLBACK ─────────────────────────────────────

                CallMethodGridManager.renderCallMethodComponent(this);
            }
        },


        _onInputParameterBadgeClick: function (event) {
            CallMethodGridManager.onInputParameterBadgeClick(event, this);
        },

        /*
         * TODO [API]: _fetchOptions
         * ─────────────────────────────────────────────────────────────────────
         * Implement this method to load dataChangeOptions and callMethodOptions
         * from the server once a transport is selected.
         *
         * Suggested call site:
         *   - After transport dropdown `change` fires (TransportManager),
         *     retrieve options filtered by the selected transportId.
         *
         * Expected API contracts:
         *   GET /api/dataChangeOptions?transportId={id}
         *     Response: [ { dataChangeName, nodeId, sampleValue }, ... ]
         *
         *   GET /api/callMethodOptions?transportId={id}
         *     Response: [ { methodName, nodeId, inputParameters: [ { name, dataType, value } ] }, ... ]
         *
         * After the call resolves:
         *   1. Set this.dataChangeOptions = <response>;
         *   2. Set this.callMethodOptions = <response>;
         *   3. If the grid is already rendered, rebuild its dropdown DataSources:
         *      DataChangeGridManager.refreshGridMode(this, isDynamicTransport);
         *      CallMethodGridManager.refreshGridMode(this, isDynamicTransport);
         *
         * _fetchOptions: function (transportId) {
         *     var self = this;
         *     return AjaxUtility.ajaxCall({
         *         url: "/api/dataChangeOptions?transportId=" + transportId,
         *         method: "GET"
         *     }).then(function (dataChangeResponse) {
         *         self.dataChangeOptions = dataChangeResponse;
         *         return AjaxUtility.ajaxCall({
         *             url: "/api/callMethodOptions?transportId=" + transportId,
         *             method: "GET"
         *         });
         *     }).then(function (callMethodResponse) {
         *         self.callMethodOptions = callMethodResponse;
         *     });
         * }
         */

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
            if (component && component.destroy) {
                component.destroy();
            }
        },

        onBeforeDestroy: function () {
            var globalSelf = this;

            ExpressionBuilderManager.destroy(this.transportExpressionBuilder);

            CallMethodGridManager._destroyInputParametersModal(this);

            if (this.methodNameDropdowns) {
                this.methodNameDropdowns.forEach(function (dropdown) {
                    globalSelf._destroyComponent(dropdown);
                });
                this.methodNameDropdowns = null;
            }

            if (this.dataChangeNameDropdowns) {
                this.dataChangeNameDropdowns.forEach(function (dropdown) {
                    globalSelf._destroyComponent(dropdown);
                });
                this.dataChangeNameDropdowns = null;
            }

            this._destroyComponent(this.transportNameAsVariable);
            this._destroyComponent(this.dataChangeWriteSearchBar);
            this._destroyComponent(this.callMethodSearchBar);
            this._destroyComponent(this.dataChangeWriteGrid);
            this._destroyComponent(this.callMethodGrid);
            this._destroyComponent(this.transportDropdown);
            this._destroyComponent(this.refreshButton);
            this._destroyComponent(this.createButton);
            this._destroyComponent(this.openButton);

            this.transportNameAsVariable = null;
            this.dataChangeWriteSearchBar = null;
            this.callMethodSearchBar = null;
            this.refreshButton = null;
            this.createButton = null;
            this.openButton = null;
            this.transportDropdown = null;
            this.transportExpressionBuilder = null;
            this.dataChangeWriteGrid = null;
            this.callMethodGrid = null;
            this.selectedCallMethodRow = null;
        }
    });

    return WriteToOPCUAUIComponent;
});
