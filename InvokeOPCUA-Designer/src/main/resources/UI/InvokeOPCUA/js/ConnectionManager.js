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
                        connectionType: conn.connectionType || conn.type || conn.transportType || "",
                        pluginType: conn.pluginType || conn.pluginDisplayName || conn.pluginName || "",
                        pluginDisplayName: conn.pluginDisplayName || conn.pluginType || conn.pluginName || "",
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
                            connectionType: item.connectionType || item.type || "",
                            pluginType: item.pluginType || item.pluginDisplayName || item.pluginName || "",
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
                globalSelf.model.getKey("connectionId") ||
                (globalSelf.initialData && (globalSelf.initialData.connectionComboBox || globalSelf.initialData.selectConnection || globalSelf.initialData.connectionName || globalSelf.initialData.connectionId));

            if (selectedConn) {
                var matchItem = finalConnArr.find(function (item) {
                    return String(item.connectionId) === String(selectedConn) ||
                        String(item.connectionName) === String(selectedConn) ||
                        String(item.key) === String(selectedConn);
                });

                if (matchItem) {
                    globalSelf.connectionComboBox.value(matchItem.connectionId);
                    manager._validateAndHandleConnection(matchItem.connectionId, globalSelf, true);
                } else {
                    globalSelf.connectionComboBox.value(selectedConn);
                    var currentVal = globalSelf.connectionComboBox.value();
                    if (currentVal) {
                        manager._validateAndHandleConnection(currentVal, globalSelf, true);
                    }
                }
            }
        },

        refreshConnection: function (globalSelf) {
            var manager = this;
            var finalConnArr = manager._buildFinalConnectionArray(globalSelf);

            if (globalSelf.connectionComboBox) {
                var prevVal = globalSelf.connectionComboBox.value();
                var prevText = globalSelf.connectionComboBox.text();

                globalSelf.connectionComboBox.setDataSource(finalConnArr);

                var matchItem = null;
                if (prevVal) {
                    matchItem = finalConnArr.find(function (item) {
                        return String(item.connectionId) === String(prevVal);
                    });
                }
                if (!matchItem && prevText && prevText !== globalSelf.nls.SelectConnection) {
                    matchItem = finalConnArr.find(function (item) {
                        return String(item.key) === String(prevText) || String(item.connectionName) === String(prevText);
                    });
                }

                if (matchItem) {
                    globalSelf.connectionComboBox.value(matchItem.connectionId);
                    if (globalSelf.addressSpaceBrowser) {
                        globalSelf.addressSpaceBrowser.lastFetchedConnId = null;
                        globalSelf.addressSpaceBrowser.allNodesMap = {};
                    }
                    manager._validateAndHandleConnection(matchItem.connectionId, globalSelf, false);
                    uilayer.notifier("success", globalSelf.nls.ConnectionsRefreshed);
                } else {
                    manager.hideAllConfiguration(globalSelf);
                    uilayer.notifier("warning", globalSelf.nls.SelectConnection || "Please select a connection.");
                }
            }
        },

        _isOpcUaConnection: function (connItem) {
            if (!connItem) return false;
            var raw = connItem.rawConnection || connItem;

            var pluginDisplayName = String(raw.pluginDisplayName || connItem.pluginDisplayName || "").toUpperCase();
            var pluginType = String(raw.pluginType || connItem.pluginType || "").toUpperCase();
            var connectionType = String(raw.connectionType || connItem.connectionType || raw.type || connItem.type || "").toUpperCase();
            var pluginName = String(raw.pluginName || connItem.pluginName || "").toUpperCase();
            var transportType = String(raw.transportType || raw.transportName || "").toUpperCase();
            var transportClass = String(raw.transportBeanClass || raw.transportClass || raw.className || "").toUpperCase();
            var connName = String(connItem.connectionName || connItem.key || raw.connectionName || raw.name || "").toUpperCase();

            // Explicitly disallow non-OPC UA connector types (Database, REST, Kafka, File, Salesforce, SAP, etc.)
            var nonOpcTypes = [
                "DATABASE", "RDBMS", "ORACLE", "MYSQL", "POSTGRES", "SQLSERVER", "SQL SERVER", "DB2",
                "KAFKA", "REST", "FILE", "FTP", "SFTP", "SALESFORCE", "SAP", "SOAP", "JMS", "AMQP", "RABBITMQ",
                "ACTIVEMQ", "EMAIL", "SMTP", "IMAP", "POP3", "HDFS", "HADOOP", "MONGODB", "CASSANDRA", "SOLR", "ELASTICSEARCH"
            ];

            for (var i = 0; i < nonOpcTypes.length; i++) {
                var t = nonOpcTypes[i];
                if (pluginDisplayName.indexOf(t) !== -1 ||
                    pluginType.indexOf(t) !== -1 ||
                    connectionType === t ||
                    connectionType.indexOf(t) !== -1 ||
                    pluginName.indexOf(t) !== -1) {
                    return false;
                }
            }

            // Positive OPC UA / Device Connector markers
            if (pluginDisplayName.indexOf("DEVICE CONNECTOR") !== -1 ||
                pluginDisplayName.indexOf("OPC") !== -1 ||
                pluginType.indexOf("DEVICE CONNECTOR") !== -1 ||
                pluginType.indexOf("OPC") !== -1 ||
                pluginName.indexOf("DEVICE CONNECTOR") !== -1 ||
                pluginName.indexOf("OPC") !== -1 ||
                transportType.indexOf("DEVICE CONNECTOR") !== -1 ||
                transportType.indexOf("OPC") !== -1 ||
                transportClass.indexOf("OPC") !== -1 ||
                transportClass.indexOf("DEVICECONNECTOR") !== -1 ||
                connectionType.indexOf("OPC") !== -1 ||
                connectionType === "DEVICE CONNECTOR" ||
                connectionType === "DEVICECONNECTOR") {
                return true;
            }

            // Fallback: connection name contains "OPC"
            if (connName.indexOf("OPC") !== -1) {
                return true;
            }

            return false;
        },

        _validateAndHandleConnection: function (connId, globalSelf, isInitial) {
            var manager = this;
            var element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap, .k-widget, .k-dropdown");
            if (!element.length) {
                element = globalSelf.$el.find("#connectionComboBox");
            }

            if (!connId || ((typeof connId === "string") && !parseInt(connId, 10))) {
                manager.hideAllConfiguration(globalSelf);
                if (connId && !isInitial) {
                    manager._showConnErrorTooltip(globalSelf, element, globalSelf.nls.InvalidConnection || globalSelf.nls.SelectConnection);
                }
                return;
            }

            var connItem = null;
            if (globalSelf.connectionComboBox && globalSelf.connectionComboBox.dataSource) {
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

        _getConnectionType: function (connItem) {
            return "OPCUA";
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
                        objectName: "",
                        inputParameters: [],
                        outputValue: ""
                    }]);
                }
            }

            DataChangeGridManager.refreshGridMode(globalSelf);
            CallMethodGridManager.refreshGridMode(globalSelf);

            if (globalSelf.addressSpaceBrowser && globalSelf.addressSpaceBrowser.prefetchAddressSpace) {
                var connPayload = globalSelf.getConnectionPayload ? globalSelf.getConnectionPayload() : {
                    connectionId: connId,
                    connectionName: connName,
                    name: connName,
                    type: "OPCUA",
                    connectionType: "OPCUA"
                };
                globalSelf.addressSpaceBrowser.prefetchAddressSpace(connPayload);
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

            if (globalSelf.dataChangeWriteGrid && globalSelf.dataChangeWriteGrid.widget && globalSelf.dataChangeWriteGrid.widget.dataSource) {
                globalSelf.dataChangeWriteGrid.widget.dataSource.data([]);
            }
            if (globalSelf.callMethodGrid && globalSelf.callMethodGrid.widget && globalSelf.callMethodGrid.widget.dataSource) {
                globalSelf.callMethodGrid.widget.dataSource.data([]);
            }
        },

        _showConnErrorTooltip: function (globalSelf, element, message) {
            if (!element || !element.length) {
                element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap, .k-widget, .k-dropdown");
            }
            if (!element || !element.length) {
                element = globalSelf.$el.find("#connectionComboBox");
            }
            if (!element || !element.length) {
                return;
            }
            element.addClass("components-error-red-highlight");
            if (typeof element.addErrorHighlightClass === "function") {
                element.addErrorHighlightClass("components-error-red-highlight");
            }
            if (!message) {
                message = globalSelf.nls.InvalidConnection || "Please select a valid OPC UA connection.";
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
            if (!element || !element.length) {
                element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap, .k-widget, .k-dropdown");
            }
            if (!element || !element.length) {
                element = globalSelf.$el.find("#connectionComboBox");
            }
            if (element && element.length) {
                element.removeClass("components-error-red-highlight");
                if (typeof element.removeErrorHighlightClass === "function") {
                    element.removeErrorHighlightClass("components-error-red-highlight");
                }
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
