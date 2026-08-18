define(function (require) {

    var uilayer = require("uilayer"),
        template = require("tpl!./template/FileZipTemplate"),
        model = require("./model/FileZipModel"),
        nls = require("i18n!./nls/FileZipNLS"),
        constants = require("./js/constants"),
        eventBus = require("Application/Application").EventBus,
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes,
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility;

    var FileZip = MIUIComponentI.extend({

        name: "FileZip",
        model: model,
        template: template,
        nls: nls,

        events: {
            "click #isrecursive": "_togglePreserveFolder"
        },

        onInitialize: function (options) {
            this.activityId = options.activityId;
            this.designerReqres = options.reqres;
            this.activityReqres = new Backbone.Wreqr.RequestResponse();
            this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore');

            this._setFileZipHandlers();
            this._subscribeToEvents();
        },

        onRender: function () {
            this._fetchPluginTypes();
            this._renderTabStrip();
            this._renderSourceTabExplorerDrawer();
            this._renderSourceTabComponents();
            this._renderDestTabExplorerDrawer();

            let promise = this._renderDestinationTabComponents();

            this._renderExpressionBuilder(constants.IDS.ARCHIVE_NAME);
            this._renderArchiveType();
            this._setValuesFromModel();

            return promise;
        },

        _fetchPluginTypes: function () {
            let deferred = $.Deferred();

            if (this._pluginTypes) {
                deferred.resolve(this._pluginTypes);
                return deferred.promise();
            }

            AjaxUtility.commonAjaxRequest(
                'GET',
                "activities/FileZip/getSupportedPluginType",
                null,
                'JSON'
            ).done((PLUGIN_TYPE) => {
                this._pluginTypes = PLUGIN_TYPE;
                deferred.resolve(PLUGIN_TYPE);
            }).fail(() => {
                deferred.reject();
            });

            return deferred.promise();
        },

        _togglePreserveFolder: function () {
            var $isRecursive = this.$el.find('#isrecursive').is(":checked");

            if (!$isRecursive) {
                this.$el.find('.preserve-folder-checkbox').attr('checked', false);
                this.$el.find('.preserve-folder-checkbox').prop("disabled", true);
            } else {
                this.$el.find('.preserve-folder-checkbox').prop("disabled", false);
            }
        },

        getData: function () {
            this.model.setKey('preserveFolder', this.$el.find('.preserve-folder-checkbox').is(":checked"));
            this.model.setKey('preserveParentFolder', this.$el.find('.preserve-parent-folder-checkbox').is(":checked"));
            this.model.setKey('deleteInputFiles', this.$el.find('.delete-input-files-checkbox').is(":checked"));
            this.model.setKey(constants.IDS.ARCHIVE_NAME, ExpressionBuilderUtility.getExpression(this.$el.find("#" + constants.IDS.ARCHIVE_NAME).data("kendoExpressionScriptEditor")));
            this.model.setKey(constants.IDS.ARCHIVE_TYPE, this.archiveType.value());

            var activityData = this.model.toJSON(), mappedData = this._mapToConfigData();
            activityData = $.extend(true, activityData, mappedData);

            return activityData;
        },

        _mapToConfigData: function () {
            var mappingData = {};

            mappingData['selectSourceConnection'] = this.fileConnSourceTabComp?.getData()['connectionComboBox'];
            mappingData['relativePathSourceEbl'] = this.fileConnSourceTabComp?.getData()['relativefilepath'];
            mappingData['fileNamePattern'] = this.fileSelectionComponent?.getData()['filepattern'];
            mappingData['isRecursive'] = this.fileSelectionComponent?.getData()['isrecursive'];
            mappingData['fileFilter'] = this.fileSelectionComponent?.getData()['fileSelectionCriteriaFilter'];
            mappingData['selectDestConnection'] = this.fileConnDestTabComp?.getData()['connectionComboBox'];
            mappingData['relativePathDestEbl'] = this.fileConnDestTabComp?.getData()['relativefilepath'];

            return mappingData;
        },

        setData: function (obj) {
            for (var key in obj) {
                if (this.model.attributes.hasOwnProperty(key)) {
                    this.model.setKey(key, obj[key]);
                }
            }
            this.initialData = obj;
        },

        _setFileZipHandlers: function () {
            this.activityReqres.setHandler(constants.EVENTS.GET_SELECTED_CONNECTION, this._getSelectedConnection.bind(this));
            this.activityReqres.setHandler(constants.EVENTS.GET_RELATIVE_PATH, this._getRelativeFilePath.bind(this));
            this.activityReqres.setHandler(constants.EVENTS.GET_FILE_NAME_PATTERN, this._getFileNamePattern.bind(this));
        },

        _subscribeToEvents: function () {
            eventBus.subscribe(constants.EVENTS.BOTTOM_PANE_RESIZED, constants.SUBSCRIBER_ID, null, this._resizeActivityGrids.bind(this));
        },

        _resizeActivityGrids: function () {
            var globalSelf = this;

            this.srcTabFileExplorer?.resizeFileExplorer();
            this.destTabFileExplorer?.resizeFileExplorer();

            setTimeout(function () {
                globalSelf.srcTabFileExplorerDrawer?.resizeDrawer("file-zip-src-explorer-section", "50%");
                globalSelf.$el.find("#file-zip-source-tab-container").attr("style", "padding-right:50%");
                globalSelf.destTabFileExplorerDrawer?.resizeDrawer("file-zip-dest-explorer-section", "50%");
                globalSelf.$el.find("#file-zip-dest-tab-container").attr("style", "padding-right:50%");
            }, 400);
        },

        _getSelectedConnection: function () {
            var conn;

            if (this.tabstrip.value() === nls.tabs.source)
                conn = this.fileConnSourceTabComp;
            else
                conn = this.fileConnDestTabComp;

            return conn.getSelectedConnection();
        },

        _getRelativeFilePath: function () {
            var fileExp;

            if (this.tabstrip.value() === nls.tabs.source)
                fileExp = this.srcTabFileExplorer;
            else
                fileExp = this.destTabFileExplorer;

            const relativePath = fileExp.getSelectedRelativePath();
            return relativePath !== null ? '"' + relativePath + '"' : null;
        },

        _getFileNamePattern: function () {
            var fileNameList = this.srcTabFileExplorer.getSelectedFiles();
            var connId = this.fileConnSourceTabComp.getSelectedConnection();

            if (!connId || connId < 1) {
                uilayer.notifier('warning', nls['FileZip.error.invalidConnection']);
                return;
            }

            if (!fileNameList || fileNameList.length <= 0) {
                uilayer.notifier('warning', nls['noFileSelected']);
                return;
            }

            return AjaxUtility.commonAjaxRequest('POST', "activities/FileZip/getFileNamePattern?connId=" + connId,
                JSON.stringify(fileNameList), 'text');
        },

        _renderTabStrip: function () {
            var globalSelf = this;

            this.tabstrip = uilayer.tabStrip({
                elem: this.$el.find("#file-zip-tabstrip"),
                animation: false,
                change: function () {
                    if (this.value() === nls.tabs.destination && globalSelf.destTabFileExplorerDrawer) {
                        globalSelf.$el.find("#file-zip-dest-explorer-section").addClass("ul-state-collapsed");
                        globalSelf.destTabFileExplorerDrawer.expand('file-zip-dest-explorer-section');

                        if (globalSelf.fileConnSourceTabComp.getSelectedConnection() != null && globalSelf.fileConnDestTabComp.getSelectedConnection() == null) {
                            globalSelf.fileConnDestTabComp.connectionComboBox.value(globalSelf.fileConnSourceTabComp.getSelectedConnection());
                            globalSelf.fileConnDestTabComp.connectionComboBox.trigger("change");
                        }
                    }
                }
            });
            this.tabstrip.select(0);
        },

        _renderSourceTabExplorerDrawer: function () {
            this.srcTabFileExplorerDrawer = uilayer.drawer({
                elem: this.$el.find('#file-zip-source-tab-container'),
                section: {
                    'file-zip-src-explorer-section': {
                        position: 'right',
                        toggleHandle: true,
                        resizable: true,
                        dimensionValue: '50%',
                        min: '30%',
                        max: '65%'
                    }
                }
            });
        },

        _renderSourceTabComponents: function () {
            this._renderSourceFileExplorer();
            this._renderSystemConnComponent();
            this._renderConfigComponent();

            this.preserveFolder = this._createCheckbox("preserve-folder-checkbox");
            this.preserveParentFolder = this._createCheckbox("preserve-parent-folder-checkbox");
            this.deleteInputFiles = this._createCheckbox("delete-input-files-checkbox");
        },

        _renderSourceFileExplorer: function () {
            var globalSelf = this;

            var fileSrcExplorerPromise = MIUIComponent.FileExplorer({
                el: globalSelf.$el.find("#file-zip-src-explorer-component"),
                activityId: globalSelf.activityId,
                reqres: globalSelf.designerReqres,
                data: globalSelf.initialData
            });

            fileSrcExplorerPromise.done(function (comp) {
                globalSelf.srcTabFileExplorer = comp;

                if (globalSelf.srcTabFileExplorerModel) {
                    globalSelf._refreshFileExplorer(globalSelf.srcTabFileExplorer, globalSelf.srcTabFileExplorerModel);
                    globalSelf.srcTabFileExplorerModel = null;
                }
            });
        },

        _renderSystemConnComponent: function () {
            var globalSelf = this, connData = null;

            if (this.initialData && this.initialData['selectSourceConnection'] != undefined) {
                connData = {};
                connData['connectionComboBox'] = this.initialData['selectSourceConnection'];
                connData['relativefilepath'] = this.initialData['relativePathSourceEbl'];
            }

            this._fetchPluginTypes().done((PLUGIN_TYPE) => {
                if (PLUGIN_TYPE) {
                    var fileConnSrcTabPromise = MIUIComponent.FileSystemConnComponent({
                        el: globalSelf.$el.find("#file-zip-src-system-conn-comp"),
                        activityId: globalSelf.activityId,
                        reqres: globalSelf.designerReqres,
                        activityReqres: globalSelf.activityReqres,
                        data: connData,
                        pluginType: PLUGIN_TYPE
                    });

                    fileConnSrcTabPromise.done((comp) => {
                        globalSelf.fileConnSourceTabComp = comp;

                        globalSelf.listenTo(
                            globalSelf.fileConnSourceTabComp,
                            constants.EVENTS.CHANGE_CONNECTION_VARIABLE,
                            globalSelf._changeSourceConn.bind(globalSelf)
                        );

                        globalSelf.listenTo(
                            globalSelf.fileConnSourceTabComp,
                            constants.EVENTS.REFRESH_CONNECTION,
                            globalSelf._refreshSourceFileExplorer.bind(globalSelf)
                        );

                        globalSelf.listenTo(
                            globalSelf.fileConnSourceTabComp,
                            constants.EVENTS.INITIAL_CONNECTION_FETCH,
                            globalSelf._refreshSrcExplorerAndFilterColsInitialConn.bind(globalSelf)
                        );

                        globalSelf.listenTo(
                            globalSelf.fileConnSourceTabComp,
                            constants.EVENTS.INVALID_CONNECTION_SELECTED,
                            globalSelf._clearSrcFileExplorer.bind(globalSelf)
                        );

                        if (globalSelf.error) {
                            globalSelf.fileConnSourceTabComp.highlightErrors([globalSelf.error]);
                        }
                    });
                }
            });
        },

        _changeSourceConn: function (data) {
            this._getFilterColumns();
            this._refreshSourceFileExplorer(data);
            this.fileConnDestTabComp.setOtherConnection(data.connectionId);
        },

        _clearSrcFileExplorer: function (data) {
            this.srcTabFileExplorer.clearFileExplorer();
            this.fileConnDestTabComp.setOtherConnection(-100);
        },

        _refreshSourceFileExplorer: function (data) {
            this.srcTabFileExplorer.setData(data);
            this.srcTabFileExplorer.initialFetchFileList();
        },

        _refreshSrcExplorerAndFilterColsInitialConn: function (data) {
            this.initialSrcConnectionID = data.connectionId;
            this._getFilterColumns();

            if (this.srcTabFileExplorer)
                this._refreshSourceFileExplorer(data);
            else
                this.srcTabFileExplorerModel = data;
        },

        _renderConfigComponent: function () {
            let configBaseData = null, globalSelf = this;

            if (this.initialData && this.initialData['fileNamePattern'] != undefined) {
                configBaseData = {};
                configBaseData['filepattern'] = this.initialData['fileNamePattern'];
                configBaseData['isrecursive'] = this.initialData['isRecursive'];
                configBaseData['fileSelectionCriteriaFilter'] = this.initialData['fileFilter'];
            }

            var fileConfigCompPromise = MIUIComponent.FileConfigBaseComponent({
                el: this.$el.find("#file-zip-file-selection-comp"),
                activityId: this.activityId,
                data: configBaseData,
                reqres: this.designerReqres,
                activityReqres: this.activityReqres,
                initialData: { 'columnList': globalSelf.fileSelectionColumnList ? globalSelf.fileSelectionColumnList : [] }
            });

            fileConfigCompPromise.done((comp) => {
                this.fileSelectionComponent = comp;
                this._togglePreserveFolder();
            });
        },

        _getFilterColumns: function () {
            var globalSelf = this, connId = this.fileConnSourceTabComp.getSelectedConnection();

            if (connId) {
                var promise = AjaxUtility.commonAjaxSyncRequest('GET', "activities/FileZip/getFileSelectionColumns?connId=" + connId, null, 'json');

                promise.done(function (colList) {
                    if (globalSelf.fileSelectionComponent)
                        globalSelf.fileSelectionComponent.setColumnList(colList);
                    else
                        globalSelf.fileSelectionColumnList = colList;
                });

                promise.fail(function (e) {
                    uilayer.notifier('error', window.app.reqres.request("getError", e).message);
                });
            }
        },

        _createCheckbox: function (elem) {
            return uilayer.checkbox({
                elem: this.$el.find("." + elem)
            });
        },

        _renderDestTabExplorerDrawer: function () {
            this.destTabFileExplorerDrawer = uilayer.drawer({
                elem: this.$el.find('#file-zip-dest-tab-container'),
                section: {
                    'file-zip-dest-explorer-section': {
                        position: 'right',
                        toggleHandle: true,
                        resizable: true,
                        dimensionValue: '50%',
                        min: '30%',
                        max: '65%'
                    }
                }
            });
        },

        _renderDestinationTabComponents: function () {
            this._renderDestTabFileExplorer();
            let promise = this._renderDestSystemConnComponent();
            return promise;
        },

        _renderDestTabFileExplorer: function () {
            var globalSelf = this;

            var fileDestExplorerPromise = MIUIComponent.FileExplorer({
                el: globalSelf.$el.find("#file-zip-dest-explorer-component"),
                activityId: globalSelf.activityId,
                reqres: globalSelf.designerReqres,
                data: globalSelf.initialData
            });

            fileDestExplorerPromise.done(function (comp) {
                globalSelf.destTabFileExplorer = comp;

                if (globalSelf.destTabFileExplorerModel) {
                    globalSelf._refreshFileExplorer(globalSelf.destTabFileExplorer, globalSelf.destTabFileExplorerModel);
                    globalSelf.destTabFileExplorerModel = null;
                }
            });
        },

        _renderDestSystemConnComponent: function () {
            var globalSelf = this, connData = null;
            let deferred = $.Deferred();

            if (this.initialData && this.initialData['selectDestConnection'] != undefined) {
                connData = {};
                connData['connectionComboBox'] = this.initialData['selectDestConnection'];
                connData['relativefilepath'] = this.initialData['relativePathDestEbl'];
            }

            this._fetchPluginTypes().done((PLUGIN_TYPE) => {
                if (PLUGIN_TYPE) {
                    var fileConnDestTabPromise = MIUIComponent.FileSystemConnComponent({
                        el: globalSelf.$el.find("#file-zip-dest-system-conn-comp"),
                        activityId: globalSelf.activityId,
                        reqres: globalSelf.designerReqres,
                        activityReqres: globalSelf.activityReqres,
                        data: connData,
                        pluginType: PLUGIN_TYPE
                    });

                    fileConnDestTabPromise.done((comp) => {
                        globalSelf.fileConnDestTabComp = comp;

                        globalSelf.listenTo(
                            globalSelf.fileConnDestTabComp,
                            constants.EVENTS.CHANGE_CONNECTION_VARIABLE,
                            globalSelf._changeDestConn.bind(globalSelf)
                        );

                        globalSelf.listenTo(
                            globalSelf.fileConnDestTabComp,
                            constants.EVENTS.REFRESH_CONNECTION,
                            globalSelf._refreshDestFileExplorer.bind(globalSelf)
                        );

                        globalSelf.listenTo(
                            globalSelf.fileConnDestTabComp,
                            constants.EVENTS.INITIAL_CONNECTION_FETCH,
                            globalSelf._refreshDestExplorerFromInitialConn.bind(globalSelf)
                        );

                        globalSelf.listenTo(
                            globalSelf.fileConnDestTabComp,
                            constants.EVENTS.INVALID_CONNECTION_SELECTED,
                            globalSelf._clearDestFileExplorer.bind(globalSelf)
                        );

                        if (globalSelf.error) {
                            globalSelf.fileConnDestTabComp.highlightErrors([globalSelf.error]);
                        }

                        deferred.resolve();
                    });
                } else {
                    deferred.resolve();
                }
            }).fail(() => {
                deferred.reject();
            });

            return deferred.promise();
        },

        _changeDestConn: function (data) {
            this._refreshDestFileExplorer(data);
            this.fileConnSourceTabComp.setOtherConnection(data.connectionId);
        },

        _refreshDestFileExplorer: function (data) {
            this.destTabFileExplorer.setData(data);
            this.destTabFileExplorer.initialFetchFileList();
        },

        _clearDestFileExplorer: function (data) {
            this.destTabFileExplorer.clearFileExplorer();
            this.fileConnSourceTabComp.setOtherConnection(-100);
        },

        _refreshDestExplorerFromInitialConn: function (data) {
            if (this.fileConnSourceTabComp)
                this.fileConnSourceTabComp.setOtherConnection(data.connectionId);

            if (this.fileConnDestTabComp)
                this.fileConnDestTabComp.setOtherConnection(this.initialSrcConnectionID);

            if (this.destTabFileExplorer)
                this._refreshDestFileExplorer(data);
            else
                this.destTabFileExplorerModel = data;
        },

        _renderExpressionBuilder: function (elemId) {
            var globalSelf = this;
            var element = globalSelf.$el.find("#" + elemId);

            var configData = {
                processModel: this.processModel,
                activityID: this.activityId,
                tabName: "CONFIGURATION"
            };

            var value = "";
            if (this.model.getKey(elemId)) {
                value = this.model.getKey(elemId);
            }

            return ExpressionBuilderUtility.render(element, ExpressionBuilderLauncherTypes.PROCESS_CONTEXT, configData, value, null);
        },

        _renderArchiveType: function () {
            this._getArchiveTypeList();

            this.archiveType = uilayer.dropDownList({
                elem: this.$el.find("#archiveType"),
                dataSource: this.archiveTypeList,
                dataValueField: "value",
                dataTextField: "label",
                change: () => {
                    this.model.set("archiveType", this.archiveType.value());
                }
            });

            this.archiveType.value(this.model.get("archiveType") || constants.ARCHIVE_TYPE_FIELDS["ZIP"]);
        },

        _getArchiveTypeList: function () {
            let archiveType = constants.ARCHIVE_TYPE_FIELDS;
            let list = [];

            for (let key in archiveType) {
                list.push({
                    value: archiveType[key],
                    label: nls[key]
                });
            }

            this.archiveTypeList = list;
        },

        _setValuesFromModel: function () {
            var modelValues = this.model.attributes;

            this.$el.find('.preserve-folder-checkbox').attr('checked', modelValues.preserveFolder);
            this.$el.find('.preserve-parent-folder-checkbox').attr('checked', modelValues.preserveParentFolder);
            this.$el.find('.delete-input-files-checkbox').attr('checked', modelValues.deleteInputFiles);
        },

        highlightErrors: function (errorObject) {
            let globalSelf = this;

            if (errorObject && errorObject.length > 0) {
                _.each(errorObject, function (error) {
                    if (constants.EXP_VALIDATE_ADDSTRING[error.path] != undefined)
                        error.path = constants.EXP_VALIDATE_ADDSTRING[error.path] + error.path;

                    let pathArray = error.path.split("/");
                    let tabId = constants.TAB_ID[pathArray[0]], component = constants.COMPONENTS[pathArray[1]],
                        field = pathArray[2];

                    globalSelf.tabstrip.select(tabId);

                    error.path = constants.ERRORPATHS[field];
                    globalSelf.error = error;

                    if (component !== constants.COMPONENTS.ACTIVITY && globalSelf[component])
                        globalSelf[component].highlightErrors([globalSelf.error]);
                    else
                        MIUIComponentI.prototype.highlightErrors.call(globalSelf, [globalSelf.error]);
                });
            }
        },

        getErrorMessage: function () {
            return [];
        },

        _checkBeforeDestroy: function _checkBeforeDestroy(obj) {
            if (obj !== null && obj !== undefined) {
                obj.destroy();
                obj = null;
            }
        },

        onBeforeDestroy: function () {
            this.activityId = null;
            this.designerReqres = null;
            this.activityReqres = null;
            this.initialData = null;

            this.srcTabFileExplorerModel = null;
            this.destTabFileExplorerModel = null;
            this.fileSelectionColumnList = null;

            this._checkBeforeDestroy(this.preserveFolder);
            this._checkBeforeDestroy(this.preserveParentFolder);
            this._checkBeforeDestroy(this.deleteInputFiles);

            this.fileConnSourceTabComp?.onDestroy();
            this.fileSelectionComponent?.onDestroy();
            this.srcTabFileExplorer?.onDestroy();
            this.fileConnDestTabComp?.onDestroy();
            this.destTabFileExplorer?.onDestroy();

            this.srcTabFileExplorerDrawer?.destroy();
            this.destTabFileExplorerDrawer?.destroy();
            this.tabstrip?.destroy();
        }
    });

    return FileZip;
});
