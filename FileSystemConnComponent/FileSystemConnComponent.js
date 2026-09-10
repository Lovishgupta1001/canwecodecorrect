/** 
 * Created by Mishail 
 */ 
define(function (require) { 
    let uilayer = require("uilayer"), 
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility, 
        model = require("./model/FileSystemConnComponentModel"), 
        template = require("tpl!./template/FileSystemConnComponentTemplate"), 
        nls = require("i18n!./nls/FileSystemConnComponentNLS"), 
        Constants = require("./constants/Constants"), 
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"), 
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes, 
        ActivitiesUtility = require("Components/Activities/ActivitiesUtility/ActivitiesUtility"); 

    let FileSystemConnComponent = MIUIComponentI.extend({ 
        model: model, 
        template: template, 
        nls: nls, 
        events: { 
            "click #refresh-connection-button": "_refreshConnection", 
            "click #populate-relative-path": "_populateRelativePath" 
        }, 
        onInitialize: function onInitialize(options) { 
            this.activityId = options.activityId; 
            this.activityReqres = options.activityReqres; 
            this.designerReqres = options.reqres; 
            if(options.pluginType) 
                this.pluginType = options.pluginType; 
            else 
                this.pluginType = Constants.DEFAULT_PLUGIN_TYPE; 
            if(options.scheme) 
                this.scheme =options.scheme; 
            else 
                this.scheme=[]; 

            this.hideRelativePath = options.hideRelativePath; 
            this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore'); 
        }, 
        onRender: function onRender() { 
            this._initUilayerComponents(); 
            this._renderConnectionDropdown(Constants.fields.connectionComboBox); 
            this.relativePathExpBuilder = this._renderExpressionBuilder(Constants.fields.relativefilepath); 
            this._getConnectionBasePathMap(true); 
            this._showHideRelativePathButton(); 
            this._showHideRelativePath(); 
        }, 
        setData: function setData(obj) { 
            for (let key in obj) { 
                if (key === Constants.fields.connectionComboBox) { 
                    this.model.set(Constants.fields.connectionComboBox, obj[key]); 
                } else if (key === Constants.fields.relativefilepath) { 
                    this.model.set(Constants.fields.relativefilepath, obj[key]); 
                } 
            } 
            if (this.connectionComboBox) 
                this._setBasePath(); 
        }, 
        getData: function getData() { 
            if(this.connectionComboBox.text() === nls.messages.selectConnection) 
                this.model.set(Constants.fields.connectionComboBox, ""); 
            else 
                this.model.set(Constants.fields.connectionComboBox, this.connectionComboBox.text()); 
            this.model.set(Constants.fields.relativefilepath, ExpressionBuilderUtility.getExpression(this.relativePathExpBuilder)); 
            return this.model.toJSON(); 
        }, 
        getSelectedConnection: function () { 
            let connId =  this.connectionComboBox.value(); 
            return ((connId && connId!==Constants.NO_CONN_ID)? connId : null); 
        }, 
        getErrorMessage: function getErrorMessage() { 
        }, 
        _initUilayerComponents: function () { 
            uilayer.button({ 
                elem: this.$el.find('#populate-relative-path') 
            }); 
        }, 
        _getConnectionBasePathMap: function (initialFetch = false) { 
            let globalSelf = this; 
            let promise = AjaxUtility.commonAjaxRequest('GET', "componentservices/filesystem/getFileSystemConnInitialData", null, 'json'); 
            promise.done(function (data) { 
                globalSelf.connectionBasePathMap = data["connVsBaseFilePath"]; 
                globalSelf._setBasePath(); 
                if(parseInt(globalSelf.connectionComboBox.value()) > 0 && initialFetch) { 
                    globalSelf.trigger(Constants.EVENTS.INITIAL_CONNECTION_FETCH, { 
                        'connectionId': globalSelf.connectionComboBox.value(), 
                        'basePath': globalSelf.connectionBasePathMap[globalSelf.connectionComboBox.value()] 
                    }); 
                } 
            }); 
        }, 
        getConnectionBasePath: function (connId) { 
            return (this.connectionBasePathMap[connId]); 
        }, 
        _setBasePath: function () { 
            let basePath = this.connectionBasePathMap[this.connectionComboBox.value()]; 
            this.$el.find('#' + Constants.fields.baseFilePath).text(basePath); 
        }, 
        setBasePathByConnection: function (connId) { 
            let basePath = this.connectionBasePathMap[connId]; 
            if(basePath) 
                this.$el.find('#' + Constants.fields.baseFilePath).text(basePath); 
        }, 
        clearBasePath: function () { 
            this.$el.find('#' + Constants.fields.baseFilePath).text(""); 
        }, 
        _setRelativePath: function (value) { 
            ExpressionBuilderUtility.setValueOnExpressionBuilder(this.relativePathExpBuilder, value); 
        }, 

        _renderConnectionDropdown: function (id) { 
            let globalSelf = this; 
            let connectionsDetails = []; 
            let promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleConnections", null, "json", null, true); 
            promise.done((connectionsData) => { 
                connectionsDetails = connectionsData; 
            }); 
            promise.fail((e) => { 
                uilayer.notifier("error", window.app.reqres.request("getError", e).message); 
            }); 
            let finalConnArr = []; 
            let connectionVarDetails = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(this.processModel, this.activityId).data(); 

            _.each(connectionVarDetails, function(item) { 
                let flag = false; 
                connectionsDetails.forEach(function(connection) { 
                    if (connection.connectionId == item.connectionId) { 
                        item.connectionColor = connection.connectionColor; 
                        finalConnArr.push(item); 
                        flag = true; 
                    } 

                }); 
                if (!flag) { 
                    finalConnArr.push(item); 
                } 
            }); 
            this.connectionComboBox = uilayer.dropDownList({ 
                elem: globalSelf.$el.find('#' + id), 
                dataSource: finalConnArr, 
                dataTextField: "key", 
                dataValueField: "connectionId", 
                template: function(item) { 
                    return uilayer.templateFactory.get("connectionItem", { 
                        color: item.connectionColor, 
                        text: item.key 
                    }); 
                }, 
                optionLabel: nls.messages.selectConnection, 
                select: function (e) { 
                    if (!(e.dataItem.connectionId)) 
                        e.preventDefault(); 
                }, 
                change: function () { 
                    globalSelf._validationConnectionPlugin(this.value()); 
                } 
            }); 
            let selectedConn = globalSelf.model.get(Constants.fields.connectionComboBox); 
            if(selectedConn) { 
                globalSelf.connectionComboBox.text(selectedConn); 
            } 
        }, 

        _handleConnectionChange: function () { 
            this.trigger(Constants.EVENTS.CHANGE_CONNECTION_VARIABLE, { 
                'connectionId': this.connectionComboBox.value(), 
                'basePath': this.connectionBasePathMap[this.connectionComboBox.value()] 
            }); 
            this._setBasePath(); 
        }, 
        getPluginValidMessage: function (validationResult){ 
            let pluginMessage = ""; 
            const classExists = this.pluginClassBelongsToFamily( 
                validationResult.pluginClass, 
                this.pluginType 
            ); 

            if (classExists) { 
                pluginMessage = nls.messages.remotePluginConnection; 
            } else { 
                const uniquePluginNames = [...new Set(this.pluginType.map(p => p.pluginName))]; 
                const allPluginNames = this.joinWithOr(uniquePluginNames); 
                pluginMessage = nls.messages.selectPluginConnectionMessage 
                    .replace("{plugin}", allPluginNames); 
            } 
            return pluginMessage; 
        }, 
        getSchemaValidMessage: function(validationResult){ 
            let schemaMessage = ""; 
            const pluginDef = this.pluginType.find(p => 
                p.pluginClasses.some(cls => 
                    validationResult.pluginClass.includes( 
                        cls.split('.').pop().replace("Plugin", "") 
                    ) 
                ) 
            ); 

            let schemes = pluginDef?.scheme || []; 
            schemes = Array.isArray(schemes) ? schemes : [schemes]; 

            const displaySchemes = schemes.map(scheme => { 
                if (scheme?.toLowerCase() === "azureblobstorage") { 
                    return nls.messages.azureBlobStorage; 
                } 
                return scheme; 
            }); 

            if (displaySchemes.length === 1) { 
                schemaMessage = 
                    nls.messages.selectCorrectPluginScheme + 
                    displaySchemes[0] + 
                    "."; 
            } else { 
                schemaMessage = 
                    nls.messages.selectCorrectPluginSchemes + 
                    displaySchemes.join(", ") + 
                    "."; 
            } 
            return schemaMessage; 
        }, 
        joinWithOr: function(arr) { 
            if (!arr || arr.length === 0) return ""; 
            if (arr.length === 1) return arr[0]; 
            if (arr.length === 2) return arr[0] + " or " + arr[1]; 
            return arr.slice(0, -1).join(", ") + " or " + arr[arr.length - 1]; 
        }, 
        pluginClassBelongsToFamily: function(pluginClass, pluginTypes) { 
            return pluginTypes.some(p => { 
                return p.pluginClasses.some(cls => { 
                    const baseName = cls.split('.').pop().replace("Plugin", ""); 
                    return pluginClass.includes(baseName); 
                }); 
            }); 
        }, 
        _validationConnectionPlugin: function (connId) { 
            let globalSelf = this; 
            if ((typeof connId === 'string') && (!parseInt(connId))) { 
                let element = globalSelf.$el.find('#connectionComboBox').parent().find(".k-input"); 
                globalSelf._showConnErrorTooltip(element, nls.messages.selectValidConnection); 
                globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED); 
            } else { 
                let otherConnId = -100; 
                if(globalSelf.otherConnId){ 
                    otherConnId = globalSelf.otherConnId; 
                } 
                AjaxUtility.commonAjaxRequest( 
                    "POST", 
                    "componentservices/filesystem/validateConnection?connId=" + connId+"&otherConnectionId="+otherConnId, 
                    JSON.stringify(globalSelf.pluginType), 
                    'json' 
                ) 
                    .done(function (validationResult) { 
                        let element = globalSelf.$el.find('#connectionComboBox').parent().find(".k-input"); 

                        if (validationResult.valid) { 
                            globalSelf._handleConnectionChange(); 
                            globalSelf._hideConnErrorTooltip(element); 
                        } else { 
                            let message = ""; 
                            if (!validationResult.pluginClassValid) { 
                                message = globalSelf.getPluginValidMessage(validationResult); 

                            } 
                            else if (!validationResult.schemeValid) { 
                                message = globalSelf.getSchemaValidMessage(validationResult); 

                            }else if (validationResult.differentPluginSrcDest) { 
                                message = nls.messages.selectSamePluginConnection; 
                            } 
                            globalSelf.trigger(Constants.EVENTS.INVALID_CONNECTION_SELECTED); 
                            if (message) { 
                                uilayer.notifier('error', message); 
                            } 
                            globalSelf.connectionComboBox.value(""); 
                            globalSelf.$el.find('#' + Constants.fields.baseFilePath).text(""); 
                        } 
                    }); 
            } 
        }, 

        _showConnErrorTooltip: function (element, message) { 
            element.addErrorHighlightClass('components-error-red-highlight'); 
            let globalSelf = this; 
            if(!message) 
                message = nls.messages.selectCorrectPluginConnection + globalSelf.pluginType.pluginName; 
            this.connErrorTooltip = uilayer.tooltip({ 
                elem: element, 
                autoHide: true, 
                showOn: "mouseenter", 
                position: "bottom", 
                show: function show() { 
                    this.popup.wrapper.addClass("component-error-tooltip-message"); 
                }, 
                content: function content() { 
                    return "<div>" + message + "</div>"; 
                } 
            }); 
        }, 

        _hideConnErrorTooltip: function (element) { 
            element.removeClass('components-error-red-highlight'); 
            if (this.connErrorTooltip) { 
                this.connErrorTooltip.destroy(); 
                this.connErrorTooltip = null; 
            } 
        }, 

        _renderExpressionBuilder: function (elemId) { 
            let globalSelf = this; 
            let element = globalSelf.$el.find("#" + elemId); 
            let configData = { 
                processModel: this.processModel, 
                activityID: this.activityId, 
                tabName: "CONFIGURATION" 
            }; 
            let value = ""; 
            if (this.model.get(elemId)) { 
                value = this.model.get(elemId); 
            } 
            return ExpressionBuilderUtility.render(element, ExpressionBuilderLauncherTypes.PROCESS_CONTEXT, configData, value, null); 
        }, 

        _refreshConnection: function () { 
            let globalSelf = this; 
            let connectionsDetails = []; 
            const promise = AjaxUtility.commonAjaxSyncRequest("GET", "services/fetchAccessibleConnections", null, "json", null, true); 
            promise.done(function (connectionsData) { 
                connectionsDetails = connectionsData; 
            }); 
            promise.fail(function (e) { 
                uilayer.notifier("error", window.app.reqres.request("getError", e).message); 
            }); 

            const finalConnArr = []; 
            const connectionVarDetails = ActivitiesUtility.getConnectionAndRemainingVariableComponentDataSource(this.processModel, this.activityId).data(); 

            _.each(connectionVarDetails, function (item) { 
                let flag = false; 
                connectionsDetails.forEach(function (connection) { 
                    if (connection.connectionId == item.connectionId) { 
                        item.connectionColor = connection.connectionColor; 
                        finalConnArr.push(item); 
                        flag = true; 
                    } 
                }); 
                if (!flag) { 
                    finalConnArr.push(item); 
                } 
            }); 

            this.connectionComboBox.setDataSource(finalConnArr); 
            this._getConnectionBasePathMap(); 

            if(parseInt(this.connectionComboBox.value()) > 0) { 
                this.trigger(Constants.EVENTS.REFRESH_CONNECTION, { 
                    'connectionId': globalSelf.connectionComboBox.value(), 
                    'basePath': globalSelf.connectionBasePathMap[globalSelf.connectionComboBox.value()] 
                }); 
                uilayer.notifier('success', nls.messages.connectionsRefreshed); 
            } 
            else 
                uilayer.notifier('warning', nls.messages.selectValidConnection); 
        }, 
        _populateRelativePath: function () { 
            let relativePath = this.activityReqres.request(Constants.EVENTS.GET_RELATIVE_PATH); 
            if(relativePath) 
                this._setRelativePath(relativePath); 
        }, 
        _showHideRelativePathButton: function(){ 
            let activityName = this.processModel.getBPMEntityById(this.activityId).getActivityName(); 
            let elem = this.$el.find("#populate-relative-path"); 
            if (activityName === Constants.activityName.formattedFileWrite) 
                elem.hide(); 
            else 
                elem.show(); 
        }, 
        _showHideRelativePath: function(){ 
            let elem = this.$el.find("#relativefile-div"); 
            if (this.hideRelativePath) 
                elem.hide(); 
            else 
                elem.show(); 
        }, 
        setOtherConnection:function(otherConnId){ 
            this.otherConnId = otherConnId; 
        }, 

        onBeforeDestroy: function () { 
            this.activityId = null; 
            this.designerReqres = null; 
            this.processModel = null; 
            this.connectionBasePathMap = null; 
            this.pluginType = null; 
            this.connectionComboBox?.destroy(); 
            this.connectionComboBox = null; 
        } 
    }); 
    return FileSystemConnComponent; 
});
