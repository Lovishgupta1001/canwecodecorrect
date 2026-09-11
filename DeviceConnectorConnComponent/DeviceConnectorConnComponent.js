/**
* Created by Lovish.
*/
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility,
        model = require("./model/DeviceConnectorConnComponentModel"),
        template = require("tpl!./template/DeviceConnectorConnComponentTemplate"),
        nls = require("i18n!./nls/DeviceConnectorConnComponentNLS"),
        Constants = require("./constants/Constants");

    var actUtilModule = "Components/Activities/ActivitiesUtility/ActivitiesUtility";
    var ActivitiesUtility = (window.require && window.require.defined && window.require.defined(actUtilModule))
        ? window.require(actUtilModule)
        : null;

    var DeviceConnectorConnComponent = MIUIComponentI.extend({
        model: model,
        template: template,
        nls: nls,

        events: {
            "click #refresh-connection-button": "_refreshConnection"
        },

        initialize: function (options) {
            if (this.onInitialize && !this._initialized) {
                this._initialized = true;
                this.onInitialize(options || {});
            }
        },

        onInitialize: function (options) {
            this._initialized = true;
            this.activityId = options.activityId || null;
            this.activityReqres = options.activityReqres || null;
            this.designerReqres = options.reqres || null;
            this.allowedConnectionTypes = null;
            if (options.allowedConnectionTypes) {
                this.allowedConnectionTypes = Array.isArray(options.allowedConnectionTypes)
                    ? options.allowedConnectionTypes
                    : [options.allowedConnectionTypes];
            }
            this.processModel = (this.designerReqres && this.designerReqres.request)
                ? this.designerReqres.request("getCurrentActiveEntityModelFromDataStore")
                : null;
            if (!this.model || !this.model.set) {
                this.model = new model();
            }
            if (options.data) {
                for (var key in options.data) {
                    if (Object.prototype.hasOwnProperty.call(options.data, key)) {
                        this.model.set(key, options.data[key]);
                    }
                }
            }
        },

        render: function () {
            if (this.template) {
                var data = {};
                if (this.model) {
                    if (this.model.toJSON) {
                        data = this.model.toJSON();
                    } else {
                        data = this.model;
                    }
                }
                if (!data) {
                    data = {};
                }
                data.nls = this.nls || {};
                var renderedHtml = this.template;
                if (renderedHtml.call) {
                    renderedHtml = renderedHtml(data);
                }
                if (renderedHtml) {
                    this.$el.html(renderedHtml);
                }
            }
            this.onRender();
            return this;
        },

        onRender: function () {
            this._renderConnectionDropdown(Constants.fields.connectionComboBox);
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList || !errorObjectList.length) return;
            var element = this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            if (!element.length) {
                element = this.$el.find("#connectionComboBox");
            }
            errorObjectList.forEach(function (errorObject) {
                if (!errorObject) return;
                var message = errorObject.message || (nls.messages && nls.messages.selectValidConnection) || "Select a valid connection.";
                this._showConnErrorTooltip(element, message);
            }, this);
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

            var selectedConn = obj.connectionComboBox;
            if (selectedConn && this.connectionComboBox) {
                this.connectionComboBox.text(selectedConn);
                var currentVal = this.connectionComboBox.value();
                if (currentVal && currentVal !== Constants.NO_CONN_ID && currentVal !== "Select Connection") {
                    this._handleConnectionChange(currentVal);
                }
            }
        },

        getData: function () {
            var connText = "";
            if (this.connectionComboBox) {
                var rawText = this.connectionComboBox.text();
                if (rawText && rawText !== (nls.messages && nls.messages.selectConnection) && rawText !== "Select Connection") {
                    connText = rawText;
                }
            }

            if (this.allowedConnectionTypes && this.allowedConnectionTypes.length) {
                var connItem = this._getSelectedConnectionItem();
                if (!this.isConnectionAllowed(connItem)) {
                    connText = "";
                }
            }

            this.model.set(Constants.fields.connectionComboBox, connText);
            return this.model.toJSON();
        },

        getSelectedConnection: function () {
            var connId = this.connectionComboBox ? this.connectionComboBox.value() : null;
            return (connId && connId !== Constants.NO_CONN_ID && connId !== "Select Connection") ? connId : null;
        },

        _getSelectedConnectionItem: function () {
            var connId = this.getSelectedConnection();
            if (!connId || !this.connectionComboBox || !this.connectionComboBox.dataSource) {
                return null;
            }
            var allItems = this.connectionComboBox.dataSource.data();
            for (var i = 0; i < allItems.length; i++) {
                var item = allItems[i];
                if (String(item.connectionId) === String(connId)) {
                    return item.toJSON ? item.toJSON() : item;
                }
            }
            return null;
        },

        getConnectionData: function () {
            var connId = this.getSelectedConnection();
            var connItem = this._getSelectedConnectionItem();
            var connText = (this.connectionComboBox && this.connectionComboBox.text() !== (nls.messages && nls.messages.selectConnection))
                ? this.connectionComboBox.text()
                : "";
            return {
                connectionId: connId ? connId : "",
                connectionName: connItem ? connItem.connectionName : connText,
                connectionType: connItem ? connItem.connectionType : ""
            };
        },

        getConnectionType: function () {
            var connItem = this._getSelectedConnectionItem();
            return connItem ? connItem.connectionType : "";
        },

        isConnectionAllowed: function (conn) {
            if (!this.allowedConnectionTypes || !this.allowedConnectionTypes.length) {
                return true;
            }
            if (!conn || !conn.connectionType) {
                return false;
            }
            var connType = String(conn.connectionType).toUpperCase();
            var normalizedConnType = connType.replace(/[^A-Z0-9]/g, "");

            return this.allowedConnectionTypes.some(function (allowed) {
                var allowedType = String(allowed).toUpperCase();
                return connType === allowedType || normalizedConnType === allowedType.replace(/[^A-Z0-9]/g, "");
            });
        },

        getErrorMessage: function () {
            var connId = this.getSelectedConnection();
            if (!connId) {
                return (nls.messages && nls.messages.selectValidConnection) ? nls.messages.selectValidConnection : "Select a valid connection.";
            }
            if (this.allowedConnectionTypes && this.allowedConnectionTypes.length) {
                var connItem = this._getSelectedConnectionItem();
                if (!this.isConnectionAllowed(connItem)) {
                    var allowedStr = this.allowedConnectionTypes.join(", ");
                    return (nls.messages && nls.messages.invalidConnectionType)
                        ? (nls.messages.invalidConnectionType + " Only " + allowedStr + " connection(s) are supported.")
                        : ("Selected connection is not allowed. Only " + allowedStr + " connection(s) are supported.");
                }
            }
            return "";
        },

        isValid: function () {
            return this.getErrorMessage() === "";
        },

        validate: function () {
            var errorMsg = this.getErrorMessage();
            var element = this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            if (!element.length) {
                element = this.$el.find("#connectionComboBox");
            }
            if (errorMsg) {
                this._showConnErrorTooltip(element, errorMsg);
                return false;
            }
            this._hideConnErrorTooltip(element);
            return true;
        },

        validateConnection: function (callback) {
            var connId = this.getSelectedConnection();
            var connItem = this._getSelectedConnectionItem();
            var errorMsg = this.getErrorMessage();
            var valid = errorMsg === "";
            var result = {
                valid: valid,
                connectionId: connId ? connId : "",
                connectionName: connItem ? connItem.connectionName : "",
                connectionType: connItem ? connItem.connectionType : "",
                message: errorMsg
            };
            if (callback) {
                callback(result);
            }
            return result;
        },

        _fetchAccessibleConnectionsList: function () {
            var allConnections = [];
            var nonPluginPromise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleNonPluginConnections", null, "json", null, true);
            if (nonPluginPromise && nonPluginPromise.done) {
                nonPluginPromise.done(function (connectionsData) {
                    if (connectionsData && Array.isArray(connectionsData)) {
                        allConnections = allConnections.concat(connectionsData);
                    }
                });
            }
            return allConnections;
        },

        _buildFinalConnectionArray: function () {
            var connectionsDetails = this._fetchAccessibleConnectionsList();
            var finalConnArr = [];
            var connectionVarDetails = [];
            if (this.processModel && ActivitiesUtility && ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource) {
                var ds = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(this.processModel, this.activityId);
                connectionVarDetails = ds ? ds.data() : [];
            }

            _.each(connectionVarDetails, function (item) {
                var flag = false;
                connectionsDetails.forEach(function (connection) {
                    if (String(connection.connectionId) === String(item.connectionId)) {
                        item.connectionColor = connection.connectionColor;
                        item.connectionType = connection.connectionType || connection.pluginName || connection.pluginDisplayName || "";
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
                    return String(f.connectionId) === String(connection.connectionId);
                });
                if (!exists) {
                    finalConnArr.push({
                        key: connection.connectionName,
                        connectionId: connection.connectionId,
                        connectionName: connection.connectionName,
                        connectionColor: connection.connectionColor,
                        connectionType: connection.connectionType || connection.pluginName || connection.pluginDisplayName || ""
                    });
                }
            });

            return finalConnArr;
        },

        _renderConnectionDropdown: function (id) {
            var globalSelf = this;
            var finalConnArr = this._buildFinalConnectionArray();

            var inputElem = globalSelf.$el.find("#" + id);
            if (!inputElem.length) {
                inputElem = $("#" + id);
            }

            this.connectionComboBox = uilayer.dropDownList({
                elem: inputElem,
                dataSource: finalConnArr,
                dataTextField: "key",
                dataValueField: "connectionId",
                template: function (item) {
                    return uilayer.templateFactory.get("connectionItem", {
                        color: item.connectionColor,
                        text: item.key
                    });
                },
                optionLabel: (nls.messages && nls.messages.selectConnection) ? nls.messages.selectConnection : "Select Connection",
                select: function (e) {
                    if (!(e.dataItem && e.dataItem.connectionId)) {
                        e.preventDefault();
                    }
                },
                change: function () {
                    globalSelf._handleConnectionChange(this.value());
                }
            });

            var selectedConn = globalSelf.model.get(Constants.fields.connectionComboBox);

            if (selectedConn) {
                globalSelf.connectionComboBox.text(selectedConn);
                var currentVal = globalSelf.connectionComboBox.value();
                if (currentVal && currentVal !== Constants.NO_CONN_ID && currentVal !== "Select Connection") {
                    globalSelf._handleConnectionChange(currentVal);
                }
            }
        },

        _handleConnectionChange: function (connId) {
            var globalSelf = this;
            var element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            if (!element.length) {
                element = globalSelf.$el.find("#connectionComboBox");
            }

            if (!connId || connId === Constants.NO_CONN_ID || connId === "Select Connection") {
                globalSelf.model.set(Constants.fields.connectionComboBox, "");
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED);
                return;
            }

            var connText = globalSelf.connectionComboBox ? globalSelf.connectionComboBox.text() : "";
            var connItem = globalSelf._getSelectedConnectionItem();
            var connName = connItem ? connItem.connectionName : connText;
            var connType = connItem ? connItem.connectionType : "";

            if (globalSelf.allowedConnectionTypes && globalSelf.allowedConnectionTypes.length) {
                if (!globalSelf.isConnectionAllowed(connItem)) {
                    var allowedStr = globalSelf.allowedConnectionTypes.join(", ");
                    var errorMsg = "Selected connection '" + connName + "' is not allowed. Only " + allowedStr + " connection(s) are supported.";
                    globalSelf._showConnErrorTooltip(element, errorMsg);
                    globalSelf.model.set(Constants.fields.connectionComboBox, "");
                    globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                        connectionId: connId,
                        connectionName: connName,
                        connectionType: connType,
                        message: errorMsg
                    });
                    return;
                }
            }

            globalSelf._hideConnErrorTooltip(element);
            globalSelf.model.set(Constants.fields.connectionComboBox, connText);

            globalSelf.trigger(Constants.EVENTS.CHANGE_CONNECTION_VARIABLE, {
                connectionId: connId,
                connectionName: connName,
                connectionType: connType,
                connectionItem: connItem
            });
        },

        _refreshConnection: function () {
            var globalSelf = this;
            var finalConnArr = this._buildFinalConnectionArray();

            if (this.connectionComboBox) {
                this.connectionComboBox.setDataSource(finalConnArr);

                var connId = this.connectionComboBox.value();
                if (connId && connId !== Constants.NO_CONN_ID && connId !== "Select Connection") {
                    this._handleConnectionChange(connId);
                    this.trigger(Constants.EVENTS.REFRESH_CONNECTION, {
                        connectionId: connId,
                        connectionName: globalSelf.connectionComboBox.text(),
                        connectionData: globalSelf.getConnectionData()
                    });
                    uilayer.notifier("success", nls.messages.connectionsRefreshed || "Connections refreshed successfully.");
                } else {
                    uilayer.notifier("warning", nls.messages.selectValidConnection || "Select a valid connection.");
                }
            }
        },

        _showConnErrorTooltip: function (element, message) {
            element.addErrorHighlightClass("components-error-red-highlight");
            if (this.connErrorTooltip && this.connErrorTooltip.destroy) {
                this.connErrorTooltip.destroy();
            }
            this.connErrorTooltip = uilayer.tooltip({
                elem: element,
                autoHide: true,
                showOn: "mouseenter",
                position: "bottom",
                show: function () {
                    if (this.popup && this.popup.wrapper) {
                        this.popup.wrapper.addClass("component-error-tooltip-message");
                    }
                },
                content: function () {
                    return "<div>" + message + "</div>";
                }
            });
        },

        _hideConnErrorTooltip: function (element) {
            if (element) {
                element.removeClass("components-error-red-highlight");
            }
            if (this.connErrorTooltip) {
                if (this.connErrorTooltip.destroy) {
                    this.connErrorTooltip.destroy();
                }
                this.connErrorTooltip = null;
            }
        },

        onBeforeDestroy: function () {
            var element = this.$el ? this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap") : null;
            if (element && element.length) {
                this._hideConnErrorTooltip(element);
            }
            this.activityId = null;
            this.designerReqres = null;
            this.processModel = null;
            this.allowedConnectionTypes = null;
            if (this.connectionComboBox) {
                if (this.connectionComboBox.destroy) {
                    this.connectionComboBox.destroy();
                }
                this.connectionComboBox = null;
            }
        },

        destroy: function () {
            this.onBeforeDestroy();
            if (MIUIComponentI.prototype.destroy) {
                MIUIComponentI.prototype.destroy.call(this);
            } else if (Backbone.View.prototype.remove) {
                this.remove();
            }
        }
    });

    window.DeviceConnectorConnComponent = DeviceConnectorConnComponent;
    window.MIUIComponent = window.MIUIComponent || {};
    if (!window.MIUIComponent.DeviceConnectorConnComponent) {
        window.MIUIComponent.DeviceConnectorConnComponent = function (options) {
            var deferred = $.Deferred();
            var comp = new DeviceConnectorConnComponent(options);
            comp.render();
            deferred.resolve(comp);
            return deferred.promise();
        };
    }

    return DeviceConnectorConnComponent;
});
