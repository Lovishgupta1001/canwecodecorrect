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
        nls = require("i18n!./nls/DeviceConnectorConnComponentNLS"),
        Constants = require("./constants/Constants");

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
            this.activityId = options.activityId;
            this.activityReqres = options.activityReqres;
            this.designerReqres = options.reqres;
            this.processModel = this.designerReqres ? this.designerReqres.request("getCurrentActiveEntityModelFromDataStore") : null;
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
                var data = (this.model && this.model.toJSON) ? this.model.toJSON() : {};
                var renderedHtml = this.template;
                if (renderedHtml.call) {
                    renderedHtml = renderedHtml(data);
                }
                this.$el.html(renderedHtml);
            }
            this.onRender();
            return this;
        },

        onRender: function () {
            this._renderConnectionDropdown(Constants.fields.connectionComboBox);
        },

        highlightErrors: function (errorObjectList) {
            if (!errorObjectList?.length) return;
            var element = this.$el.find("#connectionComboBox").parent().find(".k-input, .k-dropdown-wrap");
            if (!element.length) {
                element = this.$el.find("#connectionComboBox");
            }
            errorObjectList.forEach(function (errorObject) {
                if (!errorObject) return;
                var message = errorObject.message || nls.messages.selectValidConnection || "Select a valid connection.";
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

            var selectedConn = obj.connectionComboBox || obj.selectConnection || obj.connectionName || obj.connectionId;
            if (selectedConn && this.connectionComboBox) {
                this.connectionComboBox.text(selectedConn);
                var currentVal = this.connectionComboBox.value();
                if (!currentVal) {
                    this.connectionComboBox.value(selectedConn);
                    currentVal = this.connectionComboBox.value();
                }
                if (currentVal && currentVal !== Constants.NO_CONN_ID && currentVal !== "Select Connection") {
                    this._handleConnectionChange(currentVal);
                }
            }
        },

        getData: function () {
            var connText = "";
            if (this.connectionComboBox) {
                var rawText = this.connectionComboBox.text();
                if (rawText && rawText !== nls.messages.selectConnection && rawText !== "Select Connection") {
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
            return (connId && connId !== Constants.NO_CONN_ID && connId !== "Select Connection") ? connId : null;
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
                        item.connectionType = connection.connectionType || connection.type || "";
                        item.pluginType = connection.pluginDisplayName || connection.pluginType || "";
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
                    return String(f.connectionId) === String(connection.connectionId != null ? connection.connectionId : connection.id);
                });
                if (!exists) {
                    finalConnArr.push({
                        key: connection.connectionName || connection.name || connection.key,
                        connectionId: connection.connectionId != null ? connection.connectionId : connection.id,
                        connectionName: connection.connectionName || connection.name || connection.key,
                        connectionColor: connection.connectionColor || "rgb(226, 0, 132)",
                        connectionType: connection.connectionType || connection.type || "",
                        pluginType: connection.pluginDisplayName || connection.pluginType || "",
                        rawConnection: connection
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
                optionLabel: nls.messages.selectConnection || "Select Connection",
                select: function (e) {
                    if (!(e.dataItem?.connectionId)) {
                        e.preventDefault();
                    }
                },
                change: function () {
                    globalSelf._handleConnectionChange(this.value());
                }
            });

            var selectedConn = globalSelf.model.get(Constants.fields.connectionComboBox) ||
                globalSelf.model.get("connectionName") ||
                globalSelf.model.get("selectConnection") ||
                globalSelf.model.get("connectionId");

            if (selectedConn) {
                globalSelf.connectionComboBox.text(selectedConn);
                var currentVal = globalSelf.connectionComboBox.value();
                if (!currentVal) {
                    globalSelf.connectionComboBox.value(selectedConn);
                    currentVal = globalSelf.connectionComboBox.value();
                }
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
                globalSelf.model.set("connectionType", "");
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED);
                return;
            }

            globalSelf._hideConnErrorTooltip(element);

            var connText = globalSelf.connectionComboBox ? globalSelf.connectionComboBox.text() : "";
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

            var connName = connItem?.connectionName || connItem?.key || connText;
            var connType = connItem?.connectionType || connItem?.type || connItem?.pluginType || "";

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
            var element = this.$el?.find("#connectionComboBox")?.parent()?.find(".k-input, .k-dropdown-wrap");
            if (element?.length) {
                this._hideConnErrorTooltip(element);
            }
            this.activityId = null;
            this.designerReqres = null;
            this.processModel = null;
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
    if (window.MIUIComponent && !window.MIUIComponent.DeviceConnectorConnComponent) {
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
