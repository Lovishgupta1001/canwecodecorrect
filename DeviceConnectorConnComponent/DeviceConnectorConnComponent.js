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
            this.accessibleConnIds = [];
            this.lastValidatedConnectionId = null;
            this.lastValidatedConnectionName = null;
            this.lastValidatedConnectionType = null;
            this.lastValidationResult = null;
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
            this._getDeviceConnectorInitialData(true);
        },

        _getDeviceConnectorInitialData: function (initialFetch) {
            var globalSelf = this;
            var promise = AjaxUtility.commonAjaxRequest("GET", "componentservices/deviceconnector/getDeviceConnectorConnInitialData", null, "json");
            if (promise && promise.done) {
                promise.done(function (data) {
                    if (data && data.connIds) {
                        globalSelf.accessibleConnIds = data.connIds;
                    }
                    var currentVal = globalSelf.connectionComboBox ? globalSelf.connectionComboBox.value() : null;
                    if (currentVal && currentVal !== Constants.NO_CONN_ID && currentVal !== "Select Connection" && parseInt(currentVal, 10) > 0) {
                        if (initialFetch) {
                            globalSelf.trigger(Constants.EVENTS.INITIAL_CONNECTION_FETCH, {
                                connectionId: currentVal,
                                connectionName: globalSelf.connectionComboBox.text(),
                                connectionData: globalSelf.getConnectionData()
                            });
                        }
                        globalSelf._validationConnectionPlugin(currentVal);
                    }
                });
            }
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
                if (currentVal && currentVal !== Constants.NO_CONN_ID && currentVal !== "Select Connection" && parseInt(currentVal, 10) > 0) {
                    this._validationConnectionPlugin(currentVal);
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

            if (this.lastValidationResult && !this.lastValidationResult.valid) {
                connText = "";
            } else if (this.allowedConnectionTypes && this.allowedConnectionTypes.length) {
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
            var connName = this.lastValidatedConnectionName || (connItem ? connItem.connectionName : connText);
            var connType = this.lastValidatedConnectionType || (connItem ? connItem.connectionType : "");
            return {
                connectionId: connId ? connId : "",
                connectionName: connName,
                connectionType: connType,
                pluginDisplayName: connItem ? (connItem.pluginDisplayName ? connItem.pluginDisplayName : "") : ""
            };
        },

        getConnectionType: function () {
            if (this.lastValidatedConnectionType) {
                return this.lastValidatedConnectionType;
            }
            var connItem = this._getSelectedConnectionItem();
            return connItem ? connItem.connectionType : "";
        },

        getAccessibleConnectionIds: function () {
            return this.accessibleConnIds || [];
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
            if (this.lastValidationResult && !this.lastValidationResult.valid) {
                return this.lastValidationResult.message || ((nls.messages && nls.messages.invalidConnectionType) ? nls.messages.invalidConnectionType : "Selected connection is not allowed.");
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
            if (callback && connId && parseInt(connId, 10) > 0) {
                this._validationConnectionPlugin(connId, function (isValid, valResult) {
                    var res = valResult || {
                        valid: isValid,
                        connectionId: connId ? connId : "",
                        connectionName: connItem ? connItem.connectionName : "",
                        connectionType: connItem ? connItem.connectionType : "",
                        message: isValid ? "" : "Selected connection is not valid."
                    };
                    callback(res);
                });
                return;
            }
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
            if (!allConnections.length) {
                var allConnPromise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleConnections", null, "json", null, true);
                if (allConnPromise && allConnPromise.done) {
                    allConnPromise.done(function (connectionsData) {
                        if (connectionsData && Array.isArray(connectionsData)) {
                            allConnections = allConnections.concat(connectionsData);
                        }
                    });
                }
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
                        item.connectionType = connection.connectionType;
                        item.pluginDisplayName = connection.pluginDisplayName ? connection.pluginDisplayName : "";
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
                        connectionType: connection.connectionType,
                        pluginDisplayName: connection.pluginDisplayName ? connection.pluginDisplayName : ""
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
                    globalSelf._validationConnectionPlugin(this.value());
                }
            });

            var selectedConn = globalSelf.model.get(Constants.fields.connectionComboBox);

            if (selectedConn) {
                globalSelf.connectionComboBox.text(selectedConn);
            }
        },

        _validationConnectionPlugin: function (connId, callback) {
            var globalSelf = this;
            var element = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            if (!element.length) {
                element = globalSelf.$el.find("#connectionComboBox");
            }

            if (!connId || connId === Constants.NO_CONN_ID || connId === "Select Connection" || !parseInt(connId, 10)) {
                var invalidMsg = (nls.messages && nls.messages.selectValidConnection) ? nls.messages.selectValidConnection : "Select a valid connection.";
                globalSelf._showConnErrorTooltip(element, invalidMsg);
                globalSelf.model.set(Constants.fields.connectionComboBox, "");
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                    connectionId: connId,
                    message: invalidMsg
                });
                if (callback) {
                    callback(false, null);
                }
                return;
            }

            var allowedTypes = globalSelf.allowedConnectionTypes || [];
            var promise = AjaxUtility.commonAjaxRequest(
                "POST",
                "componentservices/deviceconnector/validateConnection?connId=" + connId,
                JSON.stringify(allowedTypes),
                "json"
            );

            if (promise && promise.done) {
                promise.done(function (validationResult) {
                    var el = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
                    if (!el.length) {
                        el = globalSelf.$el.find("#connectionComboBox");
                    }

                    if (validationResult && validationResult.valid) {
                        globalSelf._hideConnErrorTooltip(el);
                        globalSelf._handleConnectionSuccess(connId, validationResult);
                        if (callback) {
                            callback(true, validationResult);
                        }
                    } else {
                        var message = "";
                        if (validationResult && validationResult.message) {
                            message = validationResult.message;
                        } else {
                            message = (nls.messages && nls.messages.invalidConnectionType) ? nls.messages.invalidConnectionType : "Selected connection is not allowed.";
                        }
                        globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                            connectionId: connId,
                            message: message,
                            validationResult: validationResult
                        });
                        if (message) {
                            uilayer.notifier("error", message);
                        }
                        globalSelf._showConnErrorTooltip(el, message);
                        if (globalSelf.connectionComboBox) {
                            globalSelf.connectionComboBox.value("");
                        }
                        globalSelf.model.set(Constants.fields.connectionComboBox, "");
                        globalSelf.lastValidatedConnectionId = null;
                        globalSelf.lastValidatedConnectionName = null;
                        globalSelf.lastValidatedConnectionType = null;
                        globalSelf.lastValidationResult = validationResult;
                        if (callback) {
                            callback(false, validationResult);
                        }
                    }
                });

                if (promise.fail) {
                    promise.fail(function (e) {
                        var el = globalSelf.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
                        if (!el.length) {
                            el = globalSelf.$el.find("#connectionComboBox");
                        }
                        var errMessage = (e && e.responseText) ? e.responseText : "Failed to validate connection.";
                        if (window.app && window.app.reqres) {
                            var appErr = window.app.reqres.request("getError", e);
                            if (appErr && appErr.message) {
                                errMessage = appErr.message;
                            }
                        }
                        uilayer.notifier("error", errMessage);
                        globalSelf._showConnErrorTooltip(el, errMessage);
                        globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                            connectionId: connId,
                            message: errMessage
                        });
                        if (globalSelf.connectionComboBox) {
                            globalSelf.connectionComboBox.value("");
                        }
                        globalSelf.model.set(Constants.fields.connectionComboBox, "");
                        if (callback) {
                            callback(false, null);
                        }
                    });
                }
            }
        },

        _handleConnectionSuccess: function (connId, validationResult) {
            var element = this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            if (!element.length) {
                element = this.$el.find("#connectionComboBox");
            }
            this._hideConnErrorTooltip(element);

            var connText = "";
            if (validationResult && validationResult.connectionName) {
                connText = validationResult.connectionName;
            } else if (this.connectionComboBox) {
                connText = this.connectionComboBox.text();
            }

            var connType = "";
            if (validationResult && validationResult.connectionType) {
                connType = validationResult.connectionType;
            }

            this.lastValidatedConnectionId = connId;
            this.lastValidatedConnectionName = connText;
            this.lastValidatedConnectionType = connType;
            this.lastValidationResult = validationResult;

            this.model.set(Constants.fields.connectionComboBox, connText);

            var connItem = this._getSelectedConnectionItem();
            this.trigger(Constants.EVENTS.CHANGE_CONNECTION_VARIABLE, {
                connectionId: connId,
                connectionName: connText,
                connectionType: connType,
                connectionItem: connItem,
                validationResult: validationResult
            });
        },

        _refreshConnection: function () {
            var globalSelf = this;
            var finalConnArr = this._buildFinalConnectionArray();

            if (this.connectionComboBox) {
                this.connectionComboBox.setDataSource(finalConnArr);
                this._getDeviceConnectorInitialData(false);

                var connId = this.connectionComboBox.value();
                if (connId && connId !== Constants.NO_CONN_ID && connId !== "Select Connection" && parseInt(connId, 10) > 0) {
                    this._validationConnectionPlugin(connId, function (isValid, validationResult) {
                        if (isValid) {
                            globalSelf.trigger(Constants.EVENTS.REFRESH_CONNECTION, {
                                connectionId: connId,
                                connectionName: globalSelf.connectionComboBox.text(),
                                connectionData: globalSelf.getConnectionData(),
                                validationResult: validationResult
                            });
                            uilayer.notifier("success", (nls.messages && nls.messages.connectionsRefreshed) ? nls.messages.connectionsRefreshed : "Connections refreshed successfully.");
                        }
                    });
                } else {
                    uilayer.notifier("warning", (nls.messages && nls.messages.selectValidConnection) ? nls.messages.selectValidConnection : "Select a valid connection.");
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
            this.accessibleConnIds = null;
            this.lastValidatedConnectionId = null;
            this.lastValidatedConnectionName = null;
            this.lastValidatedConnectionType = null;
            this.lastValidationResult = null;
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
