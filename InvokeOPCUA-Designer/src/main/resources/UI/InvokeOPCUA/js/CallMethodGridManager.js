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
            if (!globalSelf?.processModel || !model) {
                return;
            }

            var newVal = (model.get ? model.get("outputValue") : model.outputValue) || "";
            newVal = typeof newVal === "string" ? newVal.trim() : "";
            var oldVal = ((model._oldOutputValue !== undefined ? model._oldOutputValue : "") || "").trim();

            if (newVal === oldVal) {
                return;
            }

            var fieldId = model.get ? model.get("fieldId") : model.fieldId;
            if (!fieldId) {
                fieldId = "CM_" + (model.uid || Math.random().toString(36).substr(2, 9));
                if (model.set) {
                    model.set("fieldId", fieldId);
                } else {
                    model.fieldId = fieldId;
                }
            }

            var gridData = this._getOutputVariablesGridData(globalSelf);

            if (oldVal && oldVal !== newVal) {
                this._addOldVariableName(gridData, oldVal, fieldId);
            }

            if (newVal) {
                globalSelf.processModel.addVariable(gridData, fieldId, globalSelf.activityId, "CONFIGURATION");
            } else if (oldVal) {
                globalSelf.processModel.removeVariable(oldVal, "", globalSelf.activityId, "CONFIGURATION", fieldId, 0);
            }

            model._oldOutputValue = newVal;
        },

        _getOutputVariablesGridData: function (globalSelf) {
            var gridData = [];
            if (globalSelf.callMethodGrid?.widget?.dataSource) {
                var data = globalSelf.callMethodGrid.widget.dataSource.data().toJSON();
                _.each(data, function (item, index) {
                    var val = (item.outputValue || "").trim();
                    if (val) {
                        gridData.push({
                            variableName: val,
                            expression: "",
                            fieldId: item.fieldId || ("CM_" + (item.uid || index))
                        });
                    }
                });
            }
            return gridData;
        },

        _addOldVariableName: function (gridData, oldName, fieldId) {
            _.each(gridData, function (variable) {
                if (variable.fieldId === fieldId && variable.variableName !== oldName) {
                    variable.oldName = oldName;
                }
            });
        },

        onDeleteCallMethodRows: function (globalSelf, deletedDataItems) {
            if (!globalSelf?.processModel || !deletedDataItems?.length) {
                return;
            }

            deletedDataItems.forEach(function (item, idx) {
                var outputVal = item.get ? item.get("outputValue") : item.outputValue;
                var fieldId = item.get ? item.get("fieldId") : item.fieldId;
                if (outputVal && typeof outputVal === "string" && outputVal.trim()) {
                    globalSelf.processModel.removeVariable(
                        outputVal.trim(),
                        "",
                        globalSelf.activityId,
                        "CONFIGURATION",
                        fieldId || ("CM_" + idx),
                        idx
                    );
                }
            });
        },

        removeOutputVariablesFromProcessModel: function (deletedItems, globalSelf) {
            this.onDeleteCallMethodRows(globalSelf, deletedItems);
        },

        renderCallMethodComponent: function (globalSelf) {
            var manager = this;

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
            } else if (data.length) {
                _.each(data, function (item, idx) {
                    if (!item.fieldId) {
                        item.fieldId = "CM_" + (item.nodeId || idx) + "_" + idx;
                    }
                });
            }

            if (globalSelf.processModel && data.length) {
                var initialGridData = [];
                _.each(data, function (item, idx) {
                    var val = (item.outputValue || "").trim();
                    if (val) {
                        initialGridData.push({
                            variableName: val,
                            expression: "",
                            fieldId: item.fieldId || ("CM_" + (item.nodeId || idx) + "_" + idx)
                        });
                    }
                });
                if (initialGridData.length) {
                    _.each(initialGridData, function (v) {
                        globalSelf.processModel.addVariable(initialGridData, v.fieldId, globalSelf.activityId, "CONFIGURATION");
                    });
                }
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

            var syncModel = function (e) {
                if (globalSelf.callMethodGrid?.widget?.dataSource) {
                    var gridData = globalSelf.callMethodGrid.widget.dataSource.data().toJSON();
                    globalSelf.model.setKey("callMethod", gridData);
                }
                if (e?.model) {
                    manager.onOutputValueChange(globalSelf, e.model);
                }
            };

            if (globalSelf.callMethodGrid?.widget) {
                globalSelf.callMethodGrid.widget.bind("save", syncModel);
                globalSelf.callMethodGrid.widget.bind("cellClose", syncModel);
                globalSelf.callMethodGrid.widget.bind("change", syncModel);
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

        _copyInputParameters: function (inputParameters) {
            return (inputParameters || []).map(function (parameter) {
                var typeStr = parameter.dataType || parameter.type || "String";
                return {
                    name: parameter.name ||
                        parameter.parameterName ||
                        parameter.displayName ||
                        "",
                    dataType: typeStr,
                    type: typeStr,
                    value: parameter.value || "",
                    description: parameter.description || ""
                };
            });
        },

        onInputParameterBadgeClick: function (event, globalSelf) {
            event.preventDefault();
            event.stopPropagation();

            var badge = $(event.currentTarget);
            if (badge.is(":disabled") || badge.hasClass("disabled") || badge.attr("disabled")) {
                return;
            }

            var row = badge.closest("tr");
            var grid = globalSelf.callMethodGrid ? (globalSelf.callMethodGrid.widget || globalSelf.callMethodGrid) : null;
            if (!grid) {
                return;
            }

            var dataItem = grid.dataItem ? grid.dataItem(row) : null;
            if (!dataItem) {
                return;
            }

            var methodName = ((dataItem.get ? dataItem.get("name") : dataItem.name) || "").trim();
            var nodeId = ((dataItem.get ? dataItem.get("nodeId") : dataItem.nodeId) || "").trim();
            if (!methodName && !nodeId) {
                return;
            }

            globalSelf.selectedCallMethodRow = dataItem;
            this.openInputParametersModal(globalSelf, dataItem, badge);
        },

        _createInputParametersModalGrid: function (gridElement, inputParameters, globalSelf) {
            return uilayer.grid({
                elem: gridElement,
                editable: {
                    mode: "incell"
                },
                navigatable: true,
                resizable: true,
                sortable: false,
                filterable: false,
                scrollable: false,
                columns: [
                    {
                        field: "name",
                        title: globalSelf?.nls?.ParameterName || "Parameter Name",
                        editable: false,
                        attributes: { "class": "name" },
                        width: "30%"
                    },
                    {
                        field: "dataType",
                        title: globalSelf?.nls?.DataType || "Data Type",
                        editable: false,
                        attributes: { "class": "dataType" },
                        width: "30%"
                    },
                    {
                        field: "value",
                        title: globalSelf?.nls?.Value || "Value",
                        width: "40%",
                        customEditor: true,
                        attributes: { "class": "value" },
                        template: ExpressionBuilderManager.getTemplate("value", globalSelf),
                        editor: ExpressionBuilderManager.getEditor("value", globalSelf)
                    }
                ],
                dataSource: {
                    data: inputParameters,
                    schema: {
                        model: {
                            id: "name",
                            fields: {
                                name: {
                                    type: "string",
                                    editable: false
                                },
                                dataType: {
                                    type: "string",
                                    editable: false
                                },
                                type: {
                                    type: "string",
                                    editable: false
                                },
                                value: {
                                    type: "string",
                                    parse: GridUtils.parseStringField
                                },
                                description: {
                                    type: "string",
                                    editable: false
                                }
                            }
                        }
                    }
                }
            });
        },

        openInputParametersModal: function (globalSelf, dataItem, anchorElem) {
            var manager = this;

            var methodName = (dataItem.get ? dataItem.get("name") : dataItem.name) || "";

            var inputParameters = dataItem.get
                ? dataItem.get("inputParameters")
                : dataItem.inputParameters;

            inputParameters = this._copyInputParameters(inputParameters || []);

            this._destroyInputParametersModal(globalSelf);

            var $popoverWrapper = $(
                "<div class='input-parameters-modal-wrapper'>" +
                "<div class='ul-pad-2x-b'>" +
                "<div class='ul-body-m-b'>" + (globalSelf?.nls?.InputParameters || "Input Parameters") + "</div>" +
                "</div>" +
                "<div class='input-parameters-modal-grid'></div>" +
                "</div>"
            );

            globalSelf.$el.append($popoverWrapper);
            globalSelf._inputParametersModalWrapper = $popoverWrapper;

            var gridElement = $popoverWrapper.find(".input-parameters-modal-grid");
            globalSelf.inputParametersModalGrid = this._createInputParametersModalGrid(gridElement, inputParameters, globalSelf);

            var $anchor = (anchorElem && $(anchorElem).length) ? $(anchorElem) : globalSelf.$el;

            var saveHandler = function (e) {
                var updatedParameters = [];

                if (globalSelf.inputParametersModalGrid?.widget?.dataSource) {
                    updatedParameters = globalSelf.inputParametersModalGrid
                        .widget.dataSource.data().toJSON();
                }

                _.each(updatedParameters, function (param) {
                    if (param?.value && typeof param.value === "object") {
                        param.value = ExpressionBuilderUtility.getExpression(param.value);
                    }
                    if (!param.type && param.dataType) {
                        param.type = param.dataType;
                    }
                    if (!param.dataType && param.type) {
                        param.dataType = param.type;
                    }
                });

                if (dataItem.set) {
                    dataItem.set("inputParameters", updatedParameters);
                } else {
                    dataItem.inputParameters = updatedParameters;
                }

                if (globalSelf.callMethodGrid?.widget) {
                    globalSelf.callMethodGrid.widget.refresh();
                }

                if (e?.sender?.close) {
                    e.sender.close();
                }

                manager._destroyInputParametersModal(globalSelf, true);
            };

            var cancelHandler = function (e) {
                if (e?.sender?.close) {
                    e.sender.close();
                }

                manager._destroyInputParametersModal(globalSelf, true);
            };

            globalSelf.inputParametersModal = uilayer.popOver({
                elem: $popoverWrapper,
                anchor: $anchor,
                pinPopover: true,
                width: 580,
                title: (globalSelf?.nls?.AddMethodCall || "Add Method Call") + " " + (methodName || ""),
                popupPosition: "left",
                actions: ['close'],
                buttons: [
                    {
                        label: globalSelf?.nls?.Cancel || "Cancel",
                        action: "cancel",
                        uiStyle: "tertiary"
                    },
                    {
                        label: globalSelf?.nls?.Save || "Save",
                        action: "save",
                        uiStyle: "primary"
                    }
                ],
                cancel: cancelHandler,
                save: saveHandler,
                ok: saveHandler,
                messages: {
                    ok: globalSelf?.nls?.Save || "Save",
                    cancel: globalSelf?.nls?.Cancel || "Cancel"
                },
                close: function () {
                    manager._destroyInputParametersModal(globalSelf, true);
                }
            });

            if (globalSelf.inputParametersModal) {
                if (typeof globalSelf.inputParametersModal.open === "function") {
                    globalSelf.inputParametersModal.open($anchor);
                } else if (globalSelf.inputParametersModal.widget && typeof globalSelf.inputParametersModal.widget.open === "function") {
                    globalSelf.inputParametersModal.widget.open($anchor);
                } else if (typeof globalSelf.inputParametersModal.show === "function") {
                    globalSelf.inputParametersModal.show();
                }
            }
        },

        _openInputParametersModal: function (globalSelf, dataItem, anchorElem) {
            this.openInputParametersModal(globalSelf, dataItem, anchorElem);
        },

        _destroyInputParametersModal: function (globalSelf, isFromCloseCallback) {
            if (globalSelf) {
                if (globalSelf.inputParametersModalGrid) {
                    globalSelf._destroyComponent(globalSelf.inputParametersModalGrid);
                    globalSelf.inputParametersModalGrid = null;
                }

                if (globalSelf.inputParametersModal) {
                    var popover = globalSelf.inputParametersModal;
                    globalSelf.inputParametersModal = null;

                    if (!isFromCloseCallback && popover?.close) {
                        popover.close();
                    }
                }

                if (globalSelf._inputParametersModalWrapper) {
                    var $wrapper = globalSelf._inputParametersModalWrapper;
                    globalSelf._inputParametersModalWrapper = null;
                    $wrapper.remove();
                }
            }
            this.inputParamsGrid?.destroy?.();
            this.inputParamsGrid = null;
            this.inputParamsModal?.destroy?.();
            this.inputParamsModal = null;
            $("#input-parameters-modal-window").remove();
        }

    };

    return CallMethodGridManager;
});
