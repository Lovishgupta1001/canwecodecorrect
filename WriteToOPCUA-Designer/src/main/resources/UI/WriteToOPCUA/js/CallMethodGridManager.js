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
            if (!view || !view.callMethodGrid) {
                return;
            }

            view._destroyComponent(view.callMethodGrid);
            view.callMethodGrid = null;

            view.$(".cvt-grid-div-call-method").empty();

            if (view.$(".call-method-radio").is(":checked")) {
                this.renderCallMethodComponent(view);
            }
        },

        _getCallMethodColumns: function (view) {
            var isDynamic = !!view.model.getKey("dynamicTransport");

            var methodNameTemplate = isDynamic
                ? GridUtils.getEditableValueTemplate("methodName", "method-name-edit-icon")
                : function (dataItem) {
                    return "<div class='method-name-dropdown' data-row-uid='" + dataItem.uid + "'></div>";
                };

            var methodNameEditor = isDynamic
                ? function (container, options) {
                    ExpressionBuilderManager.methodNameEditor(container, options, view);
                }
                : null;

            var inputParametersEditor = isDynamic
                ? function (container, options) {
                    ExpressionBuilderManager.inputParametersEditor(container, options, view);
                }
                : null;

            return [
                {
                    selectable: true,
                    width: 50
                },
                {
                    field: "methodName",
                    title: view.nls.MethodName,
                    template: methodNameTemplate,
                    editor: methodNameEditor,
                    editable: isDynamic,
                    filterable: false
                },
                {
                    field: "nodeId",
                    title: view.nls.NodeId,
                    editable: false,
                    template: GridUtils.getNodeIdTemplate("methodName", view),
                    filterable: true
                },
                {
                    field: "inputParameters",
                    title: view.nls.InputParameters,
                    editable: function () {
                        return isDynamic;
                    },
                    template: GridUtils.getInputParametersTemplate(view),
                    editor: inputParametersEditor,
                    filterable: false,
                    sortable: false
                },
                {
                    field: "outputValue",
                    title: view.nls.OutputValue,
                    template: GridUtils.getOutputValueTemplate,
                    editor: this._outputValueEditor,
                    filterable: false
                },
                {
                    field: "action",
                    title: view.nls.Action,
                    template: GridUtils.getDeleteActionTemplate(view.nls),
                    filterable: false,
                    sortable: false,
                    editable: false,
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
            if (grid && grid.widget) {
                grid.widget.resize();
                return true;
            }
            return false;
        },

        renderCallMethodComponent: function (view) {
            if (this._resizeGridIfExists(view.callMethodGrid)) {
                return;
            }

            var data = view.model.getKey("callMethod") || [];

            view.callMethodGrid = uilayer.grid({
                elem: view.$(".cvt-grid-div-call-method"),
                toolbar: GridUtils.getOperationGridToolbar("call-method-search", view.nls),
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
                height: "100%",
                columns: this._getCallMethodColumns(view),
                dataSource: this._getCallMethodDataSource(data)
            });

            if (view.callMethodGrid && view.callMethodGrid.widget) {
                view.callMethodGrid.widget.bind(
                    "dataBound",
                    this._initializeMethodDropdowns.bind(this, view)
                );
            }

            // For static mode the dropdowns are in the template HTML already,
            // initialize them immediately after the first render.
            if (!view.model.getKey("dynamicTransport")) {
                this._initializeMethodDropdowns(view);
            }

            view.callMethodSearchBar = GridUtils.renderGridSearchBar(
                "call-method-search",
                view.callMethodGrid,
                "nodeId",
                view,
                view.nls
            );
        },



        _initializeMethodDropdowns: function (view) {
            var manager = this;

            view.$(".method-name-dropdown").each(function () {
                var element = $(this);

                if (element.data("method-dropdown-initialized")) {
                    return;
                }

                var row = element.closest("tr");
                var grid = view.callMethodGrid.widget;
                var dataItem = grid.dataItem(row);

                if (!dataItem) {
                    return;
                }

                element.data("method-dropdown-initialized", true);

                var dropdown = uilayer.dropDownList({
                    elem: element,
                    dataSource: new uilayer.data.DataSource({
                        data: view.callMethodOptions
                    }),
                    dataTextField: "methodName",
                    dataValueField: "methodName",
                    optionLabel: {
                        methodName: view.nls.SelectMethod
                    },
                    change: function () {
                        // If user opens the dropdown and clicks outside without
                        // selecting anything, this.value() is empty string (the
                        // optionLabel). Do NOT write back or refresh in that case.
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

                        dataItem.set("methodName", selectedData.methodName || "");
                        dataItem.set("nodeId", selectedData.nodeId || "");
                        dataItem.set(
                            "inputParameters",
                            manager._copyInputParameters(selectedData.inputParameters)
                        );

                        grid.refresh();
                    }
                });

                if (dropdown && dropdown.value) {
                    dropdown.value(dataItem.get("methodName") || "");
                } else if (dropdown && dropdown.widget && dropdown.widget.value) {
                    dropdown.widget.value(dataItem.get("methodName") || "");
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

            var badge = $(event.currentTarget);
            var row = badge.closest("tr");
            var grid = view.callMethodGrid ? view.callMethodGrid.widget : null;

            if (!grid) {
                return;
            }

            var dataItem = grid.dataItem(row);
            if (!dataItem) {
                return;
            }

            view.selectedCallMethodRow = dataItem;
            this.openInputParametersModal(view, dataItem);
        },

        _createInputParametersModalGrid: function (gridElement, inputParameters, view) {
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
                height: "15rem",
                columns: [
                    {
                        field: "name",
                        title: view.nls.ParameterName,
                        editable: false
                    },
                    {
                        field: "dataType",
                        title: view.nls.DataType,
                        editable: false
                    },
                    {
                        field: "value",
                        title: view.nls.Value,
                        template: GridUtils.getEditableValueTemplate(
                            "value",
                            "parameter-value-edit-icon"
                        ),
                        editor: function (container, options) {
                            ExpressionBuilderManager.parameterValueEditor(
                                container,
                                options,
                                view
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
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            });
        },

        openInputParametersModal: function (view, dataItem) {
            var manager = this;

            var methodName = dataItem.get
                ? dataItem.get("methodName")
                : dataItem.methodName;

            var inputParameters = dataItem.get
                ? dataItem.get("inputParameters")
                : dataItem.inputParameters;

            inputParameters = this._copyInputParameters(inputParameters || []);

            this._destroyInputParametersModal(view);

            var $modalWrapper = $(
                "<div class='input-parameters-modal-wrapper'>" +
                    "<div class='ul-pad-2x-b'>" +
                        "<label class='ul-body-m-b'>" + (view.nls.InputParameters || "Input Parameters") + "</label>" +
                    "</div>" +
                    "<div class='input-parameters-modal-grid'></div>" +
                "</div>"
            );
            view.$el.append($modalWrapper);
            view._inputParametersModalWrapper = $modalWrapper;

            var gridElement = $modalWrapper.find(".input-parameters-modal-grid");
            view.inputParametersModalGrid = this._createInputParametersModalGrid(gridElement, inputParameters, view);

            view.inputParametersModal = uilayer.modal({
                elem: $modalWrapper,
                title: view.nls.AddMethodCall + " " + (methodName || ""),
                modalSize: "medium",
                width: "40rem",
                actions: [],
                buttons: [
                    {
                        label: view.nls.Cancel,
                        action: "cancel",
                        uiStyle: "tertiary",
                        position: "right"
                    },
                    {
                        label: view.nls.Save,
                        action: "save",
                        uiStyle: "primary",
                        position: "right"
                    }
                ],
                cancel: function () {
                    manager._destroyInputParametersModal(view);
                },
                save: function () {
                    var updatedParameters = [];

                    if (view.inputParametersModalGrid &&
                        view.inputParametersModalGrid.widget &&
                        view.inputParametersModalGrid.widget.dataSource) {
                        updatedParameters = view.inputParametersModalGrid
                            .widget.dataSource.data().toJSON();
                    }

                    if (dataItem.set) {
                        dataItem.set("inputParameters", updatedParameters);
                    } else {
                        dataItem.inputParameters = updatedParameters;
                    }

                    if (view.callMethodGrid && view.callMethodGrid.widget) {
                        view.callMethodGrid.widget.refresh();
                    }

                    manager._destroyInputParametersModal(view);
                }
            });

            if (view.inputParametersModal && view.inputParametersModal.widget) {
                view.inputParametersModal.widget.center().open();
            }
        },

        _destroyInputParametersModal: function (view) {
            if (view.inputParametersModalGrid) {
                view._destroyComponent(view.inputParametersModalGrid);
                view.inputParametersModalGrid = null;
            }

            if (view.inputParametersModal) {
                view._destroyComponent(view.inputParametersModal);
                view.inputParametersModal = null;
            }

            if (view._inputParametersModalWrapper) {
                view._inputParametersModalWrapper.remove();
                view._inputParametersModalWrapper = null;
            }
        }
    };

    return CallMethodGridManager;
});
