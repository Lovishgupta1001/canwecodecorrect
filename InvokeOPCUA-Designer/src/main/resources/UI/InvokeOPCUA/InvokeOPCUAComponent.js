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
            this.$(".data-change-write-radio, .call-method-radio").attr("name", "operation-" + actId);
            this.$(".parallel-mode-radio, .sequential-mode-radio").attr("name", "execution-mode-" + actId);

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
                globalSelf.dataChangeWriteGrid?.widget?.resize();
                globalSelf.callMethodGrid?.widget?.resize();
                var drawerElem = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                if (drawerElem.is(":visible") && drawerElem.width() > 50) {
                    globalSelf.addressSpaceDrawer?.resizeDrawer("invokeopcua-address-space-drawer-section", "50%");
                    globalSelf.addressSpaceBrowser?._getTreeWidget?.()?.resize?.();
                }
            });

            deferred.resolve();
            return deferred.promise();
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

            this.$el.off("click.invokeopcuaDrawer").on("click.invokeopcuaDrawer",
                ".ul-drawer-toggle, [class*='drawer-toggle'], [class*='toggle-handle'], [class*='toggleHandle'], [class*='splitbar']",
                function () {
                    setTimeout(function () {
                        var $sec = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                        var isVisible = $sec.length && $sec.is(":visible") && $sec.width() > 50 && !$sec.hasClass("ul-state-collapsed");
                        if (isVisible && globalSelf.addressSpaceBrowser?.openOnDrawerExpand) {
                            globalSelf.addressSpaceBrowser.openOnDrawerExpand();
                        }
                    }, 200);
                }
            );
        },

        _initAddressSpaceBrowser: function () {
            AddressSpaceBrowser.init(this, this.$el.find("#invokeopcua-address-space-component"));
            this.addressSpaceBrowser = AddressSpaceBrowser;
        },

        getConnectionPayload: function () {
            var connData = (this.deviceConnComp?.getConnectionData ? this.deviceConnComp.getConnectionData() : null) || {};
            var id = connData.connectionId || this.model.getKey("connectionId") || "";
            var name = connData.connectionName || connData.name || this.model.getKey("connectionName") || "";
            var type = connData.connectionType || connData.type || this.model.getKey("connectionType") || "";
            var text = (name && name !== this.nls.SelectConnection) ? name : "";

            return {
                connectionId: id,
                connectionName: text,
                name: text,
                type: type,
                connectionType: type
            };
        },

        _renderHelp: function () {
            ["#parallel-mode-help-container", "#sequential-mode-help-container"].forEach(function (id) {
                var elem = this.$el.find(id);
                if (elem.length) {
                    uilayer.help({ elem: elem, position: "top", width: "15%" });
                }
            }, this);
        },

        _initializeControls: function () {
            this.$(".data-change-write-container, .call-method-container, .invokeopcua-config-controls, .invokeopcua-grids-section").hide();
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
                CallMethodGridManager.removeOutputVariablesFromProcessModel(dataItems, this);
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
            var selected = grid.select ? grid.select() : $();
            if (selected.length) {
                selected.each(function () { rows.push($(this).closest("tr")[0]); });
            } else {
                var tbody = grid.tbody || (grid.element ? grid.element.find("tbody") : null);
                tbody?.find("input:checked").each(function () { rows.push($(this).closest("tr")[0]); });
            }

            if (rows.length) {
                this._deleteGridRows(grid, _.uniq(rows));
            }
        },

        _onAddDataChangeRow: function () {
            this.dataChangeWriteGrid?.widget?.dataSource?.add({
                name: "",
                nodeId: "",
                sampleValue: "",
                newValue: ""
            });
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
                "activities/invokeopcua/getSupportedPluginType",
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
            var container = this.$el.find("#invokeopcua-connection-component-container, .invokeopcua-connection-component-container");
            if (!container.length) {
                container = $("#invokeopcua-connection-component-container, .invokeopcua-connection-component-container");
            }
            if (!container.length) {
                return;
            }

            var connData = this.initialData ? _.clone(this.initialData) : {};
            var initialConn = this.model.getKey("connectionComboBox") || this.model.getKey("selectConnection") || this.model.getKey("connectionName") || (this.initialData && this.initialData.selectConnection);
            connData.connectionComboBox = initialConn;
            connData.selectConnection = initialConn;
            connData.connectionName = this.model.getKey("connectionName") || initialConn;
            connData.connectionId = this.model.getKey("connectionId") || (this.initialData && this.initialData.connectionId);

            var compOptions = {
                el: container,
                activityId: globalSelf.activityId,
                reqres: globalSelf.designerReqres,
                activityReqres: globalSelf.activityReqres,
                pluginType: globalSelf._pluginTypes || null,
                data: connData
            };

            var ConnComp = (typeof DeviceConnectorConnComponent === "function" ? DeviceConnectorConnComponent : null) ||
                           (typeof window !== "undefined" && window.DeviceConnectorConnComponent) ||
                           (typeof MIUIComponent !== "undefined" && MIUIComponent.DeviceConnectorConnComponent);

            if (typeof ConnComp === "function") {
                if (ConnComp.prototype && ConnComp.prototype.render) {
                    globalSelf.deviceConnComp = new ConnComp(compOptions);
                    globalSelf.deviceConnComp.render();
                    globalSelf._setupDeviceConnListeners();
                } else {
                    var promise = ConnComp(compOptions);
                    if (promise && promise.done) {
                        promise.done(function (comp) {
                            globalSelf.deviceConnComp = comp;
                            globalSelf._setupDeviceConnListeners();
                        });
                    }
                }
            } else if (typeof MIUIComponent !== "undefined" && typeof MIUIComponent.DeviceConnectorConnComponent === "function") {
                var promise = MIUIComponent.DeviceConnectorConnComponent(compOptions);
                if (promise && promise.done) {
                    promise.done(function (comp) {
                        globalSelf.deviceConnComp = comp;
                        globalSelf._setupDeviceConnListeners();
                    });
                }
            }

            this._fetchPluginTypes().done(function (pluginType) {
                if (pluginType && globalSelf.deviceConnComp) {
                    globalSelf.deviceConnComp.pluginType = pluginType;
                    if (typeof globalSelf.deviceConnComp._refreshConnection === "function") {
                        globalSelf.deviceConnComp._refreshConnection();
                    }
                }
            });
        },

        _setupDeviceConnListeners: function () {
            if (!this.deviceConnComp) return;

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
                    this.model.setKey("dataChangeWrite", [{ name: "", nodeId: "", sampleValue: "", newValue: "" }]);
                }

                var currentCm = this.model.getKey("callMethod") || [];
                if (!currentCm.length) {
                    this.model.setKey("callMethod", [{ name: "", nodeId: "", objectName: "", objectNodeId: "", inputParameters: [], outputValue: "" }]);
                }
            }

            DataChangeGridManager.refreshGridMode(this);
            CallMethodGridManager.refreshGridMode(this);

            if (this.addressSpaceBrowser?.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(this.getConnectionPayload());
            }
        },

        _onConnectionRefreshed: function () {
            if (this.addressSpaceBrowser?.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(this.getConnectionPayload());
            }
        },

        _onConnectionInvalid: function () {
            this.$(".invokeopcua-config-controls, .invokeopcua-grids-section").hide();

            this.model.setKey("connectionComboBox", "");
            this.model.setKey("connectionName", "");
            this.model.setKey("connectionId", "");
            this.model.setKey("connectionType", "");
            this.model.setKey("selectConnection", "");
            this.model.setKey("dataChangeWrite", []);
            this.model.setKey("callMethod", []);

            this.dataChangeWriteGrid?.widget?.dataSource?.data([]);
            this.callMethodGrid?.widget?.dataSource?.data([]);

            if (this.addressSpaceBrowser?.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(null);
            }
        },

        _updateOperationUI: function () {
            var isDataChange = this.$(".data-change-write-radio").is(":checked");
            var operation = isDataChange ? Constants.DATA_CHANGE_WRITE : Constants.CALL_METHOD;

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

        getData: function () {
            var isDataChangeWrite = this.$(".data-change-write-radio").is(":checked");
            this.model.setKey("operation", isDataChangeWrite ? Constants.DATA_CHANGE_WRITE : Constants.CALL_METHOD);
            this.model.setKey("executionMode", this.$(".parallel-mode-radio").is(":checked") ? Constants.PARALLEL : Constants.SEQUENTIAL);

            if (isDataChangeWrite) {
                var dcData = this.dataChangeWriteGrid?.widget?.dataSource ? this.dataChangeWriteGrid.widget.dataSource.data().toJSON() : [];
                _.each(dcData, function (item) {
                    if (item?.newValue && typeof item.newValue === "object") {
                        item.newValue = ExpressionBuilderUtility.getExpression(item.newValue);
                    }
                });
                this.model.setKey("dataChangeWrite", dcData);
                this.model.setKey("callMethod", []);
            } else {
                var cmData = this.callMethodGrid?.widget?.dataSource ? this.callMethodGrid.widget.dataSource.data().toJSON() : [];
                _.each(cmData, function (item) {
                    if (item?.inputParameters?.length) {
                        _.each(item.inputParameters, function (param) {
                            if (param?.value && typeof param.value === "object") {
                                param.value = ExpressionBuilderUtility.getExpression(param.value);
                            }
                        });
                    }
                });
                this.model.setKey("callMethod", cmData);
                this.model.setKey("dataChangeWrite", []);
            }

            if (this.deviceConnComp?.getData) {
                var compData = this.deviceConnComp.getData();
                var connText = compData.connectionName || compData.connectionComboBox || "";
                var connId = compData.connectionId || "";
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
            this.deviceConnComp?.setData?.(obj);
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList?.length) return;

            errorObjectList.forEach(function (errorObject) {
                if (!errorObject) return;
                var path = errorObject.path || errorObject.resource || "";
                if (!path) return;

                var pathParts = path.split("/");
                var prefix = pathParts[0];

                if (prefix === "connectionComboBox" || prefix === "selectConnection" || prefix.indexOf("connection") !== -1 || path.indexOf("connection") !== -1) {
                    if (this.deviceConnComp?.highlightErrors) {
                        this.deviceConnComp.highlightErrors([errorObject]);
                    } else {
                        var elem = this.$el.find("#connectionComboBox");
                        if (elem.length) {
                            this.focusErrorComponent(elem);
                            elem.addErrorHighlightClass("components-error-red-highlight");
                            this.showErrorTooltip(errorObject, elem);
                        }
                    }
                    return;
                }

                var isDataChange = path.indexOf("dataChangeWrite") !== -1;
                var isCallMethod = path.indexOf("callMethod") !== -1;

                if (isDataChange || isCallMethod) {
                    var section = isDataChange ? "dataChangeWrite" : "callMethod";
                    var radioClass = isDataChange ? ".data-change-write-radio" : ".call-method-radio";
                    var gridObj = isDataChange ? this.dataChangeWriteGrid : this.callMethodGrid;

                    if (!this.$(radioClass).is(":checked")) {
                        this.$(radioClass).prop("checked", true);
                        this._updateOperationUI();
                        gridObj = isDataChange ? this.dataChangeWriteGrid : this.callMethodGrid;
                    }

                    var rowIdx = -1;
                    var fieldName = "";
                    for (var i = 0; i < pathParts.length; i++) {
                        if (pathParts[i] === section && i + 1 < pathParts.length) {
                            rowIdx = parseInt(pathParts[i + 1], 10) - 1;
                            fieldName = pathParts[i + 2] || "name";
                            break;
                        }
                    }

                    var grid = gridObj?.widget || gridObj;
                    if (grid && rowIdx >= 0) {
                        var tbody = grid.tbody || (grid.element ? grid.element.find("tbody") : null);
                        var rows = tbody ? tbody.find("tr") : [];
                        var targetRow = $(rows[rowIdx]);
                        if (targetRow.length) {
                            targetRow[0].scrollIntoView?.({ behavior: "smooth", block: "center" });
                            var cell = fieldName ? targetRow.find("." + fieldName) : targetRow;
                            var target = cell.length ? cell : targetRow;
                            target.addErrorHighlightClass("components-error-red-highlight");
                            this.showErrorTooltip(errorObject, target);
                            return;
                        }
                    }

                    var containerClass = isDataChange ? ".cvt-grid-div-data-change-write" : ".cvt-grid-div-call-method";
                    var cont = this.$el.find(containerClass);
                    if (cont.length) {
                        cont.addErrorHighlightClass("components-error-red-highlight");
                        this.showErrorTooltip(errorObject, cont);
                    }
                }
            }, this);
        },

        getErrorMessage: function () {
            return "";
        },

        _destroyComponent: function (component) {
            component?.destroy?.();
        },

        onBeforeDestroy: function () {
            $(window).off("resize.invokeopcua");
            this.$el.off("click.invokeopcuaDrawer");

            CallMethodGridManager._destroyInputParametersModal(this);

            this._destroyComponent(this.dataChangeWriteSearchBar);
            this._destroyComponent(this.callMethodSearchBar);
            this._destroyComponent(this.dataChangeWriteGrid);
            this._destroyComponent(this.callMethodGrid);
            this.addressSpaceBrowser?.onDestroy?.();
            this.addressSpaceDrawer?.destroy?.();
            this.deviceConnComp?.destroy?.();

            this.dataChangeWriteSearchBar = null;
            this.callMethodSearchBar = null;
            this.dataChangeWriteGrid = null;
            this.callMethodGrid = null;
            this.addressSpaceBrowser = null;
            this.addressSpaceDrawer = null;
            this.deviceConnComp = null;
            this.selectedCallMethodRow = null;
        }
    });

    return InvokeOPCUAUIComponent;
});