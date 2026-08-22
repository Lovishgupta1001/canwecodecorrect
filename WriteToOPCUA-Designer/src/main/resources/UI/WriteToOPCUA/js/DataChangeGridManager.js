define([
    "uilayer",
    "./GridUtils",
    "./ExpressionBuilderManager"
], function (uilayer, GridUtils, ExpressionBuilderManager) {
    "use strict";

    var DataChangeGridManager = {
        refreshGridMode: function (globalSelf) {
            if (!globalSelf?.dataChangeWriteGrid) {
                return;
            }

            globalSelf._destroyComponent(globalSelf.dataChangeWriteGrid);
            globalSelf.dataChangeWriteGrid = null;

            globalSelf.$(".cvt-grid-div-data-change-write").empty();

            if (globalSelf.$(".data-change-write-radio").is(":checked")) {
                this.renderDataChangeWriteComponent(globalSelf);
            }
        },

        _getDataChangeWriteColumns: function (globalSelf) {
            return [
                {
                    selectable: true,
                    width: "45px"
                },
                {
                    field: "name",
                    title: globalSelf.nls.DataChangeName,
                    width: "25%",
                    attributes: { "class": "name" },
                    template: function (dataItem) {
                        return "<div class='data-change-name-dropdown' data-row-uid='" + dataItem.uid + "'></div>";
                    },
                    editable: function () {
                        return false;
                    },
                    filterable: false
                },
                {
                    field: "nodeId",
                    title: globalSelf.nls.NodeId,
                    width: "25%",
                    attributes: { "class": "nodeId" },
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getNodeIdTemplate("name"),
                    filterable: true
                },
                {
                    field: "sampleValue",
                    title: globalSelf.nls.SampleValue,
                    width: "25%",
                    attributes: { "class": "sampleValue" },
                    editable: function () {
                        return false;
                    },
                    template: GridUtils.getSampleValueTemplate(),
                    filterable: false
                },
                {
                    field: "newValue",
                    title: globalSelf.nls.NewValue,
                    width: "25%",
                    customEditor: true,
                    attributes: { "class": "newValue" },
                    template: ExpressionBuilderManager.getTemplate("newValue", globalSelf),
                    editor: ExpressionBuilderManager.getEditor("newValue", globalSelf),
                    filterable: false
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
                            name: {
                                type: "string",
                                parse: GridUtils.parseStringField
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
                                type: "string",
                                parse: GridUtils.parseStringField
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

        renderDataChangeWriteComponent: function (globalSelf) {
            if (this._resizeGridIfExists(globalSelf.dataChangeWriteGrid)) {
                return;
            }

            var data = globalSelf.model.getKey("dataChangeWrite") || [];
            if (!data.length && globalSelf.transportDropdown?.value()) {
                data = [{
                    name: "",
                    nodeId: "",
                    sampleValue: "",
                    newValue: ""
                }];
                globalSelf.model.setKey("dataChangeWrite", data);
            }

            globalSelf.dataChangeWriteGrid = uilayer.grid({
                elem: globalSelf.$(".cvt-grid-div-data-change-write"),
                toolbar: GridUtils.getOperationGridToolbar("data-change-write-search", globalSelf.nls),
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
                columns: this._getDataChangeWriteColumns(globalSelf),
                dataSource: this._getDataChangeWriteDataSource(data)
            });

            if (globalSelf.dataChangeWriteGrid?.widget) {
                globalSelf.dataChangeWriteGrid.widget.bind(
                    "dataBound",
                    this._initializeDataChangeDropdowns.bind(this, globalSelf)
                );
            }

            this._initializeDataChangeDropdowns(globalSelf);

            globalSelf.dataChangeWriteSearchBar = GridUtils.renderGridSearchBar(
                "data-change-write-search",
                globalSelf.dataChangeWriteGrid,
                ["name", "nodeId", "sampleValue", "newValue"],
                globalSelf,
                globalSelf.nls
            );
        },

        _initializeDataChangeDropdowns: function (globalSelf) {
            GridUtils.initializeGridHelpTooltips(globalSelf.$el);
            globalSelf.$(".data-change-name-dropdown").each(function () {
                var element = $(this);
                var row = element.closest("tr");
                var grid = globalSelf.dataChangeWriteGrid ? globalSelf.dataChangeWriteGrid.widget : null;

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

                var initialVal = dataItem.get ? dataItem.get("name") : dataItem.name;
                var availableOptions = manager._getAvailableOptions(globalSelf, initialVal);

                var existingDropdown = element.data("uilayerDropDownList");
                if (existingDropdown) {
                    if (existingDropdown.setDataSource) {
                        existingDropdown.setDataSource(new uilayer.data.DataSource({
                            data: availableOptions
                        }));
                    }
                    if (typeof existingDropdown.value === "function") {
                        existingDropdown.value(initialVal || "");
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
                        data: availableOptions
                    }),
                    dataTextField: "name",
                    dataValueField: "name",
                    optionLabel: {
                        name: globalSelf.nls.SelectDataChange
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

                        dataItem["name"]        = selectedData.name || "";
                        dataItem["nodeId"]      = selectedData.nodeId || "";
                        dataItem["sampleValue"] = GridUtils.formatSampleValue(selectedData.sampleValue);

                        var currentNewValue = dataItem.get ? dataItem.get("newValue") : dataItem["newValue"];
                        if (!currentNewValue && selectedData.sampleValue) {
                            var defaultExpr = GridUtils.getDefaultExpression(selectedData.sampleValue);
                            dataItem["newValue"] = defaultExpr;
                        }

                        var nodeIdCell = row.find("td:eq(2)");
                        var sampleValueCell = row.find("td:eq(3)");
                        var newValueCell = row.find("td:eq(4)");

                        if (nodeIdCell.length && grid.columns[2].template) {
                            nodeIdCell.html(grid.columns[2].template(dataItem));
                        }
                        if (sampleValueCell.length && grid.columns[3].template) {
                            sampleValueCell.html(grid.columns[3].template(dataItem));
                        }
                        if (newValueCell.length && grid.columns[4].template) {
                            newValueCell.html(grid.columns[4].template(dataItem));
                        }
                        GridUtils.initializeGridHelpTooltips(row);

                        manager.refreshDropdownOptions(globalSelf);
                    }
                });

                if (typeof dropdown?.value === "function") {
                    dropdown.value(initialVal || "");
                } else if (typeof dropdown?.widget?.value === "function") {
                    dropdown.widget.value(initialVal || "");
                }
            });
        },

        _getAvailableOptions: function (globalSelf, currentSelectedName) {
            var grid = globalSelf.dataChangeWriteGrid?.widget;
            var selectedNames = new Set();

            if (grid?.dataSource) {
                var data = grid.dataSource.data();
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    var name = item ? (item.get ? item.get("name") : item.name) : "";
                    if (name && name !== currentSelectedName) {
                        selectedNames.add(name);
                    }
                }
            }

            return (globalSelf.dataChangeOptions || []).filter(function (opt) {
                var optName = opt?.name || opt?.dataChangeName || "";
                return optName === currentSelectedName || !selectedNames.has(optName);
            });
        },

        refreshDropdownOptions: function (globalSelf) {
            var manager = this;
            var grid = globalSelf.dataChangeWriteGrid?.widget;
            if (!grid) {
                return;
            }

            globalSelf.$(".data-change-name-dropdown").each(function () {
                var element = $(this);
                var row = element.closest("tr");
                var dataItem = grid.dataItem(row);
                var currentVal = dataItem ? (dataItem.get ? dataItem.get("name") : dataItem.name) : "";
                var available = manager._getAvailableOptions(globalSelf, currentVal);

                var dropdown = element.data("uilayerDropDownList") || element.data("kendoDropDownList");
                if (dropdown) {
                    if (dropdown.setDataSource) {
                        dropdown.setDataSource(new uilayer.data.DataSource({
                            data: available
                        }));
                    }
                    if (typeof dropdown.value === "function") {
                        dropdown.value(currentVal || "");
                    }
                }
            });
        }
    };

    return DataChangeGridManager;
});
