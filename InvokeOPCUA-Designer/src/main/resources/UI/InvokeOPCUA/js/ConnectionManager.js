define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility,
        ActivitiesUtility = require("Components/Activities/ActivitiesUtility/ActivitiesUtility"),
        DataChangeGridManager = require("./DataChangeGridManager"),
        CallMethodGridManager = require("./CallMethodGridManager"),
        Constants = require("./constants");

    var ConnectionManager = {

        _fetchAccessibleConnectionsList: function () {
            var allConnections = [];

            // 1. Fetch Transport Connections (Device Connector, OPC UA, etc.)
            var transportPromise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleTransportConnections", null, "json", null, true);
            if (transportPromise && transportPromise.done) {
                transportPromise.done(function (connectionsData) {
                    if (connectionsData && Array.isArray(connectionsData)) {
                        allConnections = allConnections.concat(connectionsData);
                    }
                });
            }

            // 2. Fetch Accessible General Connections
            var connPromise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleConnections", null, "json", null, true);
            if (connPromise && connPromise.done) {
                connPromise.done(function (connectionsData) {
                    if (connectionsData && Array.isArray(connectionsData)) {
                        allConnections = allConnections.concat(connectionsData);
                    }
                });
            }

            return allConnections;
        },

        _buildFinalConnectionArray: function (globalSelf) {
            var rawConnections = this._fetchAccessibleConnectionsList();
            var finalConnArr = [];
            var seenIds = {};

            // 1. Process all connections fetched from server
            _.each(rawConnections, function (conn) {
                if (!conn) return;
                var id = conn.connectionId !== undefined ? conn.connectionId : conn.id;
                var name = conn.connectionName || conn.name || conn.key;
                if (!id && !name) return;

                var idStr = String(id !== undefined ? id : name);
                if (!seenIds[idStr]) {
                    seenIds[idStr] = true;
                    finalConnArr.push({
                        key: name || idStr,
                        connectionId: id !== undefined ? id : name,
                        connectionName: name || idStr,
                        connectionColor: conn.connectionColor || "rgb(226, 0, 132)",
                        connectionType: conn.connectionType || conn.type || "OPCUA",
                        pluginType: conn.pluginDisplayName || conn.pluginType || "Device Connector",
                        pluginDisplayName: conn.pluginDisplayName || conn.pluginType || "Device Connector",
                        rawConnection: conn
                    });
                }
            });

            // 2. Also merge any upstream process model variable connections
            if (globalSelf.processModel && ActivitiesUtility && ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource) {
                var ds = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(globalSelf.processModel, globalSelf.activityId);
                var varData = ds ? ds.data() : [];
                _.each(varData, function (item) {
                    if (!item) return;
                    var id = item.connectionId !== undefined ? item.connectionId : item.id;
                    var name = item.key || item.connectionName || item.name;
                    var idStr = String(id !== undefined ? id : name);
                    if (!seenIds[idStr]) {
                        seenIds[idStr] = true;
                        finalConnArr.push({
                            key: name || idStr,
                            connectionId: id !== undefined ? id : name,
                            connectionName: name || idStr,
                            connectionColor: item.connectionColor || "#0078d4",
                            connectionType: item.connectionType || "OPCUA",
                            pluginType: item.pluginType || "OPC UA",
                            rawConnection: item
                        });
                    }
                });
            }

            return finalConnArr;
        },

        renderConnectionDropdown: function (globalSelf) {
            var manager = this;
            var finalConnArr = manager._buildFinalConnectionArray(globalSelf);

            globalSelf.connectionComboBox = uilayer.dropDownList({
                elem: globalSelf.$el.find("#connectionComboBox"),
                dataSource: finalConnArr,
                dataTextField: "key",
                dataValueField: "connectionId",
                template: function (item) {
                    return uilayer.templateFactory.get("connectionItem", {
                        color: item.connectionColor || "#0078d4",
                        text: item.key
                    });
                },
                optionLabel: globalSelf.nls.SelectConnection,
                select: function (e) {
                    if (!(e.dataItem?.connectionId)) {
                        e.preventDefault();
                    }
                },
                change: function () {
                    manager._validateAndHandleConnection(this.value(), globalSelf, false);
                }
            });

            var selectedConn = globalSelf.model.getKey("connectionComboBox") ||
                globalSelf.model.getKey("connectionName") ||
                globalSelf.model.getKey("selectConnection") ||
                (globalSelf.initialData && (globalSelf.initialData.connectionComboBox || globalSelf.initialData.selectConnection || globalSelf.initialData.connectionName));

            if (selectedConn) {
                globalSelf.connectionComboBox.text(selectedConn);
                var currentVal = globalSelf.connectionComboBox.value();
                if (currentVal) {
                    manager._validateAndHandleConnection(currentVal, globalSelf, true);
                }
            }
        },

        refreshConnection: function (globalSelf) {
            var manager = this;
            var finalConnArr = manager._buildFinalConnectionArray(globalSelf);

            if (globalSelf.connectionComboBox) {
                globalSelf.connectionComboBox.setDataSource(finalConnArr);

                var connId = globalSelf.connectionComboBox.value();
                if (parseInt(connId, 10) > 0) {
                    manager._validateAndHandleConnection(connId, globalSelf, false);
                    uilayer.notifier("success", globalSelf.nls.ConnectionsRefreshed);
                } else {
                    uilayer.notifier("warning", globalSelf.nls.InvalidConnection || globalSelf.nls.SelectConnection);
                }
            }
        },

        _validateAndHandleConnection: function (connId, globalSelf, isInitial) {
            var manager = this;
            // Target the uilayer dropdownlist's wrapper element.
            var ddlElem = globalSelf.connectionComboBox
                ? (globalSelf.connectionComboBox.element || globalSelf.$el.find("#connectionComboBox"))
                : globalSelf.$el.find("#connectionComboBox");
            var element = ddlElem.closest(".ul-input-container, .ul-dropdown-wrapper");
            if (!element.length) {
                element = ddlElem.parent();
            }

            if (!connId || ((typeof connId === "string") && !parseInt(connId, 10))) {
                manager.hideAllConfiguration(globalSelf);
                if (connId && !isInitial) {
                    manager._showConnErrorTooltip(globalSelf, element, globalSelf.nls.InvalidConnection);
                }
                return;
            }

            var connItem = null;
            if (globalSelf.connectionComboBox?.dataSource) {
                var allItems = globalSelf.connectionComboBox.dataSource.data();
                for (var i = 0; i < allItems.length; i++) {
                    var item = allItems[i];
                    if (String(item.connectionId) === String(connId)) {
                        connItem = item.toJSON ? item.toJSON() : item;
                        break;
                    }
                }
            }

            manager._hideConnErrorTooltip(globalSelf, element);
            manager.showOpcUaConfiguration(globalSelf, connItem, connId, isInitial);
        },

        showOpcUaConfiguration: function (globalSelf, connItem, connId, isInitial) {
            globalSelf.$(".invokeopcua-config-controls, .invokeopcua-grids-section").show();

            var connText = globalSelf.connectionComboBox ? globalSelf.connectionComboBox.text() : "";
            var connName = connItem?.connectionName || connItem?.key || connText;

            globalSelf.model.setKey("connectionComboBox", connText);
            globalSelf.model.setKey("connectionName", connName);
            globalSelf.model.setKey("connectionId", connId);
            globalSelf.model.setKey("connectionType", "OPCUA");
            globalSelf.model.setKey("selectConnection", connText || connId);

            if (!isInitial) {
                var currentDc = globalSelf.model.getKey("dataChangeWrite") || [];
                if (!currentDc.length) {
                    globalSelf.model.setKey("dataChangeWrite", [{
                        name: "",
                        nodeId: "",
                        sampleValue: "",
                        newValue: ""
                    }]);
                }

                var currentCm = globalSelf.model.getKey("callMethod") || [];
                if (!currentCm.length) {
                    globalSelf.model.setKey("callMethod", [{
                        name: "",
                        nodeId: "",
                        objectName: "",
                        objectNodeId: "",
                        inputParameters: [],
                        outputValue: ""
                    }]);
                }
            }

            DataChangeGridManager.refreshGridMode(globalSelf);
            CallMethodGridManager.refreshGridMode(globalSelf);

            if (globalSelf.addressSpaceBrowser?.onConnectionChange) {
                var connPayload = globalSelf.getConnectionPayload ? globalSelf.getConnectionPayload() : {
                    connectionId: connId,
                    connectionName: connName,
                    name: connName,
                    type: "OPCUA"
                };
                globalSelf.addressSpaceBrowser.onConnectionChange(connPayload);
            }
        },

        hideAllConfiguration: function (globalSelf) {
            globalSelf.$(".invokeopcua-config-controls, .invokeopcua-grids-section").hide();

            globalSelf.dataChangeOptions = [];
            globalSelf.callMethodOptions = [];

            globalSelf.model.setKey("connectionComboBox", "");
            globalSelf.model.setKey("connectionName", "");
            globalSelf.model.setKey("connectionId", "");
            globalSelf.model.setKey("connectionType", "");
            globalSelf.model.setKey("selectConnection", "");

            globalSelf.model.setKey("dataChangeWrite", []);
            globalSelf.model.setKey("callMethod", []);

            if (globalSelf.dataChangeWriteGrid?.widget?.dataSource) {
                globalSelf.dataChangeWriteGrid.widget.dataSource.data([]);
            }
            if (globalSelf.callMethodGrid?.widget?.dataSource) {
                globalSelf.callMethodGrid.widget.dataSource.data([]);
            }

            if (globalSelf.addressSpaceBrowser?.onConnectionChange) {
                globalSelf.addressSpaceBrowser.onConnectionChange(null);
            }
        },

        _showConnErrorTooltip: function (globalSelf, element, message) {
            if (!element || !element.length) {
                return;
            }
            element.addErrorHighlightClass("components-error-red-highlight");
            if (!message) {
                message = globalSelf.nls.InvalidConnection;
            }
            if (globalSelf.connErrorTooltip) {
                globalSelf.connErrorTooltip.destroy();
            }
            globalSelf.connErrorTooltip = uilayer.tooltip({
                elem: element,
                autoHide: true,
                showOn: "mouseenter",
                position: "bottom",
                show: function () {
                    this.popup?.wrapper?.addClass("component-error-tooltip-message");
                },
                content: function () {
                    return "<div>" + _.escape(message) + "</div>";
                }
            });
        },

        _hideConnErrorTooltip: function (globalSelf, element) {
            if (element && element.length) {
                element.removeClass("components-error-red-highlight");
            }
            if (globalSelf.connErrorTooltip) {
                globalSelf.connErrorTooltip.destroy();
                globalSelf.connErrorTooltip = null;
            }
        },

        onDestroy: function (globalSelf) {
            if (globalSelf.connErrorTooltip) {
                globalSelf.connErrorTooltip.destroy();
                globalSelf.connErrorTooltip = null;
            }
            if (globalSelf.connectionComboBox?.destroy) {
                globalSelf.connectionComboBox.destroy();
                globalSelf.connectionComboBox = null;
            }
        }
    };

    return ConnectionManager;
});
