/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    let uilayer = require("uilayer"),
        _ = require("underscore"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility,
        model = require("./model/DeviceConnectorConnComponentModel"),
        template = require("tpl!./template/DeviceConnectorConnComponentTemplate"),
        nls = require("i18n!./nls/DeviceConnectorConnComponentNLS"),
        Constants = require("./constants/Constants"),
        ActivitiesUtility = require("Components/Activities/ActivitiesUtility/ActivitiesUtility");

    let DeviceConnectorConnComponent = MIUIComponentI.extend({
        model: model,
        template: template,
        nls: nls,

        events: {
            "click #refresh-connection-button": "_refreshConnection"
        },

        onInitialize: function onInitialize(options) {
            this.activityId = options.activityId;
            this.activityReqres = options.activityReqres;
            this.designerReqres = options.reqres;
            this.allowedConnectionTypes = options.allowedConnectionTypes || [];
            if (typeof this.allowedConnectionTypes === "string") {
                this.allowedConnectionTypes = [this.allowedConnectionTypes];
            }
            this.processModel = this.designerReqres ? this.designerReqres.request("getCurrentActiveEntityModelFromDataStore") : null;
            this.accessibleConnIds = [];
            this._resetValidationState();

            if (options.data) {
                this.setData(options.data);
            }
        },

        onRender: function onRender() {
            this._renderConnectionDropdown(Constants.fields.connectionComboBox);
            this._getDeviceConnectorInitialData(true);
        },

        setData: function setData(obj) {
            for (let key in obj) {
                if (key === Constants.fields.connectionComboBox) {
                    this.model.set(Constants.fields.connectionComboBox, obj[key]);
                }
            }
            if (this.connectionComboBox) {
                let selectedConn = this.model.get(Constants.fields.connectionComboBox);
                if (selectedConn) {
                    this.connectionComboBox.text(selectedConn);
                    this._validationConnectionPlugin(this.connectionComboBox.value());
                }
            }
        },

        getData: function getData() {
            if (this.connectionComboBox && this.connectionComboBox.text() === nls.messages.selectConnection) {
                this.model.set(Constants.fields.connectionComboBox, "");
            } else if (this.connectionComboBox) {
                this.model.set(Constants.fields.connectionComboBox, this.connectionComboBox.text());
            }
            return this.model.toJSON();
        },

        getSelectedConnection: function () {
            let connId = this.connectionComboBox ? this.connectionComboBox.value() : null;
            return ((connId && connId !== Constants.NO_CONN_ID) ? connId : null);
        },

        getConnectionData: function () {
            let connId = this.getSelectedConnection();
            let connItem = this._getSelectedConnectionItem();
            let connText = (this.connectionComboBox && this.connectionComboBox.text() !== nls.messages.selectConnection)
                ? this.connectionComboBox.text() : "";
            let connName = this.lastValidatedConnectionName || (connItem ? connItem.connectionName : "") || connText;
            let connType = this.lastValidatedConnectionType || (connItem ? connItem.connectionType : "") || "";
            return {
                connectionId: connId ? connId : "",
                connectionName: connName,
                connectionType: connType,
                pluginDisplayName: connItem ? (connItem.pluginDisplayName || "") : ""
            };
        },

        _getSelectedConnectionItem: function () {
            let connId = this.getSelectedConnection();
            if (!connId || !this.connectionComboBox || !this.connectionComboBox.dataSource) {
                return null;
            }
            let allItems = this.connectionComboBox.dataSource.data();
            for (let i = 0; i < allItems.length; i++) {
                let item = allItems[i];
                if (String(item.connectionId) === String(connId)) {
                    return item;
                }
            }
            return null;
        },

        getErrorMessage: function getErrorMessage() {
            let connId = this.getSelectedConnection();
            if (!connId) {
                return nls.messages.selectValidConnection;
            }
            if (this.lastValidationResult && !this.lastValidationResult.valid) {
                return this.lastValidationResult.message || nls.messages.invalidConnectionType;
            }
            return "";
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList || !errorObjectList.length) return;
            let element = this._getConnectionElement();
            let globalSelf = this;
            errorObjectList.forEach(function (errorObject) {
                let message = (errorObject && errorObject.message) ? errorObject.message : globalSelf.nls.messages.selectValidConnection;
                globalSelf._showConnErrorTooltip(element, message);
            });
        },

        _getConnectionElement: function () {
            let el = this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            return el.length ? el : this.$el.find("#connectionComboBox");
        },

        _getDeviceConnectorInitialData: function (initialFetch) {
            let globalSelf = this;
            let promise = AjaxUtility.commonAjaxRequest("GET", "componentservices/deviceconnector/getDeviceConnectorConnInitialData", null, "json");
            promise.done(function (data) {
                if (data && data.connIds) {
                    globalSelf.accessibleConnIds = data.connIds;
                }
                let currentVal = globalSelf.connectionComboBox ? globalSelf.connectionComboBox.value() : null;
                if (globalSelf._isValidConnectionId(currentVal)) {
                    if (initialFetch) {
                        globalSelf.trigger(Constants.EVENTS.INITIAL_CONNECTION_FETCH, {
                            connectionId: currentVal,
                            connectionName: globalSelf.connectionComboBox.text()
                        });
                    }
                    globalSelf._validationConnectionPlugin(currentVal);
                }
            });
        },

        _isValidConnectionId: function (connId) {
            return Boolean(connId && connId !== Constants.NO_CONN_ID && connId !== nls.messages.selectConnection && parseInt(connId, 10) > 0);
        },

        _resetValidationState: function () {
            this.lastValidatedConnectionId = null;
            this.lastValidatedConnectionName = null;
            this.lastValidatedConnectionType = null;
            this.lastValidationResult = null;
        },

        _renderConnectionDropdown: function (id) {
            let globalSelf = this;
            let connectionsDetails = [];
            let promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleDeviceConnectorConnections", null, "json", null, true);
            promise.done((connectionsData) => {
                connectionsDetails = connectionsData || [];
            });
            promise.fail((e) => {
                uilayer.notifier("error", window.app.reqres.request("getError", e).message);
            });

            let finalConnArr = [];
            let connectionVarDetails = [];
            if (this.processModel && ActivitiesUtility) {
                connectionVarDetails = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(this.processModel, this.activityId).data();
            }

            _.each(connectionVarDetails, function (item) {
                let flag = false;
                connectionsDetails.forEach(function (connection) {
                    if (String(connection.connectionId) === String(item.connectionId)) {
                        item.connectionColor = connection.connectionColor;
                        item.connectionType = connection.connectionType || "";
                        item.pluginDisplayName = connection.pluginDisplayName || "";
                        finalConnArr.push(item);
                        flag = true;
                    }
                });
                if (!flag) {
                    finalConnArr.push(item);
                }
            });

            connectionsDetails.forEach(function (connection) {
                let exists = finalConnArr.some(function (f) {
                    return String(f.connectionId) === String(connection.connectionId);
                });
                if (!exists) {
                    finalConnArr.push({
                        key: connection.connectionName,
                        connectionId: connection.connectionId,
                        connectionName: connection.connectionName,
                        connectionColor: connection.connectionColor,
                        connectionType: connection.connectionType || "",
                        pluginDisplayName: connection.pluginDisplayName || ""
                    });
                }
            });

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
                optionLabel: nls.messages.selectConnection,
                select: function (e) {
                    if (!e.dataItem || !e.dataItem.connectionId) {
                        e.preventDefault();
                    }
                },
                change: function () {
                    globalSelf._validationConnectionPlugin(this.value());
                }
            });

            let selectedConn = globalSelf.model.get(Constants.fields.connectionComboBox);
            if (selectedConn) {
                globalSelf.connectionComboBox.text(selectedConn);
            }
        },

        _validationConnectionPlugin: function (connId) {
            let globalSelf = this;
            let element = globalSelf._getConnectionElement();

            if (!globalSelf._isValidConnectionId(connId)) {
                let invalidMsg = nls.messages.selectValidConnection;
                globalSelf._showConnErrorTooltip(element, invalidMsg);
                globalSelf.model.set(Constants.fields.connectionComboBox, "");
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                    connectionId: connId,
                    message: invalidMsg
                });
                return;
            }

            let allowedTypes = globalSelf.allowedConnectionTypes || [];
            let promise = AjaxUtility.commonAjaxRequest(
                "POST",
                "componentservices/deviceconnector/validateConnection?connId=" + connId,
                JSON.stringify(allowedTypes),
                "json"
            );

            promise.done(function (validationResult) {
                if (validationResult && validationResult.valid) {
                    globalSelf._hideConnErrorTooltip(element);
                    globalSelf._handleConnectionSuccess(connId, validationResult);
                } else {
                    let message = (validationResult && validationResult.message) ? validationResult.message : nls.messages.invalidConnectionType;
                    globalSelf._handleConnectionFailure(connId, message, validationResult);
                }
            });

            promise.fail(function (e) {
                let errMessage = window.app.reqres.request("getError", e).message || nls.messages.validationFailed;
                globalSelf._handleConnectionFailure(connId, errMessage, null);
            });
        },

        _handleConnectionFailure: function (connId, message, validationResult) {
            let el = this._getConnectionElement();
            if (message) {
                uilayer.notifier("error", message);
                this._showConnErrorTooltip(el, message);
            }
            this.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED, {
                connectionId: connId,
                message: message,
                validationResult: validationResult
            });
            if (this.connectionComboBox) {
                this.connectionComboBox.value("");
            }
            this.model.set(Constants.fields.connectionComboBox, "");
            this._resetValidationState();
            if (validationResult) {
                this.lastValidationResult = validationResult;
            }
        },

        _handleConnectionSuccess: function (connId, validationResult) {
            let element = this._getConnectionElement();
            this._hideConnErrorTooltip(element);

            let connText = (validationResult && validationResult.connectionName) ? validationResult.connectionName : this.connectionComboBox.text();
            let connType = (validationResult && validationResult.connectionType) ? validationResult.connectionType : "";

            this.lastValidatedConnectionId = connId;
            this.lastValidatedConnectionName = connText;
            this.lastValidatedConnectionType = connType;
            this.lastValidationResult = validationResult;

            this.model.set(Constants.fields.connectionComboBox, connText);

            let connItem = this._getSelectedConnectionItem();
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
            let globalSelf = this;
            let connectionsDetails = [];
            let promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleDeviceConnectorConnections", null, "json", null, true);
            promise.done(function (connectionsData) {
                connectionsDetails = connectionsData || [];
            });
            promise.fail(function (e) {
                uilayer.notifier("error", window.app.reqres.request("getError", e).message);
            });

            let finalConnArr = [];
            let connectionVarDetails = [];
            if (this.processModel && ActivitiesUtility) {
                connectionVarDetails = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(this.processModel, this.activityId).data();
            }

            _.each(connectionVarDetails, function (item) {
                let flag = false;
                connectionsDetails.forEach(function (connection) {
                    if (String(connection.connectionId) === String(item.connectionId)) {
                        item.connectionColor = connection.connectionColor;
                        item.connectionType = connection.connectionType || "";
                        item.pluginDisplayName = connection.pluginDisplayName || "";
                        finalConnArr.push(item);
                        flag = true;
                    }
                });
                if (!flag) {
                    finalConnArr.push(item);
                }
            });

            connectionsDetails.forEach(function (connection) {
                let exists = finalConnArr.some(function (f) {
                    return String(f.connectionId) === String(connection.connectionId);
                });
                if (!exists) {
                    finalConnArr.push({
                        key: connection.connectionName,
                        connectionId: connection.connectionId,
                        connectionName: connection.connectionName,
                        connectionColor: connection.connectionColor,
                        connectionType: connection.connectionType || "",
                        pluginDisplayName: connection.pluginDisplayName || ""
                    });
                }
            });

            this.connectionComboBox.setDataSource(finalConnArr);
            this._getDeviceConnectorInitialData(false);

            let connId = this.connectionComboBox.value();
            if (globalSelf._isValidConnectionId(connId)) {
                globalSelf._validationConnectionPlugin(connId);
                this.trigger(Constants.EVENTS.REFRESH_CONNECTION, {
                    connectionId: connId,
                    connectionName: globalSelf.connectionComboBox.text(),
                    connectionData: globalSelf.getConnectionData()
                });
                uilayer.notifier("success", nls.messages.connectionsRefreshed);
            } else {
                uilayer.notifier("warning", nls.messages.selectValidConnection);
            }
        },

        _showConnErrorTooltip: function (element, message) {
            element.addErrorHighlightClass("components-error-red-highlight");
            if (this.connErrorTooltip) {
                this.connErrorTooltip.destroy();
            }
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
            let element = this._getConnectionElement();
            if (element && element.length) {
                this._hideConnErrorTooltip(element);
            }
            this.activityId = null;
            this.activityReqres = null;
            this.designerReqres = null;
            this.processModel = null;
            this.allowedConnectionTypes = null;
            this.accessibleConnIds = null;
            this._resetValidationState();
            if (this.connectionComboBox) {
                this.connectionComboBox.destroy();
                this.connectionComboBox = null;
            }
        }
    });

    return DeviceConnectorConnComponent;
});
