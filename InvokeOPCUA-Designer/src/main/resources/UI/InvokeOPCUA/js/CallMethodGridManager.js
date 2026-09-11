define([
    "uilayer",
    "./GridUtils",
    "./ExpressionBuilderManager",
    "Components/ExpressionBuilderUtility/ExpressionBuilderUtility"
], function (uilayer, GridUtils, ExpressionBuilderManager, ExpressionBuilderUtility) {
    "use strict";

    var CallMethodGridManager = {

        _outputValueEditor: function (container, options) {
            var currentVal = options.model?.get ? options.model.get(options.field) : options.model?.[options.field];
            if (options.model) {
                options.model._oldOutputValue = currentVal || "";
            }

            var input = $("<input type='text' class='ul-textbox' name='" + options.field + "' data-bind='value:" + options.field + "'/>");
            input.val(currentVal || "");
            container.append(input);
        },

        refreshGridMode: function (globalSelf) {
            if (!globalSelf?.callMethodGrid) {
                return;
            }

            var currentData = globalSelf.callMethodGrid?.widget?.dataSource?.data?.()?.toJSON?.();
            if (currentData?.length) {
                globalSelf.model.setKey("callMethod", currentData);
            }

            globalSelf._destroyComponent(globalSelf.callMethodGrid);
            globalSelf.callMethodGrid = null;

            globalSelf.$(".cvt-grid-div-call-method").empty();

            if (globalSelf.$(".call-method-radio").is(":checked")) {
                this.renderCallMethodComponent(globalSelf);
            }
        },

        _getCallMethodColumns: function (globalSelf) {
            return [
                {
                    selectable: true,
                    width: "55px"
                },
                {
                    field: "name",
                    title: globalSelf?.nls?.MethodNode,
                    width: "30%",
                    attributes: { "class": "methodNode name nodeId" },
                    template: GridUtils.getMethodNodeTemplate(globalSelf),
                    editable: function () {
                        return false;
                    },
                    filterable: true
                },
                {
                    field: "objectNodeId",
                    title: globalSelf?.nls?.ParentObjectNode,
                    width: "30%",
                    attributes: { "class": "parentObjectNode objectNodeId" },
                    template: GridUtils.getParentObjectNodeTemplate(globalSelf),
                    editable: function () {
                        return false;
                    },
                    filterable: true
                },
                {
                    field: "inputParameters",
                    title: globalSelf.nls.InputParameters,
                    width: "20%",
                    attributes: { "class": "inputParameters" },
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getInputParametersTemplate(globalSelf),
                    filterable: false,
                    sortable: false
                },
                {
                    field: "outputValue",
                    title: globalSelf?.nls?.OutputParameter || globalSelf?.nls?.OutputValue,
                    width: "20%",
                    attributes: { "class": "outputValue outputParameter" },
                    template: GridUtils.getOutputValueTemplate,
                    editor: this._outputValueEditor,
                    editable: function () {
                        return true;
                    },
                    filterable: false
                }
            ];
        },

        _getCallMethodDataSource: function (data) {
            return {
                data: data,
                pageSize: 50,
                schema: {
                    model: {
                        id: "rowId",
                        fields: {
                            rowId: {
                                type: "number",
                                editable: false,
                                nullable: true
                            },
                            name: {
                                type: "string",
                                parse: GridUtils.parseStringField
                            },
                            nodeId: {
                                type: "string",
                                editable: false
                            },
                            objectName: {
                                type: "string",
                                parse: GridUtils.parseStringField
                            },
                            objectNodeId: {
                                type: "string",
                                editable: false
                            },
                            inputParameters: {
                                editable: false
                            },
                            outputValue: {
                                type: "string",
                                parse: GridUtils.parseStringField
                            },
                            fieldId: {
                                type: "string",
                                editable: false
                            }
                        }
                    }
                }
            };
        },

        _resizeGridIfExists: function (grid) {
            return GridUtils.resizeGridIfExists(grid);
        },

        onOutputValueChange: function (globalSelf, model) {
            var newVarName = (model?.get ? model.get("outputValue") : model?.outputValue) || "";
            newVarName = newVarName.trim();
            var oldVarName = model?._oldOutputValue || "";

            if (newVarName === oldVarName) {
                return;
            }

            model._oldOutputValue = newVarName;

            var grid = globalSelf.callMethodGrid?.widget || globalSelf.callMethodGrid;
            if (!grid?.dataSource) {
                return;
            }

            var allData = grid.dataSource.data?.()?.toJSON?.() || [];
            this.syncOutputVariablesWithProcessModel(globalSelf, allData);
        },

        getOutputVariables: function (globalSelf) {
            var grid = globalSelf?.callMethodGrid?.widget || globalSelf?.callMethodGrid;
            var data = grid?.dataSource
                ? (grid.dataSource.data?.()?.toJSON?.() || [])
                : (globalSelf?.model?.getKey("callMethod") || []);

            return data.map(function (item) {
                return {
                    id: item.fieldId || item.uid,
                    fieldId: item.fieldId || item.uid,
                    name: item.name || "",
                    outputValue: (item.outputValue || "").trim(),
                    outputVariable: (item.outputValue || "").trim()
                };
            });
        },

        syncOutputVariablesWithProcessModel: function (globalSelf, gridData) {
            if (!globalSelf?.processModel) {
                return;
            }

            var activeEntity = globalSelf.processModel.getBPMEntityById(globalSelf.activityId);
            if (!activeEntity) {
                return;
            }

            var existingVariables = activeEntity.getOutputVariables?.() || [];
            var newVariables = [];

            (gridData || []).forEach(function (item) {
                var varName = (item.outputValue || item.outputVariable || "").trim();
                if (varName) {
                    newVariables.push({
                        id: item.fieldId || item.id,
                        name: varName,
                        type: "String",
                        description: "Output of method " + (item.name || "")
                    });
                }
            });

            activeEntity.setOutputVariables?.(newVariables);
            globalSelf.processModel.trigger?.("change:outputVariables", activeEntity);
        },

        removeOutputVariablesFromProcessModel: function (deletedItems, globalSelf) {
            if (!globalSelf?.processModel || !deletedItems?.length) {
                return;
            }

            var activeEntity = globalSelf.processModel.getBPMEntityById(globalSelf.activityId);
            if (!activeEntity) {
                return;
            }

            var deletedFieldIds = deletedItems.map(function (item) {
                return item.fieldId || item.uid;
            });

            var existing = activeEntity.getOutputVariables?.() || [];
            var remaining = existing.filter(function (v) {
                return deletedFieldIds.indexOf(v.id) === -1;
            });

            activeEntity.setOutputVariables?.(remaining);
            globalSelf.processModel.trigger?.("change:outputVariables", activeEntity);
        },

        renderCallMethodComponent: function (globalSelf) {
            if (this._resizeGridIfExists(globalSelf?.callMethodGrid)) {
                return;
            }

            var data = globalSelf.model.getKey("callMethod") || [];
            if (!data.length) {
                data = [{
                    name: "",
                    nodeId: "",
                    objectName: "",
                    objectNodeId: "",
                    inputParameters: [],
                    outputValue: "",
                    fieldId: "CM_" + Date.now() + "_0"
                }];
                globalSelf.model.setKey("callMethod", data);
            }

            globalSelf.callMethodGrid = uilayer.grid({
                elem: globalSelf.$(".cvt-grid-div-call-method"),
                toolbar: GridUtils.getOperationGridToolbar("call-method-search", globalSelf.nls),
                editable: {
                    mode: "incell",
                    createAt: "bottom"
                },
                navigatable: true,
                createAt: "bottom",
                afterCreate: true,
                resizable: true,
                sortable: true,
                filterable: true,
                scrollable: false,
                columns: this._getCallMethodColumns(globalSelf),
                dataSource: this._getCallMethodDataSource(data)
            });

            if (globalSelf.callMethodGrid?.widget) {
                var manager = this;
                globalSelf.callMethodGrid.widget.bind("save", function (e) {
                    if (e.values && e.values.outputValue !== undefined) {
                        setTimeout(function () {
                            manager.onOutputValueChange(globalSelf, e.model);
                        }, 50);
                    }
                });
            }

            this._bindGridEvents(globalSelf);

            globalSelf.callMethodSearchBar = GridUtils.renderGridSearchBar(
                "call-method-search",
                globalSelf.callMethodGrid,
                ["name", "nodeId", "objectNodeId", "objectName", "outputValue"],
                globalSelf,
                globalSelf.nls
            );
        },

        _bindGridEvents: function (globalSelf) {
            GridUtils.initializeGridHelpTooltips(globalSelf.$(".cvt-grid-div-call-method"));

            var handleBrowseClick = function (btn, targetMode) {
                var row = $(btn).closest("tr");
                var grid = globalSelf.callMethodGrid?.widget || globalSelf.callMethodGrid;
                if (!grid) return;

                var dataItem = grid.dataItem?.(row);
                if (!dataItem) return;

                var connData = globalSelf.getConnectionPayload?.();
                if (!connData?.connectionId) {
                    uilayer.notifier("warning", globalSelf?.nls?.SelectConnection);
                    return;
                }

                globalSelf.addressSpaceBrowser?.openForBrowse?.(dataItem, targetMode, connData);
            };

            var $container = globalSelf.$(".cvt-grid-div-call-method");
            $container.off("click", ".browse-call-method-btn").on("click", ".browse-call-method-btn", function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleBrowseClick(this, "CALL_METHOD");
            });

            $container.off("click", ".browse-parent-object-btn").on("click", ".browse-parent-object-btn", function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleBrowseClick(this, "PARENT_OBJECT");
            });
        },

        onInputParameterBadgeClick: function (event, globalSelf) {
            var target = $(event.currentTarget);
            var row = target.closest("tr");
            var grid = globalSelf.callMethodGrid?.widget || globalSelf.callMethodGrid;
            if (!grid) {
                return;
            }

            var dataItem = grid.dataItem?.(row);
            if (!dataItem) {
                return;
            }

            globalSelf.selectedCallMethodRow = dataItem;
            this._openInputParametersModal(globalSelf, dataItem);
        },

        _openInputParametersModal: function (globalSelf, dataItem) {
            var manager = this;
            var params = (dataItem.get ? dataItem.get("inputParameters") : dataItem.inputParameters) || [];

            if (this.inputParamsModal) {
                this._destroyInputParametersModal(globalSelf);
            }

            var modalContainer = $("<div id='input-parameters-modal-window'></div>");
            $("body").append(modalContainer);

            var contentHtml = "<div class='input-parameters-modal-wrapper ul-pad-2x'>" +
                "<div class='input-parameters-modal-grid cvt-grid-div'></div>" +
                "<div class='ul-pad-2x-t ul-flex-container ul-space-between'>" +
                "<button type='button' class='ul-primary-button input-params-save-btn'>" + globalSelf.nls.Save + "</button>" +
                "<button type='button' class='ul-secondary-button input-params-cancel-btn'>" + globalSelf.nls.Cancel + "</button>" +
                "</div>" +
                "</div>";

            this.inputParamsModal = uilayer.modal({
                elem: modalContainer,
                actions: ["Close"],
                draggable: true,
                modal: true,
                width: "600px",
                title: globalSelf.nls.InputParameters + ": " + (dataItem.name || dataItem.nodeId || ""),
                visible: false,
                content: contentHtml
            });

            var clonedParams = JSON.parse(JSON.stringify(params));
            this._renderInputParamsGrid(modalContainer.find(".input-parameters-modal-grid"), clonedParams, globalSelf);

            modalContainer.find(".input-params-save-btn").on("click", function () {
                var grid = manager.inputParamsGrid?.widget || manager.inputParamsGrid;
                var updated = grid?.dataSource?.data?.()?.toJSON?.() || clonedParams;

                updated.forEach(function (param) {
                    if (param.value && typeof param.value === "object") {
                        param.value = ExpressionBuilderUtility.getExpression(param.value);
                    }
                });

                if (dataItem.set) {
                    dataItem.set("inputParameters", updated);
                } else {
                    dataItem.inputParameters = updated;
                }

                globalSelf.callMethodGrid?.widget?.refresh?.();

                manager._destroyInputParametersModal(globalSelf);
            });

            modalContainer.find(".input-params-cancel-btn").on("click", function () {
                manager._destroyInputParametersModal(globalSelf);
            });

            this.inputParamsModal?.open?.()?.center?.();
        },

        _renderInputParamsGrid: function (elem, paramsData, globalSelf) {
            this.inputParamsGrid = uilayer.grid({
                elem: elem,
                editable: {
                    mode: "incell"
                },
                scrollable: false,
                columns: [
                    {
                        field: "name",
                        title: globalSelf.nls.ParameterName,
                        width: "30%",
                        editable: function () {
                            return false;
                        }
                    },
                    {
                        field: "type",
                        title: globalSelf.nls.DataType,
                        width: "25%",
                        editable: function () {
                            return false;
                        }
                    },
                    {
                        field: "value",
                        title: globalSelf.nls.Value,
                        width: "45%",
                        customEditor: true,
                        template: ExpressionBuilderManager.getTemplate("value", globalSelf),
                        editor: ExpressionBuilderManager.getEditor("value", globalSelf)
                    }
                ],
                dataSource: {
                    data: paramsData,
                    schema: {
                        model: {
                            id: "name",
                            fields: {
                                name: { type: "string", editable: false },
                                type: { type: "string", editable: false },
                                value: { type: "string" },
                                description: { type: "string", editable: false }
                            }
                        }
                    }
                }
            });
        },

        _destroyInputParametersModal: function () {
            this.inputParamsGrid?.destroy?.();
            this.inputParamsGrid = null;
            this.inputParamsModal?.destroy?.();
            this.inputParamsModal = null;
            $("#input-parameters-modal-window").remove();
        }
    };

    return CallMethodGridManager;
});
