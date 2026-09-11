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
    var ActivitiesUtility = window.require?.defined?.(actUtilModule)
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
            this.activityId = options?.activityId || null;
            this.activityReqres = options?.activityReqres || null;
            this.designerReqres = options?.reqres || null;
            this.allowedConnectionTypes = null;
            if (options?.allowedConnectionTypes) {
                this.allowedConnectionTypes = Array.isArray(options.allowedConnectionTypes)
                    ? options.allowedConnectionTypes
                    : [options.allowedConnectionTypes];
            }
            this.processModel = this.designerReqres?.request?.("getCurrentActiveEntityModelFromDataStore") || null;
            if (!this.model?.set) {
                this.model = new model();
            }
            if (options?.data) {
                for (var key in options.data) {
                    if (Object.prototype.hasOwnProperty.call(options.data, key)) {
                        this.model.set(key, options.data[key]);
                    }
                }
            }
            this.accessibleConnIds = [];
            this._resetValidationState();
        },

        render: function () {
            if (this.template) {
                var data = this.model?.toJSON?.() || this.model || {};
                data.nls = this.nls || {};
                var renderedHtml = this.template?.call ? this.template(data) : this.template;
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
            promise?.done?.(function (data) {
                if (data?.connIds) {
                    globalSelf.accessibleConnIds = data.connIds;
                }
                var currentVal = globalSelf.connectionComboBox?.value?.();
                if (globalSelf._isValidConnectionId(currentVal)) {
                    if (initialFetch) {
                        globalSelf.trigger(Constants.EVENTS.INITIAL_CONNECTION_FETCH, {
                            connectionId: currentVal,
                            connectionName: globalSelf.connectionComboBox?.text?.()
                        });
                    }
                    globalSelf._validationConnectionPlugin(currentVal);
                }
            });
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList?.length) return;
            var element = this._getConnectionElement();
            errorObjectList.forEach(function (errorObject) {
                if (!errorObject) return;
                var message = errorObject.message || this.nls?.messages?.selectValidConnection || "";
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
                var currentVal = this.connectionComboBox.value?.();
                if (this._isValidConnectionId(currentVal)) {
                    this._validationConnectionPlugin(currentVal);
                }
            }
        },

        getData: function () {
            var connText = "";
            if (this.connectionComboBox) {
                var rawText = this.connectionComboBox.text();
                if (rawText && rawText !== this.nls?.messages?.selectConnection) {
                    connText = rawText;
                }
            }

            if (this.lastValidationResult && !this.lastValidationResult.valid) {
                connText = "";
            } else if (this.allowedConnectionTypes?.length) {
                var connItem = this._getSelectedConnectionItem();
                if (!this.isConnectionAllowed(connItem)) {
                    connText = "";
                }
            }

            this.model.set(Constants.fields.connectionComboBox, connText);
            return this.model.toJSON();
        },

        getSelectedConnection: function () {
            var connId = this.connectionComboBox?.value?.();
            return (connId && connId !== Constants.NO_CONN_ID && connId !== this.nls?.messages?.selectConnection) ? connId : null;
        },

        _getSelectedConnectionItem: function () {
            var connId = this.getSelectedConnection();
            if (!connId || !this.connectionComboBox?.dataSource) {
                return null;
            }
            var allItems = this.connectionComboBox.dataSource.data();
            for (var i = 0; i < allItems.length; i++) {
                var item = allItems[i];
                if (String(item.connectionId) === String(connId)) {
                    return item.toJSON?.() || item;
                }
            }
            return null;
        },

        getConnectionData: function () {
            var connId = this.getSelectedConnection();
            var connItem = this._getSelectedConnectionItem();
            var connText = (this.connectionComboBox && this.connectionComboBox.text() !== this.nls?.messages?.selectConnection)
                ? this.connectionComboBox.text()
                : "";
            var connName = this.lastValidatedConnectionName || connItem?.connectionName || connText;
            var connType = this.lastValidatedConnectionType || connItem?.connectionType || "";
            return {
                connectionId: connId ? connId : "",
                connectionName: connName,
                connectionType: connType,
                pluginDisplayName: connItem?.pluginDisplayName || ""
            };
        },

        getConnectionType: function () {
            return this.lastValidatedConnectionType || this._getSelectedConnectionItem()?.connectionType || "";
        },

        getAccessibleConnectionIds: function () {
            return this.accessibleConnIds || [];
        },

        isConnectionAllowed: function (conn) {
            if (!this.allowedConnectionTypes?.length) {
                return true;
            }
            var connType = conn?.connectionType || this.lastValidatedConnectionType;
            if (!connType) {
                return false;
            }
            var upperConnType = String(connType).toUpperCase();
            var normalizedConnType = upperConnType.replace(/[^A-Z0-9]/g, "");

            return this.allowedConnectionTypes.some(function (allowed) {
                var allowedType = String(allowed).toUpperCase();
                return upperConnType === allowedType || normalizedConnType === allowedType.replace(/[^A-Z0-9]/g, "");
            });
        },

        getErrorMessage: function () {
            var connId = this.getSelectedConnection();
            if (!connId) {
                return this.nls?.messages?.selectValidConnection || "";
            }
            if (this.lastValidationResult && !this.lastValidationResult.valid) {
                return this.lastValidationResult.message || this.nls?.messages?.invalidConnectionType || "";
            }
            if (this.allowedConnectionTypes?.length && this.lastValidatedConnectionType) {
                var connItem = this._getSelectedConnectionItem();
                if (!this.isConnectionAllowed(connItem)) {
                    return this.nls?.messages?.invalidConnectionType || "";
                }
            }
            return "";
        },

        isValid: function () {
            return this.getErrorMessage() === "";
        },

        validate: function () {
            var errorMsg = this.getErrorMessage();
            var element = this._getConnectionElement();
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
            var globalSelf = this;
            if (callback && connId && parseInt(connId, 10) > 0) {
                this._validationConnectionPlugin(connId, function (isValid, valResult) {
                    var res = valResult || {
                        valid: isValid,
                        connectionId: connId ? connId : "",
                        connectionName: connItem?.connectionName || "",
                        connectionType: globalSelf.lastValidatedConnectionType || connItem?.connectionType || "",
                        message: isValid ? "" : (globalSelf.nls?.messages?.selectValidConnection || "")
                    };
                    callback?.(res);
                });
                return;
            }
            var errorMsg = this.getErrorMessage();
            var valid = errorMsg === "";
            var result = {
                valid: valid,
                connectionId: connId ? connId : "",
                connectionName: connItem?.connectionName || "",
                connectionType: this.lastValidatedConnectionType || connItem?.connectionType || "",
                message: errorMsg
            };
            callback?.(result);
            return result;
        },

        _fetchAccessibleConnectionsList: function () {
            var allConnections = [];
            var nonPluginPromise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleDeviceConnectorConnections", null, "json", null, true);
            nonPluginPromise?.done?.(function (connectionsData) {
                if (Array.isArray(connectionsData)) {
                    allConnections = connectionsData;
                }
            });
            return allConnections;
        },

        _buildFinalConnectionArray: function () {
            var connectionsDetails = this._fetchAccessibleConnectionsList();
            var finalConnArr = [];
            var connectionVarDetails = [];
            if (this.processModel && ActivitiesUtility?.getConnectionAndRemainingVariableComponentDataSource) {
                var ds = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(this.processModel, this.activityId);
                connectionVarDetails = ds?.data?.() || [];
            }

            _.each(connectionVarDetails, function (item) {
                var flag = false;
                connectionsDetails.forEach(function (connection) {
                    if (String(connection.connectionId) === String(item.connectionId)) {
                        item.connectionColor = connection.connectionColor;
                        item.connectionType = connection.connectionType || "";
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
                        connectionType: connection.connectionType || "",
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
                optionLabel: this.nls?.messages?.selectConnection || "",
                select: function (e) {
                    if (!e.dataItem?.connectionId) {
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

        _getConnectionElement: function () {
            var el = this.$el ? this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap") : null;
            return (el && el.length) ? el : (this.$el ? this.$el.find("#connectionComboBox") : null);
        },

        _isValidConnectionId: function (connId) {
            return Boolean(connId && connId !== Constants.NO_CONN_ID && connId !== this.nls?.messages?.selectConnection && parseInt(connId, 10) > 0);
        },

        _resetValidationState: function () {
            this.lastValidatedConnectionId = null;
            this.lastValidatedConnectionName = null;
            this.lastValidatedConnectionType = null;
            this.lastValidationResult = null;
        },

        _validationConnectionPlugin: function (connId, callback) {
            var globalSelf = this;
            var element = globalSelf._getConnectionElement();

            if (!globalSelf._isValidConnectionId(connId)) {
                var invalidMsg = this.nls?.messages?.selectValidConnection || "";
                globalSelf._showConnErrorTooltip(element, invalidMsg);
                globalSelf.model.set(Constants.fields.connectionComboBox, "");
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                    connectionId: connId,
                    message: invalidMsg
                });
                callback?.(false, null);
                return;
            }

            var allowedTypes = globalSelf.allowedConnectionTypes || [];
            var promise = AjaxUtility.commonAjaxRequest(
                "POST",
                "componentservices/deviceconnector/validateConnection?connId=" + connId,
                JSON.stringify(allowedTypes),
                "json"
            );

            promise?.done?.(function (validationResult) {
                if (validationResult?.valid) {
                    globalSelf._hideConnErrorTooltip(element);
                    globalSelf._handleConnectionSuccess(connId, validationResult);
                    callback?.(true, validationResult);
                } else {
                    var message = validationResult?.message || globalSelf.nls?.messages?.invalidConnectionType || "";
                    globalSelf._handleConnectionFailure(connId, message, validationResult, callback);
                }
            });

            promise?.fail?.(function (e) {
                var errMessage = window.app?.reqres?.request?.("getError", e)?.message || e?.responseText || globalSelf.nls?.messages?.validationFailed || "";
                globalSelf._handleConnectionFailure(connId, errMessage, null, callback);
            });
        },

        _handleConnectionFailure: function (connId, message, validationResult, callback) {
            var el = this._getConnectionElement();
            if (message) {
                uilayer.notifier("error", message);
                this._showConnErrorTooltip(el, message);
            }
            this.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                connectionId: connId,
                message: message,
                validationResult: validationResult
            });
            this.connectionComboBox?.value?.("");
            this.model.set(Constants.fields.connectionComboBox, "");
            this._resetValidationState();
            if (validationResult) {
                this.lastValidationResult = validationResult;
            }
            callback?.(false, validationResult || null);
        },

        _handleConnectionSuccess: function (connId, validationResult) {
            var element = this._getConnectionElement();
            this._hideConnErrorTooltip(element);

            var connText = validationResult?.connectionName || this.connectionComboBox?.text?.() || "";
            var connType = validationResult?.connectionType || "";

            this.lastValidatedConnectionId = connId;
            this.lastValidatedConnectionName = connText;
            this.lastValidatedConnectionType = connType;
            this.lastValidationResult = validationResult;

            this.model.set(Constants.fields.connectionComboBox, connText);

            var connItem = this._getSelectedConnectionItem();
            if (connItem) {
                connItem.connectionType = connType;
            }
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
                if (globalSelf._isValidConnectionId(connId)) {
                    this._validationConnectionPlugin(connId, function (isValid, validationResult) {
                        if (isValid) {
                            globalSelf.trigger(Constants.EVENTS.REFRESH_CONNECTION, {
                                connectionId: connId,
                                connectionName: globalSelf.connectionComboBox?.text?.(),
                                connectionData: globalSelf.getConnectionData(),
                                validationResult: validationResult
                            });
                            uilayer.notifier("success", globalSelf.nls?.messages?.connectionsRefreshed);
                        }
                    });
                } else {
                    uilayer.notifier("warning", globalSelf.nls?.messages?.selectValidConnection);
                }
            }
        },

        _showConnErrorTooltip: function (element, message) {
            element?.addErrorHighlightClass?.("components-error-red-highlight");
            this.connErrorTooltip?.destroy?.();
            this.connErrorTooltip = uilayer.tooltip({
                elem: element,
                autoHide: true,
                showOn: "mouseenter",
                position: "bottom",
                show: function () {
                    this.popup?.wrapper?.addClass("component-error-tooltip-message");
                },
                content: function () {
                    return "<div>" + message + "</div>";
                }
            });
        },

        _hideConnErrorTooltip: function (element) {
            element?.removeClass?.("components-error-red-highlight");
            this.connErrorTooltip?.destroy?.();
            this.connErrorTooltip = null;
        },

        onBeforeDestroy: function () {
            var element = this._getConnectionElement();
            if (element?.length) {
                this._hideConnErrorTooltip(element);
            }
            this.activityId = null;
            this.activityReqres = null;
            this.designerReqres = null;
            this.processModel = null;
            this.allowedConnectionTypes = null;
            this.accessibleConnIds = null;
            this._resetValidationState();
            this.connectionComboBox?.destroy?.();
            this.connectionComboBox = null;
        },

        destroy: function () {
            this.onBeforeDestroy();
            if (MIUIComponentI.prototype.destroy) {
                MIUIComponentI.prototype.destroy.call(this);
            } else if (Backbone?.View?.prototype?.remove) {
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
