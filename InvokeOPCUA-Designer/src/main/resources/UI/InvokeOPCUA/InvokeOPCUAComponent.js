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
        constants = require("./js/constants"),
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        DataChangeGridManager = require("./js/DataChangeGridManager"),
        CallMethodGridManager = require("./js/CallMethodGridManager"),
        AddressSpaceBrowser = require("./js/AddressSpaceBrowser");

    var InvokeOPCUAComponent = MIUIComponentI.extend({
        name: "InvokeOPCUA",
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
            this.activityReqres = new Backbone.Wreqr.RequestResponse();
            this.processModel = this.designerReqres.request("getCurrentActiveEntityModelFromDataStore");
            this._setInvokeOPCUAHandlers();
            this._subscribeToEvents();
        },

        onRender: function () {
            this._initializeControls();
            this._setOperationAndModeRadios();
            this._renderDrawer();
            this._initAddressSpaceBrowser();
            let promise = this._renderConnectionComponent();
            this._updateOperationUI();
            this._renderHelp();

            return promise;
        },

        _renderConnectionComponent: function () {
            var globalSelf = this, connData = null;

            if (this.initialData && this.initialData["selectConnection"] != undefined) {
                connData = {};
                connData["connectionComboBox"] = this.initialData["selectConnection"];
            } else if (this.initialData && this.initialData["connectionComboBox"] != undefined) {
                connData = {};
                connData["connectionComboBox"] = this.initialData["connectionComboBox"];
            }

            var deviceConnPromise = MIUIComponent.DeviceConnectorConnComponent({
                el: globalSelf.$el.find("#invokeopcua-connection-component-container"),
                activityId: globalSelf.activityId,
                reqres: globalSelf.designerReqres,
                activityReqres: globalSelf.activityReqres,
                allowedConnectionTypes: ["OPCUA"],
                data: connData
            });

            deviceConnPromise.done(function (comp) {
                globalSelf.deviceConnComp = comp;

                globalSelf.listenTo(
                    globalSelf.deviceConnComp,
                    constants.EVENTS.CHANGE_CONNECTION_VARIABLE,
                    globalSelf._onConnectionChanged.bind(globalSelf)
                );

                globalSelf.listenTo(
                    globalSelf.deviceConnComp,
                    constants.EVENTS.REFRESH_CONNECTION,
                    globalSelf._onConnectionRefreshed.bind(globalSelf)
                );

                globalSelf.listenTo(
                    globalSelf.deviceConnComp,
                    constants.EVENTS.INVALID_CONNECTION_SELECTED,
                    globalSelf._onConnectionInvalid.bind(globalSelf)
                );

                if (globalSelf.error) {
                    globalSelf.deviceConnComp.highlightErrors([globalSelf.error]);
                }
            });

            return deviceConnPromise;
        },

        _onConnectionChanged: function (data) {
            this.$(".invokeopcua-config-controls, .invokeopcua-grids-section").show();
            this._updateOperationUI();

            DataChangeGridManager.refreshGridMode(this);
            CallMethodGridManager.refreshGridMode(this);

            if (this.addressSpaceBrowser && this.addressSpaceBrowser.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(this.getConnectionPayload());
            }
        },

        _onConnectionRefreshed: function (data) {
            var payload = this.getConnectionPayload();
            if (payload && payload.connectionId) {
                if (this.addressSpaceBrowser && this.addressSpaceBrowser.onConnectionChange) {
                    this.addressSpaceBrowser.onConnectionChange(payload);
                }
            }
        },

        _onConnectionInvalid: function () {
            if (this.addressSpaceBrowser && this.addressSpaceBrowser.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(null);
            }
        },

        getConnectionPayload: function () {
            var connData = (this.deviceConnComp && this.deviceConnComp.getConnectionData)
                ? this.deviceConnComp.getConnectionData() : {};
            var connId = connData.connectionId || "";
            var connName = connData.connectionName || "";
            var connType = connData.connectionType || "OPCUA";
            var cleanName = (connName && connName !== this.nls.SelectConnection) ? connName : "";
            return {
                connectionId: connId,
                connectionName: cleanName,
                name: cleanName,
                type: connType,
                connectionType: connType
            };
        },

        _setInvokeOPCUAHandlers: function () {
            this.activityReqres.setHandler("GET_SELECTED_CONNECTION", this._getSelectedConnection.bind(this));
        },

        _getSelectedConnection: function () {
            if (this.deviceConnComp && this.deviceConnComp.getSelectedConnection) {
                return this.deviceConnComp.getSelectedConnection();
            }
            return null;
        },

        _subscribeToEvents: function () {
            $(window).off("resize.invokeopcua").on("resize.invokeopcua", this._resizeGrids.bind(this));
        },

        _resizeGrids: function () {
            if (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget && this.dataChangeWriteGrid.widget.resize) {
                this.dataChangeWriteGrid.widget.resize();
            }
            if (this.callMethodGrid && this.callMethodGrid.widget && this.callMethodGrid.widget.resize) {
                this.callMethodGrid.widget.resize();
            }
            var drawerElem = this.$el.find("#invokeopcua-address-space-drawer-section");
            if (drawerElem.is(":visible") && drawerElem.width() > 50) {
                if (this.addressSpaceDrawer && this.addressSpaceDrawer.resizeDrawer) {
                    this.addressSpaceDrawer.resizeDrawer("invokeopcua-address-space-drawer-section", "50%");
                }
                var tree = (this.addressSpaceBrowser && this.addressSpaceBrowser._getTreeWidget)
                    ? this.addressSpaceBrowser._getTreeWidget() : null;
                if (tree && tree.resize) {
                    tree.resize();
                }
            }
        },

        _setOperationAndModeRadios: function () {
            var actId = this.activityId;
            this.$(".data-change-write-radio, .call-method-radio").attr("name", "operation-" + actId);
            this.$(".parallel-mode-radio, .sequential-mode-radio").attr("name", "execution-mode-" + actId);

            var operation = this.model.getKey("operation") || constants.DATA_CHANGE_WRITE;
            this.$(".data-change-write-radio").prop("checked", operation === constants.DATA_CHANGE_WRITE);
            this.$(".call-method-radio").prop("checked", operation === constants.CALL_METHOD);

            var executionMode = this.model.getKey("executionMode") || constants.PARALLEL;
            this.$(".parallel-mode-radio").prop("checked", executionMode === constants.PARALLEL);
            this.$(".sequential-mode-radio").prop("checked", executionMode === constants.SEQUENTIAL);
        },

        _renderDrawer: function () {
            var globalSelf = this;
            var containerElem = this.$el.find("#invokeopcua-main-container");
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

            this.addressSpaceDrawer.collapse("invokeopcua-address-space-drawer-section");
            containerElem.find("#invokeopcua-address-space-drawer-section").addClass("ul-state-collapsed");

            this.$el.off("click.invokeopcuaDrawer").on("click.invokeopcuaDrawer",
                ".ul-drawer-toggle, [class*='drawer-toggle'], [class*='toggle-handle'], [class*='toggleHandle'], [class*='splitbar']",
                function () {
                    setTimeout(function () {
                        var $sec = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                        var isVisible = Boolean($sec.length && $sec.is(":visible") && $sec.width() > 50 && !$sec.hasClass("ul-state-collapsed"));
                        if (isVisible) {
                            if (globalSelf.addressSpaceBrowser && globalSelf.addressSpaceBrowser.openOnDrawerExpand) {
                                globalSelf.addressSpaceBrowser.openOnDrawerExpand();
                            }
                        } else {
                            if (globalSelf.addressSpaceBrowser && globalSelf.addressSpaceBrowser.onDrawerCollapse) {
                                globalSelf.addressSpaceBrowser.onDrawerCollapse();
                            }
                        }
                    }, 200);
                }
            );
        },

        _initAddressSpaceBrowser: function () {
            AddressSpaceBrowser.init(this, this.$el.find("#invokeopcua-address-space-component"));
            this.addressSpaceBrowser = AddressSpaceBrowser;
        },

        _updateOperationUI: function () {
            var isDataChange = this.$(".data-change-write-radio").is(":checked");
            var operation = isDataChange ? constants.DATA_CHANGE_WRITE : constants.CALL_METHOD;

            this.model.setKey("operation", operation);
            this.$(".data-change-write-container").toggle(isDataChange);
            this.$(".call-method-container").toggle(!isDataChange);

            if (isDataChange) {
                DataChangeGridManager.renderDataChangeWriteComponent(this);
            } else {
                CallMethodGridManager.renderCallMethodComponent(this);
            }
        },

        _onInputParameterBadgeClick: function (event) {
            CallMethodGridManager.onInputParameterBadgeClick(event, this);
        },

        _initializeControls: function () {
            this.$(".data-change-write-container, .call-method-container").hide();
        },

        _renderHelp: function () {
            ["#parallel-mode-help-container", "#sequential-mode-help-container"].forEach(function (id) {
                var elem = this.$el.find(id);
                if (elem.length) {
                    uilayer.help({ elem: elem, position: "top", width: "15%" });
                }
            }, this);
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

        _deleteGridRows: function (grid, rows) {
            var dataItems = _.compact(_.uniq(rows.map(function (elem) {
                return grid.dataItem ? grid.dataItem(elem) : null;
            })));

            if (this.$(".call-method-radio").is(":checked") && dataItems.length) {
                CallMethodGridManager.onDeleteCallMethodRows(this, dataItems);
            }

            if (grid.dataSource) {
                dataItems.forEach(function (item) {
                    grid.dataSource.remove(item);
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
            if (!grid) return;

            var rows = [];
            var selected = (grid.select) ? grid.select() : $();
            if (selected.length) {
                selected.each(function () { rows.push($(this).closest("tr")[0]); });
            } else {
                var tbody = grid.tbody || (grid.element ? grid.element.find("tbody") : null);
                if (tbody && tbody.length) {
                    tbody.find("input:checked").each(function () { rows.push($(this).closest("tr")[0]); });
                }
            }

            if (rows.length) {
                this._deleteGridRows(grid, _.uniq(rows));
            }
        },

        _onAddDataChangeRow: function () {
            if (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget && this.dataChangeWriteGrid.widget.dataSource) {
                this.dataChangeWriteGrid.widget.dataSource.add({
                    name: "",
                    nodeId: "",
                    sampleValue: "",
                    newValue: ""
                });
            }
        },

        _onAddCallMethodRow: function () {
            if (this.callMethodGrid && this.callMethodGrid.widget && this.callMethodGrid.widget.dataSource) {
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

        getData: function () {
            var isDataChangeWrite = this.$(".data-change-write-radio").is(":checked");
            this.model.setKey("operation", isDataChangeWrite ? constants.DATA_CHANGE_WRITE : constants.CALL_METHOD);
            this.model.setKey("executionMode", this.$(".parallel-mode-radio").is(":checked") ? constants.PARALLEL : constants.SEQUENTIAL);

            if (isDataChangeWrite) {
                this.model.setKey("dataChangeWrite", this._getDataChangeGridData());
                this.model.setKey("callMethod", []);
            } else {
                this.model.setKey("callMethod", this._getCallMethodGridData());
                this.model.setKey("dataChangeWrite", []);
            }

            var activityData = this.model.toJSON();
            var mappedData = this._mapToConfigData();
            activityData = $.extend(true, activityData, mappedData);
            return activityData;
        },

        _mapToConfigData: function () {
            var mappingData = {};
            if (this.deviceConnComp) {
                var connData = this.deviceConnComp.getData();
                var connName = connData["connectionComboBox"] || "";
                mappingData["selectConnection"] = connName;
                mappingData["connectionComboBox"] = connName;
                mappingData["connectionName"] = connName;
                mappingData["connectionId"] = connData["connectionId"] || "";
                mappingData["connectionType"] = connData["connectionType"] || "OPCUA";
            }
            return mappingData;
        },

        _getDataChangeGridData: function () {
            var dcData = (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget && this.dataChangeWriteGrid.widget.dataSource)
                ? this.dataChangeWriteGrid.widget.dataSource.data().toJSON() : [];
            _.each(dcData, function (item) {
                if (item.newValue && typeof item.newValue === "object") {
                    item.newValue = ExpressionBuilderUtility.getExpression(item.newValue);
                }
            });
            return dcData;
        },

        _getCallMethodGridData: function () {
            var cmData = (this.callMethodGrid && this.callMethodGrid.widget && this.callMethodGrid.widget.dataSource)
                ? this.callMethodGrid.widget.dataSource.data().toJSON() : [];
            _.each(cmData, function (item) {
                if (item.inputParameters && item.inputParameters.length) {
                    _.each(item.inputParameters, function (param) {
                        if (param.value && typeof param.value === "object") {
                            param.value = ExpressionBuilderUtility.getExpression(param.value);
                        }
                    });
                }
            });
            return cmData;
        },

        setData: function (obj) {
            for (var key in obj) {
                if (this.model.attributes.hasOwnProperty(key)) {
                    this.model.setKey(key, obj[key]);
                }
            }
            this.initialData = obj;
        },

        highlightErrors: function (errorObject) {
            var globalSelf = this;
            if (errorObject && errorObject.length > 0) {
                _.each(errorObject, function (error) {
                    globalSelf.error = error;
                    if (globalSelf.deviceConnComp) {
                        globalSelf.deviceConnComp.highlightErrors([globalSelf.error]);
                    } else {
                        MIUIComponentI.prototype.highlightErrors.call(globalSelf, [globalSelf.error]);
                    }
                });
            }
        },

        getErrorMessage: function () {
            return [];
        },

        _checkBeforeDestroy: function (obj) {
            if (obj !== null && obj !== undefined) {
                if (typeof obj.destroy === "function") {
                    obj.destroy();
                } else if (typeof obj.onDestroy === "function") {
                    obj.onDestroy();
                }
                obj = null;
            }
        },

        onBeforeDestroy: function () {
            this.activityId = null;
            this.designerReqres = null;
            this.activityReqres = null;
            this.initialData = null;
            $(window).off("resize.invokeopcua");
            this.$el.off("click.invokeopcuaDrawer");

            CallMethodGridManager._destroyInputParametersModal(this);

            this._checkBeforeDestroy(this.dataChangeWriteSearchBar);
            this._checkBeforeDestroy(this.callMethodSearchBar);
            this._checkBeforeDestroy(this.dataChangeWriteGrid);
            this._checkBeforeDestroy(this.callMethodGrid);
            this._checkBeforeDestroy(this.addressSpaceBrowser);
            this._checkBeforeDestroy(this.addressSpaceDrawer);

            if (this.deviceConnComp) {
                this.stopListening(this.deviceConnComp);
                if (typeof this.deviceConnComp.onDestroy === "function") {
                    this.deviceConnComp.onDestroy();
                } else if (typeof this.deviceConnComp.destroy === "function") {
                    this.deviceConnComp.destroy();
                }
                this.deviceConnComp = null;
            }
        }
    });

    return InvokeOPCUAComponent;
});