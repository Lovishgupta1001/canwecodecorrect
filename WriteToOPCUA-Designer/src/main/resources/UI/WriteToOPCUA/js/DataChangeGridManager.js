define([
    "uilayer",
    "./GridUtils",
    "./ExpressionBuilderManager"
], function (uilayer, GridUtils, ExpressionBuilderManager) {
    "use strict";

    var DataChangeGridManager = {
        refreshGridMode: function (view) {
            if (!view || !view.dataChangeWriteGrid) {
                return;
            }

            view._destroyComponent(view.dataChangeWriteGrid);
            view.dataChangeWriteGrid = null;

            view.$(".cvt-grid-div-data-change-write").empty();

            if (view.$(".data-change-write-radio").is(":checked")) {
                this.renderDataChangeWriteComponent(view);
            }
        },

        _getDataChangeWriteColumns: function (view) {
            var isDynamic = !!view.model.getKey("dynamicTransport");

            var dataChangeNameTemplate = isDynamic
                ? GridUtils.getEditableValueTemplate("dataChangeName", "data-change-name-edit-icon")
                : function (dataItem) {
                    return "<div class='data-change-name-dropdown' data-row-uid='" + dataItem.uid + "'></div>";
                };

            var dataChangeNameEditor = isDynamic
                ? function (container, options) {
                    ExpressionBuilderManager.dataChangeNameEditor(container, options, view);
                }
                : null;

            return [
                {
                    selectable: true,
                    width: 50
                },
                {
                    field: "dataChangeName",
                    title: view.nls.DataChangeName,
                    template: dataChangeNameTemplate,
                    editor: dataChangeNameEditor,
                    editable: isDynamic,
                    filterable: false
                },
                {
                    field: "nodeId",
                    title: view.nls.NodeId,
                    editable: false,
                    template: GridUtils.getNodeIdTemplate("dataChangeName", view),
                    filterable: true
                },
                {
                    field: "sampleValue",
                    title: view.nls.SampleValue,
                    editable: false,
                    template: GridUtils.getSampleValueTemplate(view),
                    filterable: false
                },
                {
                    field: "newValue",
                    title: view.nls.NewValue,
                    template: GridUtils.getNewValueTemplate,
                    editor: function (container, options) {
                        ExpressionBuilderManager.newValueEditor(container, options, view);
                    },
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

        _getDataChangeWriteDataSource: function (data) {
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
                            dataChangeName: {
                                type: "string"
                            },
                            nodeId: {
                                type: "string",
                                editable: false
                            },
                            sampleValue: {
                                type: "string",
                                editable: false
                            },
                            newValue: {
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

        renderDataChangeWriteComponent: function (view) {
            if (this._resizeGridIfExists(view.dataChangeWriteGrid)) {
                return;
            }

            var data = view.model.getKey("dataChangeWrite") || [];

            view.dataChangeWriteGrid = uilayer.grid({
                elem: view.$(".cvt-grid-div-data-change-write"),
                toolbar: GridUtils.getOperationGridToolbar("data-change-write-search", view.nls),
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
                columns: this._getDataChangeWriteColumns(view),
                dataSource: this._getDataChangeWriteDataSource(data)
            });

            if (view.dataChangeWriteGrid && view.dataChangeWriteGrid.widget) {
                view.dataChangeWriteGrid.widget.bind(
                    "dataBound",
                    this._initializeDataChangeDropdowns.bind(this, view)
                );
            }

            // For static mode the dropdowns are in the template HTML already,
            // initialize them immediately after the first render.
            if (!view.model.getKey("dynamicTransport")) {
                this._initializeDataChangeDropdowns(view);
            }

            view.dataChangeWriteSearchBar = GridUtils.renderGridSearchBar(
                "data-change-write-search",
                view.dataChangeWriteGrid,
                "nodeId",
                view,
                view.nls
            );
        },


        _initializeDataChangeDropdowns: function (view) {
            view.$(".data-change-name-dropdown").each(function () {
                var element = $(this);

                if (element.data("data-change-dropdown-initialized")) {
                    return;
                }

                var row = element.closest("tr");
                var grid = view.dataChangeWriteGrid.widget;
                var dataItem = grid.dataItem(row);

                if (!dataItem) {
                    return;
                }

                element.data("data-change-dropdown-initialized", true);

                var dropdown = uilayer.dropDownList({
                    elem: element,
                    dataSource: new uilayer.data.DataSource({
                        data: view.dataChangeOptions
                    }),
                    dataTextField: "dataChangeName",
                    dataValueField: "dataChangeName",
                    optionLabel: {
                        dataChangeName: view.nls.SelectDataChange
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

                        dataItem.set("dataChangeName", selectedData.dataChangeName || "");
                        dataItem.set("nodeId", selectedData.nodeId || "");
                        dataItem.set("sampleValue", selectedData.sampleValue || "");

                        grid.refresh();
                    }
                });

                if (dropdown && dropdown.value) {
                    dropdown.value(dataItem.get("dataChangeName") || "");
                } else if (dropdown && dropdown.widget && dropdown.widget.value) {
                    dropdown.widget.value(dataItem.get("dataChangeName") || "");
                }
            });
        }
    };

    return DataChangeGridManager;
});
