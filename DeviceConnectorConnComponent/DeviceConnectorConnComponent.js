/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility,
        ActivitiesUtility = require("Components/Activities/ActivitiesUtility/ActivitiesUtility"),
        model = require("./model/DeviceConnectorConnComponentModel"),
        template = require("tpl!./template/DeviceConnectorConnComponentTemplate"),
        Constants = require("./constants/Constants");

    var DeviceConnectorConnComponent = MIUIComponentI.extend({
        model: model,
        template: template,
        nls: {},

        events: {
            "click #refresh-connection-button": "_refreshConnection"
        },

        onInitialize: function (options) {
            this.activityId = options.activityId;
            this.activityReqres = options.activityReqres;
            this.designerReqres = options.reqres;
            this.allowedTypes = options.allowedTypes || null;
            this.pluginType = options.pluginType || null;
            this.processModel = this.designerReqres ? this.designerReqres.request("getCurrentActiveEntityModelFromDataStore") : null;
            if (options.data) {
                for (var key in options.data) {
                    if (Object.prototype.hasOwnProperty.call(options.data, key)) {
                        this.model.set(key, options.data[key]);
                    }
                }
            }
        },

        onRender: function () {
            this._renderConnectionDropdown(Constants.fields.connectionComboBox);
        },

        setData: function (obj) {
            if (!obj) {
                return;
            }
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    this.model.set(key, obj[key]);
                }
            }

            var selectedConn = obj.connectionComboBox || obj.selectConnection || obj.connectionName;
            if (selectedConn && this.connectionComboBox) {
                this.connectionComboBox.text(selectedConn);
                var currentVal = this.connectionComboBox.value();
                if (currentVal) {
                    this._validateAndHandleConnection(currentVal, true);
                }
            }
        },

        getData: function () {
            var connText = "";
            if (this.connectionComboBox) {
                var rawText = this.connectionComboBox.text();
                if (rawText && rawText !== "Select Connection") {
                    connText = rawText;
                }
            }
            var connId = this.connectionComboBox ? this.connectionComboBox.value() : "";

            this.model.set(Constants.fields.connectionComboBox, connText);
            this.model.set("connectionName", connText);
            this.model.set("connectionId", connId);
            this.model.set("selectConnection", connText || connId);

            return this.model.toJSON();
        },

        getSelectedConnection: function () {
            var connId = this.connectionComboBox ? this.connectionComboBox.value() : null;
            return (connId && connId !== Constants.NO_CONN_ID) ? connId : null;
        },

        getConnectionData: function () {
            var connId = this.getSelectedConnection();
            var connText = this.connectionComboBox ? this.connectionComboBox.text() : "";
            var connType = this.getConnectionType();
            return {
                connectionId: connId,
                connectionName: connText,
                name: connText,
                type: connType,
                connectionType: connType,
                pluginType: this.model.get("pluginType") || ""
            };
        },

        getConnectionType: function () {
            return this.model.get("connectionType") || "";
        },

        getErrorMessage: function () {
            return "";
        },

        _renderConnectionDropdown: function (id) {
            var globalSelf = this;
            var connectionsDetails = [];

            var promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleNonPluginConnections", null, "json", null, true);
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
                    if (String(connection.connectionId) === String(item.connectionId)) {
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

            connectionsDetails.forEach(function (connection) {
                var exists = finalConnArr.some(function (f) {
                    return String(f.connectionId) === String(connection.connectionId !== undefined ? connection.connectionId : connection.id);
                });
                if (!exists) {
                    finalConnArr.push({
                        key: connection.connectionName || connection.name || connection.key,
                        connectionId: connection.connectionId !== undefined ? connection.connectionId : connection.id,
                        connectionName: connection.connectionName || connection.name || connection.key,
                        connectionColor: connection.connectionColor || "",
                        connectionType: connection.connectionType || connection.type || "",
                        pluginType: connection.pluginDisplayName || connection.pluginType || "",
                        rawConnection: connection
                    });
                }
            });

            if (globalSelf.pluginType || globalSelf.allowedTypes) {
                finalConnArr = finalConnArr.filter(function (item) {
                    var cType = globalSelf._resolveConnectionType(item);
                    return globalSelf._isConnectionAllowed(cType, item);
                });
            }

            this.connectionComboBox = uilayer.dropDownList({
                elem: globalSelf.$el.find("#" + id),
                dataSource: finalConnArr,
                dataTextField: "key",
                dataValueField: "connectionId",
                template: function (item) {
                    return uilayer.templateFactory.get("connectionItem", {
                        color: item.connectionColor,
                        text: item.key
                    });
                },
                optionLabel: "Select Connection",
                select: function (e) {
                    if (!(e.dataItem?.connectionId)) {
                        e.preventDefault();
                    }
                },
                change: function () {
                    globalSelf._validateAndHandleConnection(this.value(), false);
                }
            });

            var selectedConn = globalSelf.model.get(Constants.fields.connectionComboBox) ||
                globalSelf.model.get("connectionName") ||
                globalSelf.model.get("selectConnection");

            if (selectedConn) {
                globalSelf.connectionComboBox.text(selectedConn);
                var currentVal = globalSelf.connectionComboBox.value();
                if (currentVal) {
                    globalSelf._validateAndHandleConnection(currentVal, true);
                }
            }
        },

        _validateAndHandleConnection: function (connId, isInitial) {
            var globalSelf = this;
            var element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");

            if (!connId || ((typeof connId === "string") && !parseInt(connId, 10))) {
                globalSelf.model.set("connectionType", "");
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED);
                if (connId && !isInitial) {
                    globalSelf._showConnErrorTooltip(element, "Select a valid connection.");
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

            var connType = globalSelf._resolveConnectionType(connItem);
            var isAllowed = globalSelf._isConnectionAllowed(connType, connItem);

            if (isAllowed) {
                globalSelf._hideConnErrorTooltip(element);

                var connText = globalSelf.connectionComboBox ? globalSelf.connectionComboBox.text() : "";
                var connName = connItem?.connectionName || connItem?.key || connText;

                globalSelf.model.set(Constants.fields.connectionComboBox, connText);
                globalSelf.model.set("connectionName", connName);
                globalSelf.model.set("connectionId", connId);
                globalSelf.model.set("connectionType", connType);
                globalSelf.model.set("pluginType", connItem?.pluginType || "");
                globalSelf.model.set("selectConnection", connText || connId);

                globalSelf.trigger(Constants.EVENTS.CHANGE_CONNECTION_VARIABLE, {
                    connectionId: connId,
                    connectionName: connName,
                    connectionType: connType,
                    pluginType: connItem?.pluginType,
                    connectionItem: connItem,
                    isInitial: isInitial
                });
            } else {
                globalSelf.model.set("connectionType", "");
                globalSelf._showConnErrorTooltip(element, "Select a valid connection.");
                if (!isInitial) {
                    uilayer.notifier("error", "Select a valid connection.");
                }
                if (globalSelf.connectionComboBox) {
                    globalSelf.connectionComboBox.value("");
                }
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED);
            }
        },

        _isConnectionAllowed: function (connType, connItem) {
            var allowed = this.pluginType || this.allowedTypes;
            if (!allowed) {
                return true;
            }
            if (Array.isArray(allowed) && allowed.length === 0) {
                return true;
            }
            var allowedList = Array.isArray(allowed) ? allowed : [allowed];

            var typeUpper = (connType || "").toUpperCase();
            var pluginUpper = (connItem?.pluginType || connItem?.pluginDisplayName || "").toUpperCase();

            return allowedList.some(function (item) {
                if (!item) return false;
                var allowedName = (typeof item === "object" ? (item.pluginType || item.name || item.type || "") : String(item)).toUpperCase();
                if (!allowedName) return false;
                return typeUpper === allowedName ||
                    pluginUpper === allowedName ||
                    (typeUpper && typeUpper.indexOf(allowedName) !== -1) ||
                    (pluginUpper && pluginUpper.indexOf(allowedName) !== -1);
            });
        },

        _resolveConnectionType: function (connItem) {
            if (!connItem) {
                return "";
            }

            return connItem.connectionType || connItem.type || connItem.pluginType || connItem.pluginDisplayName || connItem.pluginName || "";
        },

        _refreshConnection: function () {
            var globalSelf = this;
            var connectionsDetails = [];

            var promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleNonPluginConnections", null, "json", null, true);
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
                    if (String(connection.connectionId) === String(item.connectionId)) {
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

            connectionsDetails.forEach(function (connection) {
                var exists = finalConnArr.some(function (f) {
                    return String(f.connectionId) === String(connection.connectionId !== undefined ? connection.connectionId : connection.id);
                });
                if (!exists) {
                    finalConnArr.push({
                        key: connection.connectionName || connection.name || connection.key,
                        connectionId: connection.connectionId !== undefined ? connection.connectionId : connection.id,
                        connectionName: connection.connectionName || connection.name || connection.key,
                        connectionColor: connection.connectionColor || "",
                        connectionType: connection.connectionType || connection.type || "",
                        pluginType: connection.pluginDisplayName || connection.pluginType || "",
                        rawConnection: connection
                    });
                }
            });

            if (globalSelf.pluginType || globalSelf.allowedTypes) {
                finalConnArr = finalConnArr.filter(function (item) {
                    var cType = globalSelf._resolveConnectionType(item);
                    return globalSelf._isConnectionAllowed(cType, item);
                });
            }

            if (this.connectionComboBox) {
                this.connectionComboBox.setDataSource(finalConnArr);

                var connId = this.connectionComboBox.value();
                if (parseInt(connId, 10) > 0) {
                    this._validateAndHandleConnection(connId, false);
                    this.trigger(Constants.EVENTS.REFRESH_CONNECTION, {
                        connectionId: connId,
                        connectionData: globalSelf.getConnectionData()
                    });
                    uilayer.notifier("success", "Connections refreshed successfully.");
                } else {
                    uilayer.notifier("warning", "Select a valid connection.");
                }
            }
        },

        _showConnErrorTooltip: function (element, message) {
            element.addErrorHighlightClass("components-error-red-highlight");
            this.connErrorTooltip = uilayer.tooltip({
                elem: element,
                autoHide: true,
                showOn: "mouseenter",
                position: "bottom",
                show: function () {
                    this.popup.wrapper.addClass("component-error-tooltip-message");
                },
                content: function () {
                    return "<div>" + message + "</div>";
                }
            });
        },

        _hideConnErrorTooltip: function (element) {
            element.removeClass("components-error-red-highlight");
            if (this.connErrorTooltip) {
                this.connErrorTooltip.destroy();
                this.connErrorTooltip = null;
            }
        },

        onBeforeDestroy: function () {
            var element = this.$el?.find("#connectionComboBox")?.parent()?.find(".k-input, .k-dropdown-wrap");
            if (element?.length) {
                this._hideConnErrorTooltip(element);
            }
            this.activityId = null;
            this.designerReqres = null;
            this.processModel = null;
            this.allowedTypes = null;
            this.pluginType = null;
            if (this.connectionComboBox) {
                this.connectionComboBox.destroy();
                this.connectionComboBox = null;
            }
        }
    });

    return DeviceConnectorConnComponent;
});
