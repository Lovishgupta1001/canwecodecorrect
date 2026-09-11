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
        DeviceConnConstants = require("Components/Activities/DeviceConnectorConnComponent/constants/Constants"),
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
            this.activityReqres = options.activityReqres || ((Backbone && Backbone.Wreqr) ? new Backbone.Wreqr.RequestResponse() : null);
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
            this._initConnectionUI();
            this._updateOperationUI();
            this._renderHelp();

            $(window).off("resize.invokeopcua").on("resize.invokeopcua", function () {
                if (globalSelf.dataChangeWriteGrid && globalSelf.dataChangeWriteGrid.widget && globalSelf.dataChangeWriteGrid.widget.resize) {
                    globalSelf.dataChangeWriteGrid.widget.resize();
                }
                if (globalSelf.callMethodGrid && globalSelf.callMethodGrid.widget && globalSelf.callMethodGrid.widget.resize) {
                    globalSelf.callMethodGrid.widget.resize();
                }
                var drawerElem = globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
                if (drawerElem.is(":visible") && drawerElem.width() > 50) {
                    if (globalSelf.addressSpaceDrawer && globalSelf.addressSpaceDrawer.resizeDrawer) {
                        globalSelf.addressSpaceDrawer.resizeDrawer("invokeopcua-address-space-drawer-section", "50%");
                    }
                    var tree = (globalSelf.addressSpaceBrowser && globalSelf.addressSpaceBrowser._getTreeWidget) ? globalSelf.addressSpaceBrowser._getTreeWidget() : null;
                    if (tree && tree.resize) {
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

            if (this.addressSpaceDrawer && this.addressSpaceDrawer.collapse) {
                this.addressSpaceDrawer.collapse("invokeopcua-address-space-drawer-section");
            }
            containerElem.find("#invokeopcua-address-space-drawer-section").addClass("ul-state-collapsed");

            setTimeout(function () {
                if (globalSelf.addressSpaceDrawer && globalSelf.addressSpaceDrawer.collapse) {
                    globalSelf.addressSpaceDrawer.collapse("invokeopcua-address-space-drawer-section");
                }
                containerElem.find("#invokeopcua-address-space-drawer-section").addClass("ul-state-collapsed");
            }, 100);

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

        getConnectionPayload: function () {
            if (this.deviceConnComp && this.deviceConnComp.getConnectionData) {
                var connData = this.deviceConnComp.getConnectionData();
                var connId = connData.connectionId || this.model.getKey("connectionId") || "";
                var connName = connData.connectionName || this.model.getKey("connectionName") || "";
                var connType = connData.connectionType || this.model.getKey("connectionType") || "OPCUA";
                return {
                    connectionId: connId,
                    connectionName: (connName && connName !== this.nls.SelectConnection) ? connName : "",
                    name: (connName && connName !== this.nls.SelectConnection) ? connName : "",
                    type: connType,
                    connectionType: connType
                };
            }
            var mConnId = this.model.getKey("connectionId") || "";
            var mConnName = this.model.getKey("connectionName") || "";
            var mConnType = this.model.getKey("connectionType") || "OPCUA";
            return {
                connectionId: mConnId,
                connectionName: (mConnName && mConnName !== this.nls.SelectConnection) ? mConnName : "",
                name: (mConnName && mConnName !== this.nls.SelectConnection) ? mConnName : "",
                type: mConnType,
                connectionType: mConnType
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

        _initConnectionUI: function () {
            var globalSelf = this;
            var container = this.$el.find("#invokeopcua-connection-component-container");

            var connData = {};
            var savedConn = this.model.getKey("connectionComboBox") || this.model.getKey("selectConnection") || this.model.getKey("connectionName");
            if (savedConn) {
                connData.connectionComboBox = savedConn;
                connData.connectionName = savedConn;
                connData.connectionId = this.model.getKey("connectionId") || "";
            }

            var connOptions = {
                el: container,
                activityId: this.activityId,
                reqres: this.designerReqres,
                activityReqres: this.activityReqres,
                allowedConnectionTypes: ["OPCUA"],
                data: connData
            };

            var deviceConnPromise;
            if (window.MIUIComponent && window.MIUIComponent.DeviceConnectorConnComponent) {
                deviceConnPromise = window.MIUIComponent.DeviceConnectorConnComponent(connOptions);
            } else {
                var deferred = $.Deferred();
                var comp = new DeviceConnectorConnComponent(connOptions);
                comp.render();
                deferred.resolve(comp);
                deviceConnPromise = deferred.promise();
            }

            deviceConnPromise.done(function (comp) {
                globalSelf.deviceConnComp = comp;
                globalSelf.connectionComboBox = comp.connectionComboBox;

                globalSelf.listenTo(
                    globalSelf.deviceConnComp,
                    DeviceConnConstants.EVENTS.CHANGE_CONNECTION_VARIABLE,
                    globalSelf._onConnectionChanged.bind(globalSelf)
                );

                globalSelf.listenTo(
                    globalSelf.deviceConnComp,
                    DeviceConnConstants.EVENTS.REFRESH_CONNECTION,
                    globalSelf._onConnectionRefreshed.bind(globalSelf)
                );

                globalSelf.listenTo(
                    globalSelf.deviceConnComp,
                    DeviceConnConstants.EVENTS.INVALID_CONNECTION_SELECTED,
                    globalSelf._onConnectionInvalid.bind(globalSelf)
                );

                var selectedConn = comp.getSelectedConnection ? comp.getSelectedConnection() : null;
                if (selectedConn) {
                    globalSelf._onConnectionChanged(comp.getConnectionData());
                }
            });
        },

        _onConnectionChanged: function (connData) {
            var connId = connData ? connData.connectionId : "";
            var connName = connData ? (connData.connectionName || connData.name || "") : "";
            var connType = connData ? (connData.connectionType || "OPCUA") : "OPCUA";

            this.model.setKey("connectionComboBox", connName);
            this.model.setKey("connectionName", connName);
            this.model.setKey("connectionId", connId);
            this.model.setKey("connectionType", connType);
            this.model.setKey("selectConnection", connName || connId);

            this.$(".invokeopcua-config-controls, .invokeopcua-grids-section").show();
            this._updateOperationUI();

            DataChangeGridManager.refreshGridMode(this);
            CallMethodGridManager.refreshGridMode(this);

            if (this.addressSpaceBrowser && this.addressSpaceBrowser.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(this.getConnectionPayload());
            }
        },

        _onConnectionRefreshed: function (refreshData) {
            var payload = this.getConnectionPayload();
            if (payload.connectionId && this.addressSpaceBrowser && this.addressSpaceBrowser.onConnectionChange) {
                this.addressSpaceBrowser.onConnectionChange(payload);
            }
        },

        _onConnectionInvalid: function () {
            this.$(".invokeopcua-config-controls, .invokeopcua-grids-section").hide();

            this.model.setKey("connectionComboBox", "");
            this.model.setKey("connectionName", "");
            this.model.setKey("connectionId", "");
            this.model.setKey("selectConnection", "");
            this.model.setKey("connectionType", "");

            this.model.setKey("dataChangeWrite", []);
            this.model.setKey("callMethod", []);

            if (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget && this.dataChangeWriteGrid.widget.dataSource) {
                this.dataChangeWriteGrid.widget.dataSource.data([]);
            }
            if (this.callMethodGrid && this.callMethodGrid.widget && this.callMethodGrid.widget.dataSource) {
                this.callMethodGrid.widget.dataSource.data([]);
            }

            if (this.addressSpaceBrowser && this.addressSpaceBrowser.onConnectionChange) {
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
                var dcData = (this.dataChangeWriteGrid && this.dataChangeWriteGrid.widget && this.dataChangeWriteGrid.widget.dataSource)
                    ? this.dataChangeWriteGrid.widget.dataSource.data().toJSON()
                    : [];
                _.each(dcData, function (item) {
                    if (item && item.newValue && item.newValue.constructor === Object) {
                        item.newValue = ExpressionBuilderUtility.getExpression(item.newValue);
                    }
                });
                this.model.setKey("dataChangeWrite", dcData);
                this.model.setKey("callMethod", []);
            } else {
                var cmData = (this.callMethodGrid && this.callMethodGrid.widget && this.callMethodGrid.widget.dataSource)
                    ? this.callMethodGrid.widget.dataSource.data().toJSON()
                    : [];
                _.each(cmData, function (item) {
                    if (item && item.inputParameters && item.inputParameters.length) {
                        _.each(item.inputParameters, function (param) {
                            if (param && param.value && param.value.constructor === Object) {
                                param.value = ExpressionBuilderUtility.getExpression(param.value);
                            }
                        });
                    }
                });
                this.model.setKey("callMethod", cmData);
                this.model.setKey("dataChangeWrite", []);
            }

            if (this.deviceConnComp && this.deviceConnComp.getData) {
                var connData = this.deviceConnComp.getData();
                var cText = connData.connectionComboBox || connData.connectionName || "";
                var cId = connData.connectionId || "";
                this.model.setKey("connectionComboBox", cText);
                this.model.setKey("connectionName", cText);
                this.model.setKey("connectionId", cId);
                this.model.setKey("selectConnection", cText || cId);
                if (connData.connectionType) {
                    this.model.setKey("connectionType", connData.connectionType);
                }
            } else {
                var rawText = this.connectionComboBox ? this.connectionComboBox.text() : "";
                var connText = (rawText && rawText !== this.nls.SelectConnection) ? rawText : "";
                var connId = this.connectionComboBox ? this.connectionComboBox.value() : "";

                this.model.setKey("connectionComboBox", connText);
                this.model.setKey("connectionName", connText);
                this.model.setKey("connectionId", connId);
                this.model.setKey("selectConnection", connText || connId);
            }

            return this.model.toJSON();
        },

        setData: function (obj) {
            if (!obj) {
                return;
            }
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    this.model.setKey(key, obj[key]);
                }
            }
            this.initialData = obj;

            if (this.deviceConnComp && this.deviceConnComp.setData) {
                this.deviceConnComp.setData(obj);
            }
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList || !errorObjectList.length) return;

            errorObjectList.forEach(function (errorObject) {
                if (!errorObject) return;
                var path = errorObject.path || errorObject.resource || "";
                if (!path) return;

                var pathParts = path.split("/");
                var prefix = pathParts[0];

                if (prefix === "connectionComboBox" || prefix === "selectConnection" || prefix.indexOf("connection") !== -1 || path.indexOf("connection") !== -1) {
                    if (this.deviceConnComp && this.deviceConnComp.highlightErrors) {
                        this.deviceConnComp.highlightErrors([errorObject]);
                    } else {
                        var elem = this.$el.find("#connectionComboBox");
                        if (elem.length) {
                            this.focusErrorComponent(elem);
                            var target = elem.parent().find(".k-input, .k-dropdown-wrap, .k-widget");
                            if (!target.length) {
                                target = elem;
                            }
                            target.addErrorHighlightClass("components-error-red-highlight");
                            this.showErrorTooltip(errorObject, target);
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

                    var grid = (gridObj && gridObj.widget) ? gridObj.widget : gridObj;
                    if (grid && rowIdx >= 0) {
                        var tbody = grid.tbody || (grid.element ? grid.element.find("tbody") : null);
                        var rows = tbody ? tbody.find("tr") : [];
                        var targetRow = $(rows[rowIdx]);
                        if (targetRow.length) {
                            if (targetRow[0] && targetRow[0].scrollIntoView) {
                                targetRow[0].scrollIntoView({ behavior: "smooth", block: "center" });
                            }
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
            if (this.deviceConnComp && this.deviceConnComp.getErrorMessage) {
                var connErr = this.deviceConnComp.getErrorMessage();
                if (connErr) {
                    return connErr;
                }
            } else if (!this.model.getKey("connectionId")) {
                return (this.nls && this.nls.selectValidConnection) || "Select a valid connection.";
            }
            return "";
        },

        _destroyComponent: function (component) {
            if (component && component.destroy) {
                component.destroy();
            }
        },

        onBeforeDestroy: function () {
            $(window).off("resize.invokeopcua");
            this.$el.off("click.invokeopcuaDrawer");

            CallMethodGridManager._destroyInputParametersModal(this);

            this._destroyComponent(this.dataChangeWriteSearchBar);
            this._destroyComponent(this.callMethodSearchBar);
            this._destroyComponent(this.dataChangeWriteGrid);
            this._destroyComponent(this.callMethodGrid);
            if (this.addressSpaceBrowser && this.addressSpaceBrowser.onDestroy) {
                this.addressSpaceBrowser.onDestroy();
            }
            if (this.addressSpaceDrawer && this.addressSpaceDrawer.destroy) {
                this.addressSpaceDrawer.destroy();
            }
            if (this.deviceConnComp) {
                this.stopListening(this.deviceConnComp);
                if (this.deviceConnComp.destroy) {
                    this.deviceConnComp.destroy();
                } else if (this.deviceConnComp.onBeforeDestroy) {
                    this.deviceConnComp.onBeforeDestroy();
                }
                this.deviceConnComp = null;
            }
            this.connectionComboBox = null;

            this.dataChangeWriteSearchBar = null;
            this.callMethodSearchBar = null;
            this.dataChangeWriteGrid = null;
            this.callMethodGrid = null;
            this.addressSpaceBrowser = null;
            this.addressSpaceDrawer = null;
            this.selectedCallMethodRow = null;
        }
    });

    return InvokeOPCUAUIComponent;
});