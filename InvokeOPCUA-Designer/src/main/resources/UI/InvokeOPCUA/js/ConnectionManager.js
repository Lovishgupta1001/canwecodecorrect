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

        renderConnectionDropdown: function (globalSelf) {
            var manager = this;
            var connectionsDetails = [];

            var promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleConnections", null, "json", null, true);
            promise.done(function (connectionsData) {
                connectionsDetails = connectionsData || [];
            });
            promise.fail(function (e) {
                if (window.app?.reqres) {
                    uilayer.notifier("error", window.app.reqres.request("getError", e).message);
                }
            });

            var finalConnArr = [];
            var connectionVarDetails = [];
            if (globalSelf.processModel && ActivitiesUtility?.getConnectionAndRemainingVariableComponentDataSource) {
                connectionVarDetails = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(globalSelf.processModel, globalSelf.activityId).data();
            }

            _.each(connectionVarDetails, function (item) {
                var flag = false;
                connectionsDetails.forEach(function (connection) {
                    if (connection.connectionId === item.connectionId) {
                        item.connectionColor = connection.connectionColor;
                        item.connectionType = connection.connectionType || connection.type;
                        item.pluginType = connection.pluginType;
                        finalConnArr.push(item);
                        flag = true;
                    }
                });
                if (!flag) {
                    finalConnArr.push(item);
                }
            });

            globalSelf.connectionComboBox = uilayer.dropDownList({
                elem: globalSelf.$el.find("#connectionComboBox"),
                dataSource: finalConnArr,
                dataTextField: "key",
                dataValueField: "connectionId",
                template: function (item) {
                    return uilayer.templateFactory.get("connectionItem", {
                        color: item.connectionColor,
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
            var connectionsDetails = [];

            var promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleConnections", null, "json", null, true);
            promise.done(function (connectionsData) {
                connectionsDetails = connectionsData || [];
            });
            promise.fail(function (e) {
                if (window.app?.reqres) {
                    uilayer.notifier("error", window.app.reqres.request("getError", e).message);
                }
            });

            var finalConnArr = [];
            var connectionVarDetails = [];
            if (globalSelf.processModel && ActivitiesUtility?.getConnectionAndRemainingVariableComponentDataSource) {
                connectionVarDetails = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(globalSelf.processModel, globalSelf.activityId).data();
            }

            _.each(connectionVarDetails, function (item) {
                var flag = false;
                connectionsDetails.forEach(function (connection) {
                    if (connection.connectionId === item.connectionId) {
                        item.connectionColor = connection.connectionColor;
                        item.connectionType = connection.connectionType || connection.type;
                        item.pluginType = connection.pluginType;
                        finalConnArr.push(item);
                        flag = true;
                    }
                });
                if (!flag) {
                    finalConnArr.push(item);
                }
            });

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
            var element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");

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

            var connType = manager._getConnectionType(connItem);

            if (connType === "OPCUA") {
                manager._hideConnErrorTooltip(globalSelf, element);
                manager.showOpcUaConfiguration(globalSelf, connItem, connId, isInitial);
            } else {
                manager.hideAllConfiguration(globalSelf);
                manager._showConnErrorTooltip(globalSelf, element, globalSelf.nls.InvalidOPCUAConnection || globalSelf.nls.InvalidConnection);
                if (!isInitial) {
                    uilayer.notifier("error", globalSelf.nls.InvalidOPCUAConnection || globalSelf.nls.InvalidConnection);
                }
                if (globalSelf.connectionComboBox) {
                    globalSelf.connectionComboBox.value("");
                }
            }
        },

        _getConnectionType: function (connItem) {
            if (!connItem) {
                return "OPCUA";
            }

            var typeStr = (connItem.connectionType || connItem.pluginType || connItem.type || connItem.pluginName || "").toUpperCase();
            if (!typeStr) {
                return "OPCUA";
            }

            if (typeStr.indexOf("OPC") !== -1 || typeStr.indexOf("OPCUA") !== -1 || typeStr.indexOf("OPC UA") !== -1) {
                return "OPCUA";
            }

            return "";
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
                        objectNodeId: "",
                        inputParameters: [],
                        outputValue: ""
                    }]);
                }
            }

            DataChangeGridManager.refreshGridMode(globalSelf);
            CallMethodGridManager.refreshGridMode(globalSelf);
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
