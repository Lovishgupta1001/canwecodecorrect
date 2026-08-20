/**
 * Created by jayant on 25-05-2021.
 */

define ( function ( require ) {
    "use strict";
    var uilayer = require("uilayer"),
        template = require("tpl!./template/template"),
        model = require("./model/model"),
        nls = require("i18n!./nls/nls"),
        util = require("./js/util"),
        constants = require("./js/constants"),
        CryptoUtil = require("Common/Encrypt/CryptoUtil"),
        CVTComponent = require("Components/CVTComponent/CVTComponent"),
        ExpressionBuilderLauncher = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncher,
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes,
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ProcessModel = require("Widgets/Designer/ProcessModel/ProcessModel"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility;


    return CVTComponent.extend({
        model: model,
        template: template,
        nls: nls,
        customEvents: constants.EVENTS_CONSTANTS,

        shortcutActions: {
            addNewRow: function (e) {
                let gridEl = this.$el.find('.k-grid.k-widget');
                if(gridEl.is($(e.target).closest('.k-grid.k-widget'))) {
                    this.grid.widget.addRow();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            },
            removeCurrentRow: function (e) {
                let globalSelf = this;
                let gridEl = this.$el.find('.k-grid.k-widget');
                if(gridEl.is($(e.target).closest('.k-grid.k-widget'))) {
                    let rowsToBeDeleted = [];
                    rowsToBeDeleted.push($(e.target).closest('tr'));
                    $.each(rowsToBeDeleted, function (index, item) {
                        globalSelf.grid.widget.removeRow(item);
                    });
                    this._updateComponentDataModel(false);
                    if(this.onRowsDelete){
                        this.onRowsDelete(rowsToBeDeleted)
                    }
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        },

        getData: function () {
            var encryptPassword = true;
            this._updateComponentDataModel(encryptPassword);
            return this.model.getConnectionList().toJSON();
        },

        setData: function (obj) {
            for (var key in obj) {
                if (this.model.has(key)) {
                    this.model.set(key, obj[key]);
                }
            }
        },

        getErrorMessage: function () {
        },

        events: {
            "click .connections-tab-div .k-grid-delete": "_deleteRow",
            "click .newConnectionAC ":"_createNewConnection",
            "click .refershConnection": "_refreshConnectionList" ,
            'mousedown .open-connection': 'onOpenConnectionClick'
        },

        onInitialize: function (options) {
            CVTComponent.prototype.onInitialize.call(this,options); // call to parent component onInitialize function
            this.connectionList = options.data;
            if(options.reqres){
                this.processModel = options.reqres.request('getCurrentActiveEntityModelFromDataStore');
                this.allKeyDetails = this.processModel.getAllBPMEntities().getBPMEntity(options.activityId).getAllKeys("CONNECTION");
                this.activityId = options.activityId;
            }else{
                this.processModel = new ProcessModel();
                this.allKeyDetails = {};
            }

        },

        onRender:function(){
            CVTComponent.prototype.onRender.call(this); // call to parent component OnRender function
            this.onCVTRender();

        },

        onCVTRender: function (isRefreshOnlyConnectionList) {
            var globalSelf = this;
            var fetchInitialDataPromise = util._fetchInitialDataHandler();

                  fetchInitialDataPromise.done(function (getInitialData) {
                          globalSelf._setDataSources();

                          globalSelf._updateDataSources(getInitialData.connections, getInitialData.decryptorData, globalSelf.allKeyDetails);

                          globalSelf._updateDummyDataSources(getInitialData.connections, getInitialData.decryptorData, globalSelf.allKeyDetails);

                          globalSelf.grid.widget.refresh();
                          if(!isRefreshOnlyConnectionList)
                          {
                            globalSelf.renderUI();
                          }

                                       });
        },
        _setDataSources:function(){
            this.connDataDS = this._getConnDataDs();
            this.dummyConnDataDS = this._getDummyConnDataDs();
            this.decryptDataDS = this._getPasswordDescryptorDS();
            this.connCredDataDS = this._getConnCredDS();
            this.variableNameDS = this._getVariableNameDS();
        },

        renderUI: function () {
            var connectionList = this.connectionList;
            if (connectionList && connectionList.length > 0) {
                this.grid.widget.setDataSource(this._createDataSource(connectionList));
            } else{
                this.grid.widget.setDataSource(this._createDataSource());
                this.grid.widget.addRow();
            }
        },
        _createNewConnection :function (){
            if(window.app.reqres.request("isValidOperation","Add Application Connections")){
            let promise = AjaxUtility.cachedAjaxRequest("GET", "services/application-navigation-url/cac", null, "json", null, true);
            promise.done((response) => {
            this.navigateToCAC(response, encodeURIComponent("applicationConnections/New"),"/ADMINCONSOLE?servicePath=applicationConnections/New")
            });
            promise.fail(e => {
                uilayer.notifier('error', window.app.reqres.request("getError", e).message);
            });
            }
        },
        _refreshConnectionList :function(){  // on refresh Connection we have called the CVTRender function
            var globalSelf = this;
            globalSelf.onCVTRender(true);
        },
        getElement:function(){
            return this.$el.find(".connections-tab-div");
        },

        _getConnectionCredentialType: function (model) {
            if(!model.ConnectionCredentialType)
              return Constants.CONNECTION_CREDENTIAL.NONE;
            else
              return typeof model.ConnectionCredentialType == 'object' ? model.ConnectionCredentialType.id : model.ConnectionCredentialType;
        },
        getToolBar: function () {
            let toolbar = CVTComponent.prototype.getToolBar();
              toolbar.push({
                 template:
                "<div class ='refresh-create-new-button-div'><button class='k-button refershConnection'  title='" +
                    nls.RefreshConnection +
                    "' onclick =''><span class='eQ-icon eQ-fonts-refresh eq-cursor-pointer ul-icon-xs'></span></button><button class='k-button newConnectionAC'  title='" +
                    nls.createNewConnection +
                    "' onclick =''><span class='eQ-icon eQ-fonts-plus eq-cursor-pointer ul-icon-xs'></span></button></div>",
                });
            return toolbar;
        },
        getColumns: function(){
            var globalSelf = this;
            return [
                {
                    selectable: true,
                    width: "43px"
                },
               {field: "connectionId",
                    headerTemplate: function() {
                        return '<div title="' + nls.connections + '">' + nls.connections + '</div>';
                    },
                    title: nls.connections,
                    width: "15%",
                    attributes: {
                        "class": "connectionId"
                    },
                    template: function(model) {
                        var connID = (model.connectionId && typeof model.connectionId == 'object') ? model.connectionId.connectionId : model.connectionId;
                        var dataValue = globalSelf.connDataDS.get(connID),
                            _displayValue = model.connectionId ? model.connectionId : '';
                         if(connID==null || dataValue==undefined){
                         connID=(model.dummyConnectionId && typeof model.dummyConnectionId == 'object') ? model.dummyConnectionId.dummyConnectionId : model.dummyConnectionId;
                         dataValue = globalSelf.dummyConnDataDS.get(connID),
                                                     _displayValue = model.connectionId ? model.connectionId : '';
                         }

                        return dataValue ?
                            globalSelf.prepareGridElementWithEditIcon('<div class = "connection-name-cell"><div class="connection-div ul-connection-item" title="' + dataValue.connectionName + '"><span class="ul-connection-item-color" style="background-color:' + dataValue.connectionColor + '"></span><span class="ul-connection-item-spacer ul-conn-item-space-sm"></span><span class="ul-connection-item-text">' + dataValue.connectionName + ' </span><span class="ul-connection-item-spacer ul-conn-item-space-sm"></span><span class="ul-connection-item-prefix">[' + dataValue.connectionId + ']</span></div><div><span class="open-connection eQ-icon eQ-fonts-open-existing-project eq-cursor-pointer" name="' + dataValue.connectionId + '" title="' + nls.OpenConnection + '"></span></div></div>') :
                            globalSelf.prepareGridElementWithEditIcon('<div class= "connection-name-cell" ><div class="hide-text-overflow">' + _displayValue + ' </div><div><span class="open-connection eQ-icon eQ-fonts-open-existing-project eq-cursor-pointer" name="' + model.connectionId + '" title="' + nls.OpenConnection + '"></span></div></div>');
                    },
                    editor: globalSelf._editorFunConnections.bind(globalSelf)
},
                {
                    field: "ConnectionCredentialType",
                    headerTemplate:function () {
                        return '<div><span title="'+nls.connectionsCredType+'">'+nls.connectionsCredType+'</span><span class="credential-type-info eQ-icon eQ-fonts-info" title="'+nls.TCSSOCredTypeNote+'"></span></div>';},
                    title: nls.connectionsCredType,
                    attributes: { "class": "ConnectionCredentialType" },
                    template: function (model) {
                        var credId = globalSelf._getConnectionCredentialType(model);
                        var dataValue = globalSelf.connCredDataDS.get(credId);
                        return dataValue
                              ? globalSelf.prepareGridElementWithEditIcon('<div class="hide-text-overflow">' + dataValue.credName + '</div>')
                              : "";
                    },
                    editor: globalSelf._editorFunConnectionsCredential.bind(globalSelf),
                    width: "15%"
                },
                {
                    field: "username",
                    headerTemplate:function () {
                        return '<div title="'+nls.userName+'">'+nls.userName+'</div>';},
                    title: nls.userName,
                    customEditor: true,
                    attributes: { "class": "username" },
                    template: function (model) {
                        var connectionCredentialType = globalSelf._getConnectionCredentialType(model);
                        if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.NONE || connectionCredentialType == Constants.CONNECTION_CREDENTIAL.ACCESS_TOKEN_AS_VARIABLE)
                            return "";
                        else {
    var uname = model.username ? (typeof model.username == 'object' ? globalSelf.getExpression(model.username) : (model.expression ? model.expression:model.username)) : "";
    return globalSelf.prepareGridElementWithEditIcon("<div class='editable hide-text-overflow'>" + uilayer.htmlEncode(uname) + "</div>");
                        }
                    },
                    editor: globalSelf._editorFunUserName.bind(this)
                },
                {
                    field: "ssoSessionKey",
                    headerTemplate:function () {
                        return '<div title="'+nls.ssoSessionKey+'">'+nls.ssoSessionKey+'</div>';},
                    title: nls.ssoSessionKey,
                    customEditor: true,
                    attributes: { "class": "ssoSessionKey" },
                    template: function (model) {
                        var connectionCredentialType = globalSelf._getConnectionCredentialType(model);
                        if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.SSO_SESSION_KEY_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.ACCESS_TOKEN_AS_VARIABLE)
                            return globalSelf.getExpressionBuilderTemplate ( "ssoSessionKey", model );
                        else
                            return "";
                    },
                    editor: function (container, options) {
                        var connectionCredentialType= globalSelf._getConnectionCredentialType(options.model);
                        if ( connectionCredentialType == Constants.CONNECTION_CREDENTIAL.SSO_SESSION_KEY_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.ACCESS_TOKEN_AS_VARIABLE){
globalSelf.getExpressionBuilderEditor ( {
configData: { tabName: "CONNECTION" },
changeHandler: globalSelf._changeHandler.bind ( globalSelf )
}, container, options );
                        }
                        else
                            return "";
                    }
                },
                {
                    field: "password",
                    headerTemplate:function () {
                        return '<div title="'+nls.password+'">'+nls.password+'</div>';},
                    title: nls.password,
                    customEditor: true,
                    attributes: { "class": "password" },
                    template: function (model) {
                        var connectionCredentialType = globalSelf._getConnectionCredentialType(model);
                        if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES) {
                            return globalSelf.getExpressionBuilderTemplate ( "password", model );

                        } else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER) {
                            var pass = (model.password && model.password.length > 0) ? "•••••••••••••••" : "";
                            return globalSelf.prepareGridElementWithEditIcon("<div class='editable hide-text-overflow'>" + pass + "</div>");
                        } else
                            return "";
                    },
                    editor: function (container, options) {
                        var connectionCredentialType = globalSelf._getConnectionCredentialType(options.model);
                        if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES) {

globalSelf.getExpressionBuilderEditor ( {
configData: { tabName: "CONNECTION" },
changeHandler: globalSelf._changeHandler.bind ( globalSelf )
}, container, options );
                        }
                        else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER)
                            $('<input novalidate name="password" type="password" ondrop="return false" class="k-textbox"/>').appendTo(container);
                        else
                            return;
                    }
                }
                ,
                {
                    field: "passwordDecryptor",
                    headerTemplate:function () {
                        return '<div title="'+nls.passwordDecryptor+'">'+nls.passwordDecryptor+'</div>';},
                    title: nls.passwordDecryptor,
                    attributes: { "class": "passwordDecryptor" },
                    template: function (model) {
                        var connectionCredentialType = globalSelf._getConnectionCredentialType(model);
                        if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES) {
                            (model.passwordDecryptor) || (model.passwordDecryptor = '');
                            var decrpytId = (typeof model.passwordDecryptor == 'object') ? model.passwordDecryptor.id : model.passwordDecryptor;
                            var dataValue = globalSelf.decryptDataDS.get(decrpytId);
                            return dataValue
                                  ? globalSelf.prepareGridElementWithEditIcon('<div class="hide-text-overflow">' + dataValue.id + '</div>')
                                  : globalSelf.prepareGridElementWithEditIcon('<div class="hide-text-overflow">' + model.passwordDecryptor + '</div>');
                        } else
                            return "";
                    },
                    editor: function (container, options) {
                        var connectionCredentialType = globalSelf._getConnectionCredentialType(options.model);
                        if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES ||
                            connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES) {
                            $('<input required name="passwordDecryptor"  class="passwordDecryptor"/>').appendTo(container);
                            globalSelf.passDecryptDropDownList = uilayer.dropDownList({
                                elem: globalSelf.$el.find('[name="passwordDecryptor"]'),
                                dataSource: globalSelf.decryptDataDS,
                                dataValueField: "id",
                                dataTextField: "id",
                                dataIdField: "id",
                                optionLabel: true,
                                optionLabelTemplate:"<div>"+nls.selectDecryptor+"</div>",
                                template: "<div>#:id#</div>",
                                valueTemplate: "<div>#:id#</div>"
                            });
                            globalSelf.passDecryptDropDownList.widget.open();
                        } else
                            return;
                    }
                }
                ,
                {
                    field: "key",
                    headerTemplate:function () {
                        return '<div title="'+nls.connectionVariable+'">'+nls.connectionVariable+'</div>';},
                    title: nls.connectionVariable,
                    attributes: { "class": "key" },
                    template: function (model) {
                        var varName = (model.key && typeof model.key == 'object') ? model.key.name : model.key;
                        if (!varName) return globalSelf.prepareGridElementWithEditIcon("<div class='editable hide-text-overflow'></div>");
                        var dataValue = globalSelf.variableNameDS.get(varName);
                        if (!dataValue && varName) {
                            dataValue = globalSelf.variableNameDS.add({id: varName, name: varName});
                        }
                        return globalSelf.prepareGridElementWithEditIcon("<div class='editable hide-text-overflow'>" + uilayer.htmlEncode(dataValue.name) + "</div>");

                    },

                    editor: function (container, options) {
                        globalSelf.connRowModel = options.model;
                        globalSelf.oldKey = options.model.key;
                        $('<input required name="' + options.field + '"  class="connVar"/>').appendTo(container);
                        globalSelf.connNameDropDownList = uilayer.comboBox({
                            elem: globalSelf.$el.find('[name="' + options.field + '"]'),
                            dataSource: globalSelf.variableNameDS,
                            dataValueField: "id",
                            dataIdField: "id",
                            dataTextField: "id",
                            template: "<div>#:name#</div>",
                            valueTemplate: "<div>#:name#</div>",
                            change: function (e) {
                            }
                        });
                        globalSelf.connNameDropDownList.widget.open();
                    }
                }
            ]
        },
        navigateToCAC:function(response, additionalURLForDistributed, additionalURLForMonolithic){
            let navigationURL;
            if(response.IS_DISTRIBUTED_DEPLOYMENT =="TRUE")
            {
                    navigationURL = response.URL + "/" + encodeURIComponent(response.ENVIRONMENT_ID)+"/EXECUTOR/"+additionalURLForDistributed;
            }
            else{
                    navigationURL =  window.location.origin + "/" + window.location.pathname.split("/")[1] + additionalURLForMonolithic;
            }
            window.open(navigationURL);
        },

        onOpenConnectionClick:function(e){
             e.stopPropagation();
             e.preventDefault();
             let promise = AjaxUtility.cachedAjaxRequest("GET", "services/application-navigation-url/cac", null, "json", null, true);;
            promise.done((response) => {
            this.navigateToCAC(response,encodeURIComponent("applicationConnections/Edit/")+e.target.getAttribute("name"), "/ADMINCONSOLE?servicePath=applicationConnections/Edit/"+e.target.getAttribute("name") )
            });
            promise.fail(e => {
                uilayer.notifier('error', window.app.reqres.request("getError", e).message);
            });

        },
        onChangeRowIndex:function(oldIndex, newIndex){
            if(this.onRowMove){
                this.onRowMove(oldIndex, newIndex)
            }
        },
        _updateDummyDataSources: function (connData, decryptorData, allKeysData) {
                                           var connectionArr =[];
                                                              Object.values(connData).forEach(data => {
  if (!data) return;
                                                                   connectionArr.push({
connectionId: data.connectionId,
connectionName: data.connectionName,
connectionColor: data.connectionColor,
                                                                        pluginClassName: data.pluginClassName,
                                                                        isSSOEnabled: data.isSSOEnabled
});
                                                               });
                                            this.dummyConnDataDS.data(connectionArr);
                                       },
        _updateDataSources: function (connData, decryptorData, allKeysData) {
            var connectionArr =[];
Object.values(connData).forEach(data => {
  if (!data) return;
                                                                   connectionArr.push({
connectionId: data.connectionId,
connectionName: data.connectionName,
connectionColor: data.connectionColor,
                                                                        pluginClassName: data.pluginClassName,
                                                                        isSSOEnabled: data.isSSOEnabled
});
                                                               });
             this.connDataDS.data(connectionArr);
            if(decryptorData) {
                var passwordDecryptorData = decryptorData.map(function (data) {
                    var obj = {};
                    obj.id = data;
                    return obj;
                });
                this.decryptPasswordDS.data(passwordDecryptorData);
            }
            var temporaryArrayforVariableNameDS = [];
            for (var keysData in allKeysData) {
                if (allKeysData.hasOwnProperty(keysData)) {
                    temporaryArrayforVariableNameDS.push({id:allKeysData[keysData], name: allKeysData[keysData]});
                }
            }
            this.variableNameDS.data(temporaryArrayforVariableNameDS);
        },

        _getConnDataDs: function () {
            var connDataDS = new uilayer.data.DataSource({
                data: [],
                schema: {
                    model: {
                        id: "connectionId"
                    }
                }
            });
            connDataDS.fetch();
            this.connIdDS = [];
            this.connDataDS = connDataDS;
            return connDataDS;
        },

                _getDummyConnDataDs: function () {
                    var dummyConnDataDS = new uilayer.data.DataSource({
                        data: [],
                        schema: {
                            model: {
                                id: "connectionId"
                            }
                        }
                    });
                    dummyConnDataDS.fetch();
                    this.connIdDS = [];
                    this.dummyConnDataDS = dummyConnDataDS;
                    return dummyConnDataDS;
                },

        _getPasswordDescryptorDS: function () {
            var decryptDataDS = new uilayer.data.DataSource({
                data: []
            });
            decryptDataDS.fetch();
            this.decyptPassDS = [];
            this.decryptPasswordDS = decryptDataDS;
            return decryptDataDS;
        },

        _getConnCredDS: function () {
            var source = [];
            var connectionCredential = Constants.CONNECTION_CREDENTIAL;
            for (var key in connectionCredential) {
                source.push({id: connectionCredential[key], credName: nls.CONNECTION_CREDENTIAL[key]})
            }

            var connCredDataDS = new uilayer.data.DataSource({
                data: source
            });
            connCredDataDS.fetch();
            this.connCredDS = source;
            this.connCredDataDS = connCredDataDS;
            return connCredDataDS;
        },

        _getVariableNameDS: function () {
            var variableNameDS = new uilayer.data.DataSource({
                data: []
            });
            variableNameDS.data([]);
            variableNameDS.fetch();
            this.variableNameDS = variableNameDS;
            return variableNameDS;
        },

        _editorFunConnections :function (container, options) {
            $('<input required name="connectionId" class="connectionId"/>').appendTo(container);


                        this.connDropDownList = uilayer.dropDownList({
                            elem: Array.isArray(this.$el) ? this.$el.filter('[name="connectionId"]')[0] : this.$el.find('[name="connectionId"]'),
                            dataSource: this.connDataDS,
                            dataTextField: "connectionName",
                            dataValueField: "connectionId",
                            optionLabel: true,
                            optionLabelTemplate: "<div>" + nls.selectConnection + "</div>",
                            template: function(item) {
                                return uilayer.templateFactory.get("connectionItem", {
                                    prefix: item.connectionId,
                                    color: item.connectionColor,
                                    text: item.connectionName
                                });
                            },
                            valueTemplate: function(item) {
                                return uilayer.templateFactory.get("connectionItem", {
                                    prefix: item.connectionId,
                                    color: item.connectionColor,
                                    text: item.connectionName
                                });
                            }
                        });
                        this.connDropDownList.setOptions({
                            filter: "contains"
                        });
                        return this.connDropDownList.widget.open(); // open widget when new row  added
        },

        _editorFunConnectionsCredential :function (container, options) {
            var globalSelf = this;
            $('<input required name="' + options.field + '"  class="connCredential"/>').appendTo(container);
            var connID = options.model.connectionId && typeof options.model.connectionId === "object" ? options.model.connectionId.connectionId : options.model.connectionId;

    var selectedConnection = globalSelf.connDataDS.get(connID);

            var isTeamcenterSOA = selectedConnection && selectedConnection.pluginClassName.toLowerCase().includes("tcsoaplugin") && selectedConnection.isSSOEnabled=="yes";

            var selectedConnection = globalSelf.connDataDS.get(connID);
            globalSelf.connCredDropDownList = uilayer.dropDownList({
                elem: globalSelf.$el.find('[name="' + options.field + '"]'),
                dataSource: globalSelf.connCredDataDS,
                autoWidth: true,
                dataValueField: "id",
                dataTextField: "credName",
                dataIdField: "id",
                template: function (item) {

                var shouldDisable = isTeamcenterSOA &&
                (
                    item.id === Constants.CONNECTION_CREDENTIAL.MI_USER_NAME ||
                    item.id === Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                    item.id === Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES
                );

                return '<div class="' +
                (shouldDisable ? 'k-state-disabled disabled-cred-option' : '') +
                '">' + item.credName + '</div>';
        },
                valueTemplate: "<div>#:credName#</div>",
                select: function(e) {
                    var item = this.dataItem(e.item);

                    var isDisabledSelection =
                        isTeamcenterSOA &&
                        (
                            item.id === Constants.CONNECTION_CREDENTIAL.MI_USER_NAME ||
                            item.id === Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                            item.id === Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES
                        );

                    if (isDisabledSelection) {
                        e.preventDefault();
                    }
                },
                change: function () {
                    var connectionCredentialType = globalSelf._getConnectionCredentialType(options.model);
                    if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.NONE) {
                        options.model.set("username", "");
                        options.model.set("ssoSessionKey", "");
                            options.model.set("password", "");
                        options.model.set("passwordDecryptor", "");
                    } else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS ||
                        connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                        connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER) {
                        options.model.set("username", "");
                        options.model.set("ssoSessionKey", "");
                        options.model.set("password", "");
                        options.model.set("passwordDecryptor", "");
                    } else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS_AS_VARIABLES ||
                        connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES ||
                        connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES) {
                        options.model.set("username", "");
                        options.model.set("ssoSessionKey", "");
                        options.model.set("password", "");
                        options.model.set("passwordDecryptor", options.model.passwordDecryptor || globalSelf.decyptPassDS[0]);
                    } else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.SSO_SESSION_KEY_AS_VARIABLES) {
                        options.model.set("username", "");
                        options.model.set("ssoSessionKey", "");
                        options.model.set("password", "");
                        options.model.set("passwordDecryptor", "");
                    } else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_NAME) {
                        globalSelf._showWarning();
                        options.model.set("username", "");
                        options.model.set("ssoSessionKey", "");
                        options.model.set("password", "");
                        options.model.set("passwordDecryptor", "");
                    }
                    if(connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER || connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES){
                        var connID = options.model.connectionId && _typeof(options.model.connectionId) == 'object' ? options.model.connectionId.connectionId : options.model.connectionId;
                        var promise = AjaxUtility.commonAjaxRequest("POST", "componentservices/ConnectionTabService/isStoreSessionKeySelected", JSON.stringify({connectionId : connID}), null, "json");
                        promise.done(function (storeSSOFlag) {
                            if (storeSSOFlag === false) {
                                uilayer.notifier("error", nls['validations.bpm.cvt.storeSSOSessionKeyOnLoginPropertyValue']);
                            }
                        });
                    }
                    globalSelf.grid.widget.saveChanges();
                }
            });
            globalSelf.connCredDropDownList.setOptions({filter:"contains"});
            globalSelf.connCredDropDownList.widget.open();
        },

        _editorFunUserName :function (container, options) {
         var globalSelf = this;
           var connectionCredentialType = globalSelf._getConnectionCredentialType(options.model);
            if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS_AS_VARIABLES ||
                connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS_AS_VARIABLES ||
                connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER_AS_VARIABLES ||
                connectionCredentialType == Constants.CONNECTION_CREDENTIAL.SSO_SESSION_KEY_AS_VARIABLES ||
                connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_NAME) {
this.getExpressionBuilderEditor ( {
configData: { tabName: "CONNECTION" },
changeHandler: this._changeHandler.bind ( this )
}, container, options );
            }
            else if (connectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS ||
                connectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                connectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER)
                {
                    if(options.model && options.model.username && typeof options.model.username == "object"){
                        options.model.username =  options.model.username.expression;
                    }
                return $('<input name="username" data-bind="value:username" class="k-textbox"/>').appendTo(container);
                }
            else
                return;

        },

        /* Method gets called on every cell change*/
        _updateComponentDataModel: function (encryptPassword) {
            var saveJSONArray = [];
            var passwordArray = [];
            var globalSelf = this;
            this.grid.widget.dataSource.data().forEach(function (gridJSON) {
                var saveJSON = globalSelf._getJsonObject(gridJSON,passwordArray);
                saveJSONArray.push(saveJSON);
            });
            if(encryptPassword){
                this._encryptPasswordArray(passwordArray, saveJSONArray);
            }
            this.model.setConnectionList(saveJSONArray);

        },
        _getJsonObject:function(gridJSON,passwordArray){
            var saveJSON = {};
            if(gridJSON.connectionId==null){
                                    gridJSON.connectionId=gridJSON.dummyConnectionId;
                                    }
             if (gridJSON.connectionId)
                saveJSON.connectionId = typeof gridJSON.connectionId == "object" ? gridJSON.connectionId.connectionId : gridJSON.connectionId;
            if (gridJSON.ConnectionCredentialType)
                saveJSON.ConnectionCredentialType = this._getConnectionCredentialType(gridJSON);
            if (saveJSON.ConnectionCredentialType != Constants.CONNECTION_CREDENTIAL.NONE) {
                if (gridJSON.username)
                    saveJSON.username = this.getExpressionValueOfField ( gridJSON, "username" );

                if (gridJSON.passwordDecryptor)
                    saveJSON.passwordDecryptor = typeof gridJSON.passwordDecryptor == "object" ? gridJSON.passwordDecryptor.id : gridJSON.passwordDecryptor;

                if ( gridJSON.ssoSessionKey)
                    saveJSON.ssoSessionKey = this.getExpressionValueOfField ( gridJSON, "ssoSessionKey" );
            }
            if (gridJSON.key)
                saveJSON.key = gridJSON.key;

            if (gridJSON.password) {
                saveJSON.password = this.getExpressionValueOfField ( gridJSON, "password" );
                passwordArray.push(saveJSON.password);
            } else {
                saveJSON.password = "";
                passwordArray.push("")
            }

                if(gridJSON.dirtyFields && gridJSON.dirtyFields.password &&
                    !gridJSON.dirtyFields.ConnectionCredentialType && !gridJSON.dirtyFields.passwordEncrypted &&
                     gridJSON.passwordEncrypted){
                    saveJSON.passwordEncrypted = false;
                    this._updatePasswordEncryptedFlag(gridJSON);
                }else{
                    saveJSON.passwordEncrypted = gridJSON.passwordEncrypted ?  gridJSON.passwordEncrypted :false;
                }

            if (gridJSON.isAutoGenerated) {
                    saveJSON.isAutoGenerated  = this._updateAutoGeneratedFlag(gridJSON,saveJSON);
            }
            return saveJSON;
        },
        _updatePasswordEncryptedFlag:function(gridJSON){
            var dataItem = this.grid.widget.dataSource.getByUid(gridJSON.uid);
            dataItem.set("passwordEncrypted",false);
            
        },

        _updateAutoGeneratedFlag:function(baseObj,updatedObj){
            if((baseObj.isAutoGenerated === "false" || baseObj.isAutoGenerated === false) || baseObj.connectionId != updatedObj.connectionId || baseObj.username != updatedObj.username ||
                baseObj.ssoSessionKey != updatedObj.ssoSessionKey || baseObj.passwordDecryptor != updatedObj.passwordDecryptor || baseObj.key != updatedObj.key ||
                ( (this._getConnectionCredentialType(baseObj)) != updatedObj.ConnectionCredentialType)){
                return false;
            }else{
                return true;
            }
        },
        onSaveGridChange:function(event){

            this._updateComponentDataModel(true);
            if(this.onChangeDataSource){
                var obj = this._getJsonObject(event.model,[]);
                this.onChangeDataSource(obj);
            }
        },

        _encryptPasswordArray: function (passwordArray,saveJSONArray) {
            var encryptedPassArray = this.processModel.encryptArray(passwordArray);

            for (var i = 0; i < saveJSONArray.length; i++) {
                var obj = saveJSONArray[i];
                if (!obj.passwordEncrypted  && (obj.ConnectionCredentialType == Constants.CONNECTION_CREDENTIAL.APPLICATION_CREDENTIALS ||
                    obj.ConnectionCredentialType == Constants.CONNECTION_CREDENTIAL.MI_USER_CREDENTIALS ||
                    obj.ConnectionCredentialType == Constants.CONNECTION_CREDENTIAL.STORED_SSO_SESSION_KEY_BY_USER) && obj.password.trim().length > 0) {
                    saveJSONArray[i].passwordEncrypted = true;
                    saveJSONArray[i].password = encryptedPassArray[i];
                }
            }
        },

        _createDataSource: function (data) {
            return new uilayer.data.DataSource({
                data: data, schema: {
                    model: {
                        fields: {
                            connectionId:  { validation: { required: false } },
                            ConnectionCredentialType: {defaultValue: {id: Constants.CONNECTION_CREDENTIAL.NONE, credName: nls.CONNECTION_CREDENTIAL.NONE}},
                            passwordDecryptor:  { validation: { required: false } },
                            key: { validation: { required: false } },
                            passwordEncrypted: {defaultValue: false}
                        }
                    }
                }
            });

        },


        _renderExpressionBuilder:function(value){
            var element = globalSelf.$el.find(".expression-editor");
            var configData = {
                processModel:this.processModel,
                activityID:this.activityId,
                tabName: "CONNECTION"
            }
            ExpressionBuilderUtility.render(element,ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,configData,value,this._changeHandler.bind(this));
        },
        _updateAutoGeneratedVariableList(){
            if(this.grid && this.processModel){
                let entityData = this.processModel.getAllBPMEntities().getBPMEntity(this.activityId).getEntityData ();
                let autoGeneratedConnectionVariables = entityData.getAutoGeneratedConnectionVariables();
                let removedKeysVariable = entityData.getRemovedKeys();
                let rowsToBeDeleted = this.grid.widget.select() ? this.grid.widget.select().toArray() : this.grid.widget.select();
                let newAutoGeneratedConnectionVariables = [];
                let newRemovedKeys = [];

                if(autoGeneratedConnectionVariables && autoGeneratedConnectionVariables.length > 0 && rowsToBeDeleted && rowsToBeDeleted.length > 0) {
                    newAutoGeneratedConnectionVariables =
                        autoGeneratedConnectionVariables.filter(autoVar =>
                            !rowsToBeDeleted.some(connection =>
                                 this.grid.dataItem(connection).isAutoGenerated && (this.grid.dataItem(connection).key === autoVar) ));

                    if(removedKeysVariable && removedKeysVariable.length > 0) {
                        newRemovedKeys =
                            removedKeysVariable.filter(autoVar =>
                                !rowsToBeDeleted.some(connection =>
                                    this.grid.dataItem(connection).isAutoGenerated && (this.grid.dataItem(connection).key === autoVar) ));
                    }
                }
                entityData.setAutoGeneratedConnectionVariables(newAutoGeneratedConnectionVariables);
                entityData.setRemovedKeys(newRemovedKeys);
            }
        },

        _deleteRow: function () {
            this._updateAutoGeneratedVariableList();
            CVTComponent.prototype.deleteRow.call ( this );
            this._updateComponentDataModel(false);
        },

        _showWarning: function _showWarning(e) {
                   uilayer.notifier("warning",nls.warningMessage);
                }

    })

})
