/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        GridUtils = require("./GridUtils"),
        ExpressionBuilderManager = require("./ExpressionBuilderManager");

    var CallMethodGridManager = {

        refreshGridMode: function (view, isDynamicTransport) {
            if (!view.callMethodGrid) {
                return;
            }

            var data = [];

            if (view.callMethodGrid.widget &&
                view.callMethodGrid.widget.dataSource) {
                data = view.callMethodGrid.widget.dataSource.data().toJSON();
            }

            if (isDynamicTransport) {
                data.forEach(function (item) {
                    item.nodeId = "";
                });
            }

            view.model.setKey("callMethod", data);

            if (view.callMethodSearchBar) {
                view.callMethodSearchBar.destroy();
                view.callMethodSearchBar = null;
            }

            view.callMethodGrid.destroy();
            view.callMethodGrid = null;

            view.$(".cvt-grid-div-call-method").empty();

            if (view.$(".call-method-radio").is(":checked")) {
                this.renderCallMethodComponent(view);
            }
        },

        renderCallMethodComponent: function (view) {
            if (view.callMethodGrid) {
                if (view.callMethodGrid.widget) {
                    view.callMethodGrid.widget.resize();
                }
                return;
            }

            var data = view.model.getKey("callMethod") || [];

            view.callMethodGrid = uilayer.grid({
                elem: view.$(".cvt-grid-div-call-method"),
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
                scrollable: {
                    virtual: true
                },
                height: "20rem",
                columns: [
                    {
                        field: "methodName",
                        title: view.nls.MethodName,
                        template: view.model.getKey("dynamicTransport")
                            ? GridUtils.getEditableValueTemplate(
                                "methodName",
                                "method-name-edit-icon"
                            )
                            : function (dataItem) {
                                return "<div class='method-name-dropdown' " +
                                    "data-row-uid='" + dataItem.uid + "'></div>";
                            },
                        editor: view.model.getKey("dynamicTransport")
                            ? function (container, options) {
                                ExpressionBuilderManager.methodNameEditor(
                                    container,
                                    options,
                                    view
                                );
                            }
                            : null,
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
                        editable: false,
                        template: GridUtils.getInputParametersTemplate,
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
                ],
                dataSource: {
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
                                    editable: false
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
                }
            });

            if (view.callMethodGrid.widget) {
                view.callMethodGrid.widget.bind(
                    "dataBound",
                    this._initializeMethodDropdowns.bind(this, view)
                );
            }

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

        _outputValueEditor: function (container, options) {
            var input = $("<input type='text' class='k-input k-textbox output-value-editor'/>");

            input.attr("name", options.field);
            input.val(options.model.get(options.field) || "");
            input.appendTo(container);

            input.on("change blur", function () {
                options.model.set(options.field, $(this).val());
            });
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
                    // TODO [API]: view.callMethodOptions is currently [] (empty).
                    // It will be populated by view._fetchOptions(transportId) once
                    // the transport dropdown selection triggers an API call.
                    // Expected shape: [ { methodName, nodeId, inputParameters: [ { name, dataType, value } ] }, ... ]
                    dataSource: new uilayer.data.DataSource({
                        data: view.callMethodOptions
                    }),
                    dataTextField: "methodName",
                    dataValueField: "methodName",
                    optionLabel: {
                        methodName: view.nls.SelectMethod
                    },
                    change: function () {
                        var selectedItem = this.dataItem();
                        var selectedData;

                        if (!selectedItem) {
                            dataItem.set("methodName", "");
                            dataItem.set("nodeId", "");
                            dataItem.set("inputParameters", []);
                            grid.refresh();
                            return;
                        }

                        selectedData = selectedItem.toJSON
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

                manager._storeMethodDropdown(view, dropdown);
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

        _storeMethodDropdown: function (view, dropdown) {
            view.methodNameDropdowns = view.methodNameDropdowns || [];
            view.methodNameDropdowns.push(dropdown);
        },

        onInputParameterBadgeClick: function (event, view) {
            event.preventDefault();
            event.stopPropagation();

            var badge = $(event.currentTarget);
            var row = badge.closest("tr");
            var gridElement = badge.closest(".k-grid");
            var grid = gridElement.data("kendoGrid");

            if (!grid || !row.length) {
                return;
            }

            var dataItem = grid.dataItem(row);

            if (!dataItem) {
                return;
            }

            view.selectedCallMethodRow = dataItem;
            this.openInputParametersModal(view, dataItem);
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

            var modalElement = view.$(".input-parameters-modal");
            var gridElement = modalElement.find(".input-parameters-modal-grid");

            if (!modalElement.length || !gridElement.length) {
                return;
            }

            modalElement.show();
            gridElement.empty();

            view.inputParametersModalGrid = uilayer.grid({
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
                        template: view.model.getKey("dynamicTransport")
                            ? GridUtils.getEditableValueTemplate("value", "value-edit-icon")
                            : null,
                        editor: view.model.getKey("dynamicTransport")
                            ? function (container, options) {
                                ExpressionBuilderManager.parameterValueEditor(
                                    container,
                                    options,
                                    view
                                );
                            }
                            : null
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

            view.inputParametersModal = uilayer.modal({
                elem: modalElement,
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

            /*
             * Some uilayer versions open during initialization.
             * Others expose open() directly or through widget.
             */
            if (view.inputParametersModal &&
                typeof view.inputParametersModal.open === "function") {
                view.inputParametersModal.open();
            } else if (view.inputParametersModal &&
                view.inputParametersModal.widget &&
                typeof view.inputParametersModal.widget.open === "function") {
                view.inputParametersModal.widget.open();
            }
        },

        _destroyInputParametersModal: function (view) {
            // Null first to prevent re-entrant destroy if callbacks fire
            var grid = view.inputParametersModalGrid;
            var modal = view.inputParametersModal;

            view.inputParametersModalGrid = null;
            view.inputParametersModal = null;

            if (grid && grid.destroy) {
                grid.destroy();
            }

            if (modal && modal.destroy) {
                modal.destroy();
            }

            view.$(".input-parameters-modal-grid").empty();
            view.$(".input-parameters-modal").hide();
        }
    };

    return CallMethodGridManager;
});
