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
                    editable: function () {
                        return isDynamic;
                    },
                    filterable: false
                },
                {
                    field: "nodeId",
                    title: view.nls.NodeId,
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getNodeIdTemplate("dataChangeName", isDynamic),
                    filterable: true
                },
                {
                    field: "sampleValue",
                    title: view.nls.SampleValue,
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getSampleValueTemplate(isDynamic),
                    filterable: false
                },
                {
                    field: "newValue",
                    title: view.nls.NewValue,
                    template: GridUtils.getNewValueTemplate,
                    editor: function (container, options) {
                        ExpressionBuilderManager.newValueEditor(container, options, view);
                    },
                    editable: function () {
                        return true;
                    },
                    filterable: false
                },
                {
                    field: "action",
                    title: view.nls.Action,
                    template: GridUtils.getDeleteActionTemplate(view.nls),
                    filterable: false,
                    sortable: false,
                    editable: function () {
                        return false;
                    },
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
                // Toolbar is now outside the grid (static div in template).
                // Height = header(~2.2rem) + 3 rows(~6.6rem) + border(~0.2rem) = ~9rem
                height: "10rem",
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
                "dataChangeName",
                view,
                view.nls
            );
        },


        _initializeDataChangeDropdowns: function (view) {
            GridUtils.initializeGridHelpTooltips(view.$el);
            view.$(".data-change-name-dropdown").each(function () {
                var element = $(this);
                var row = element.closest("tr");
                var grid = view.dataChangeWriteGrid ? view.dataChangeWriteGrid.widget : null;

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

                var existingDropdown = element.data("kendoDropDownList") || element.data("uilayerDropDownList");
                if (existingDropdown) {
                    if (existingDropdown.setDataSource) {
                        existingDropdown.setDataSource(new uilayer.data.DataSource({
                            data: view.dataChangeOptions || []
                        }));
                    }
                    return;
                }

                if (element.data("data-change-dropdown-initialized")) {
                    return;
                }
                element.data("data-change-dropdown-initialized", true);

                var dropdown = uilayer.dropDownList({
                    elem: element,
                    dataSource: new uilayer.data.DataSource({
                        data: view.dataChangeOptions || []
                    }),
                    dataTextField: "dataChangeName",
                    dataValueField: "dataChangeName",
                    optionLabel: {
                        dataChangeName: view.nls.SelectDataChange
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

                        dataItem["dataChangeName"] = selectedData.dataChangeName || selectedData.name || "";
                        dataItem["nodeId"]         = selectedData.nodeId         || "";
                        dataItem["sampleValue"]    = GridUtils.formatSampleValue(selectedData.sampleValue);

                        var nodeIdCell = row.find("td:eq(2)");
                        var sampleValueCell = row.find("td:eq(3)");
                        if (nodeIdCell.length && grid.columns[2].template) {
                            nodeIdCell.html(grid.columns[2].template(dataItem));
                        }
                        if (sampleValueCell.length && grid.columns[3].template) {
                            sampleValueCell.html(grid.columns[3].template(dataItem));
                        }
                        GridUtils.initializeGridHelpTooltips(row);
                    }
                });

                var initialVal = dataItem.get ? dataItem.get("dataChangeName") : dataItem.dataChangeName;
                if (dropdown && dropdown.value) {
                    dropdown.value(initialVal || "");
                } else if (dropdown && dropdown.widget && dropdown.widget.value) {
                    dropdown.widget.value(initialVal || "");
                }
            });
        }
    };

    return DataChangeGridManager;
});
