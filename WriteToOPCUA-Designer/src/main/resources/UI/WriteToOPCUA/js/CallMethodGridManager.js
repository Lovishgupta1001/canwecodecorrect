define([
    "uilayer",
    "./GridUtils",
    "./ExpressionBuilderManager"
], function (uilayer, GridUtils, ExpressionBuilderManager) {
    "use strict";

    var CallMethodGridManager = {

        _outputValueEditor: function (container, options) {
            var input = $("<input type='text' class='ul-textbox' name='" + options.field + "'/>");
            container.append(input);
        },

        refreshGridMode: function (view) {
            var globalSelf = view;
            if (!globalSelf?.callMethodGrid) {
                return;
            }

            globalSelf._destroyComponent(globalSelf.callMethodGrid);
            globalSelf.callMethodGrid = null;

            globalSelf.$(".cvt-grid-div-call-method").empty();

            if (globalSelf.$(".call-method-radio").is(":checked")) {
                this.renderCallMethodComponent(globalSelf);
            }
        },

        _getCallMethodColumns: function (view) {
            var globalSelf = view;
            return [
                {
                    selectable: true,
                    width: 50
                },
                {
                    field: "methodName",
                    title: globalSelf.nls.MethodName,
                    template: function (dataItem) {
                        return "<div class='method-name-dropdown' data-row-uid='" + dataItem.uid + "'></div>";
                    },
                    editable: function () {
                        return false;
                    },
                    filterable: false
                },
                {
                    field: "nodeId",
                    title: globalSelf.nls.NodeId,
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getNodeIdTemplate("methodName"),
                    filterable: true
                },
                {
                    field: "inputParameters",
                    title: globalSelf.nls.InputParameters,
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getInputParametersTemplate(globalSelf),
                    filterable: false,
                    sortable: false
                },
                {
                    field: "outputValue",
                    title: globalSelf.nls.OutputValue,
                    template: GridUtils.getOutputValueTemplate,
                    editor: this._outputValueEditor,
                    editable: function () {
                        return true;
                    },
                    filterable: false
                },
                {
                    field: "action",
                    title: globalSelf.nls.Action,
                    template: GridUtils.getDeleteActionTemplate(globalSelf.nls),
                    filterable: false,
                    sortable: false,
                    editable: function () {
                        return false;
                    },
                    width: "6rem"
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
                            methodName: {
                                type: "string"
                            },
                            nodeId: {
                                type: "string",
                                editable: false
                            },
                            inputParameters: {
                                defaultValue: [],
                                editable: true
                            },
                            outputValue: {
                                type: "string"
                            },
                            action: {
                                type: "string",
                                editable: false
                            }
                        }
                    }
                }
            };
        },

        _resizeGridIfExists: function (grid) {
            if (grid?.widget) {
                grid.widget.resize();
                return true;
            }
            return false;
        },

        renderCallMethodComponent: function (view) {
            var globalSelf = view;
            if (this._resizeGridIfExists(globalSelf.callMethodGrid)) {
                return;
            }

            var data = globalSelf.model.getKey("callMethod") || [];

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
                scrollable: true,
                height: "13rem",
                columns: this._getCallMethodColumns(globalSelf),
                dataSource: this._getCallMethodDataSource(data)
            });

            if (globalSelf.callMethodGrid?.widget) {
                globalSelf.callMethodGrid.widget.bind(
                    "dataBound",
                    this._initializeMethodDropdowns.bind(this, globalSelf)
                );
            }

            this._initializeMethodDropdowns(globalSelf);

            globalSelf.callMethodSearchBar = GridUtils.renderGridSearchBar(
                "call-method-search",
                globalSelf.callMethodGrid,
                "methodName",
                globalSelf,
                globalSelf.nls
            );
        },

        _initializeMethodDropdowns: function (view) {
            var manager = this;
            var globalSelf = view;
            GridUtils.initializeGridHelpTooltips(globalSelf.$el);

            globalSelf.$(".method-name-dropdown").each(function () {
                var element = $(this);
                var row = element.closest("tr");
                var grid = globalSelf.callMethodGrid ? globalSelf.callMethodGrid.widget : null;

                if (!grid) {
                    return;
                }

                var dataItem = grid.dataItem(row);
                if (!dataItem) {
                    return;
                }

                var cell = element.closest("td");
                cell.off("click.prevent-incell-edit").on("click.prevent-incell-edit", function (e) {
                    e.stopPropagation();
                });
                element.off("click.prevent-incell-edit").on("click.prevent-incell-edit", function (e) {
                    e.stopPropagation();
                });

                var existingDropdown = element.data("uilayerDropDownList");
                if (existingDropdown) {
                    if (existingDropdown.setDataSource) {
                        existingDropdown.setDataSource(new uilayer.data.DataSource({
                            data: globalSelf.callMethodOptions || []
                        }));
                    }
                    return;
                }

                if (element.data("method-dropdown-initialized")) {
                    return;
                }
                element.data("method-dropdown-initialized", true);

                var dropdown = uilayer.dropDownList({
                    elem: element,
                    dataSource: new uilayer.data.DataSource({
                        data: globalSelf.callMethodOptions || []
                    }),
                    dataTextField: "methodName",
                    dataValueField: "methodName",
                    optionLabel: {
                        methodName: globalSelf.nls.SelectMethod
                    },
                    change: function () {
                        var selectedValue = this.value();
                        if (!selectedValue) {
                            return;
                        }

                        var selectedItem = this.dataItem();
                        if (!selectedItem) {
                            return;
                        }

                        var selectedData = selectedItem.toJSON
                            ? selectedItem.toJSON()
                            : selectedItem;

                        dataItem["methodName"]      = selectedData.methodName || selectedData.name || "";
                        dataItem["nodeId"]          = selectedData.nodeId     || "";
                        dataItem["objectNodeId"]    = selectedData.objectNodeId || "";
                        dataItem["inputParameters"] = manager._copyInputParameters(selectedData.inputParameters || selectedData.inputArguments);

                        var nodeIdCell = row.find("td:eq(2)");
                        var inputParamsCell = row.find("td:eq(3)");
                        if (nodeIdCell.length && grid.columns[2].template) {
                            nodeIdCell.html(grid.columns[2].template(dataItem));
                        }
                        if (inputParamsCell.length && grid.columns[3].template) {
                            inputParamsCell.html(grid.columns[3].template(dataItem));
                        }
                        GridUtils.initializeGridHelpTooltips(row);
                    }
                });

                var initialVal = dataItem.get ? dataItem.get("methodName") : dataItem.methodName;
                if (dropdown?.value) {
                    dropdown.value(initialVal || "");
                } else if (dropdown?.widget?.value) {
                    dropdown.widget.value(initialVal || "");
                }
            });
        },

        _copyInputParameters: function (inputParameters) {
            return (inputParameters || []).map(function (parameter) {
                return {
                    name: parameter.name ||
                        parameter.parameterName ||
                        parameter.displayName ||
                        "",
                    dataType: parameter.dataType || "",
                    value: parameter.value || ""
                };
            });
        },

        onInputParameterBadgeClick: function (event, view) {
            event.preventDefault();
            event.stopPropagation();

            var globalSelf = view;
            var badge = $(event.currentTarget);
            var row = badge.closest("tr");
            var grid = globalSelf.callMethodGrid ? globalSelf.callMethodGrid.widget : null;

            if (!grid) {
                return;
            }

            var dataItem = grid.dataItem(row);
            if (!dataItem) {
                return;
            }

            globalSelf.selectedCallMethodRow = dataItem;
            this.openInputParametersModal(globalSelf, dataItem, badge);
        },

        _createInputParametersModalGrid: function (gridElement, inputParameters, view) {
            var globalSelf = view;
            return uilayer.grid({
                elem: gridElement,
                editable: {
                    mode: "incell"
                },
                navigatable: true,
                resizable: true,
                sortable: false,
                filterable: false,
                scrollable: true,
                height: "10rem",
                columns: [
                    {
                        field: "name",
                        title: globalSelf.nls.ParameterName,
                        editable: false
                    },
                    {
                        field: "dataType",
                        title: globalSelf.nls.DataType,
                        editable: false
                    },
                    {
                        field: "value",
                        title: globalSelf.nls.Value,
                        template: GridUtils.getEditableValueTemplate(
                            "value",
                            "parameter-value-edit-icon"
                        ),
                        editor: function (container, options) {
                            ExpressionBuilderManager.parameterValueEditor(
                                container,
                                options,
                                globalSelf
                            );
                        }
                    }
                ],
                dataSource: {
                    data: inputParameters,
                    schema: {
                        model: {
                            fields: {
                                name: {
                                    type: "string",
                                    editable: false
                                },
                                dataType: {
                                    type: "string",
                                    editable: false
                                },
                                value: {
                                    type: "string",
                                    parse: GridUtils.parseStringField
                                }
                            }
                        }
                    }
                }
            });
        },

        openInputParametersModal: function (view, dataItem, anchorElem) {
            var manager = this;
            var globalSelf = view;

            var methodName = dataItem.get
                ? dataItem.get("methodName")
                : dataItem.methodName;

            var inputParameters = dataItem.get
                ? dataItem.get("inputParameters")
                : dataItem.inputParameters;

            inputParameters = this._copyInputParameters(inputParameters || []);

            this._destroyInputParametersModal(globalSelf);

            var $popoverWrapper = $(
                "<div class='input-parameters-modal-wrapper'>" +
                "<div class='ul-pad-2x-b'>" +
                "<label class='ul-body-m-b'>" + (globalSelf.nls.InputParameters) + "</label>" +
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
                height: "23rem",
                width: "30rem",
                title: (globalSelf.nls.AddMethodCall) + ": " + (methodName || ""),
                popupPosition: "left",
                actions: ["close"],
                buttons: [
                    {
                        label: globalSelf.nls.Cancel,
                        action: "cancel",
                        uiStyle: "tertiary"
                    },
                    {
                        label: globalSelf.nls.Save,
                        action: "save",
                        uiStyle: "primary"
                    }
                ],
                cancel: cancelHandler,
                save: saveHandler,
                ok: saveHandler,
                messages: {
                    ok: globalSelf.nls.Save,
                    cancel: globalSelf.nls.Cancel
                },
                close: function () {
                    manager._destroyInputParametersModal(globalSelf, true);
                }
            });

            if (globalSelf.inputParametersModal) {
                if (globalSelf.inputParametersModal.open) {
                    globalSelf.inputParametersModal.open($anchor);
                } else if (globalSelf.inputParametersModal.widget?.open) {
                    globalSelf.inputParametersModal.widget.open($anchor);
                } else if (globalSelf.inputParametersModal.show) {
                    globalSelf.inputParametersModal.show();
                }
            }
        },

        _destroyInputParametersModal: function (view, isFromCloseCallback) {
            var globalSelf = view;
            if (!globalSelf) {
                return;
            }

            if (globalSelf.inputParametersModalGrid) {
                globalSelf._destroyComponent(globalSelf.inputParametersModalGrid);
                globalSelf.inputParametersModalGrid = null;
            }

            if (globalSelf.inputParametersModal) {
                var popover = globalSelf.inputParametersModal;
                globalSelf.inputParametersModal = null;

                if (!isFromCloseCallback && popover.close) {
                    popover.close();
                }
            }

            if (globalSelf._inputParametersModalWrapper) {
                var $wrapper = globalSelf._inputParametersModalWrapper;
                globalSelf._inputParametersModalWrapper = null;

                $wrapper.remove();
            }
        }
    };

    return CallMethodGridManager;
});
