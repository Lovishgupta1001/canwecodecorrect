/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        GridUtils = require("./GridUtils"),
        ExpressionBuilderManager = require("./ExpressionBuilderManager");

    var DataChangeGridManager = {

        refreshGridMode: function (view, isDynamicTransport) {
            if (!view.dataChangeWriteGrid) {
                return;
            }

            var data = [];

            if (view.dataChangeWriteGrid.widget &&
                view.dataChangeWriteGrid.widget.dataSource) {
                data = view.dataChangeWriteGrid.widget.dataSource.data().toJSON();
            }

            if (isDynamicTransport) {
                data.forEach(function (item) {
                    item.nodeId = "";
                    item.sampleValue = "";
                });
            }

            view.model.setKey("dataChangeWrite", data);

            if (view.dataChangeWriteSearchBar) {
                view.dataChangeWriteSearchBar.destroy();
                view.dataChangeWriteSearchBar = null;
            }

            view.dataChangeWriteGrid.destroy();
            view.dataChangeWriteGrid = null;

            view.$(".cvt-grid-div-data-change-write").empty();

            if (view.$(".data-change-write-radio").is(":checked")) {
                this.renderDataChangeWriteComponent(view);
            }
        },

        renderDataChangeWriteComponent: function (view) {
            if (view.dataChangeWriteGrid) {
                if (view.dataChangeWriteGrid.widget) {
                    view.dataChangeWriteGrid.widget.resize();
                }
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
                height: "10rem",
                columns: [
                    {
                        field: "dataChangeName",
                        title: view.nls.DataChangeName,
                        template: view.model.getKey("dynamicTransport")
                            ? GridUtils.getEditableValueTemplate(
                                "dataChangeName",
                                "data-change-name-edit-icon"
                            )
                            : function (dataItem) {
                                return "<div class='data-change-name-dropdown' " +
                                    "data-row-uid='" + dataItem.uid + "'></div>";
                            },
                        editor: view.model.getKey("dynamicTransport")
                            ? function (container, options) {
                                ExpressionBuilderManager.dataChangeNameEditor(
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
                }
            });

            if (view.dataChangeWriteGrid.widget) {
                view.dataChangeWriteGrid.widget.bind(
                    "dataBound",
                    this._initializeDataChangeDropdowns.bind(this, view)
                );
            }

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
            var manager = this;

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
                    // TODO [API]: view.dataChangeOptions is currently [] (empty).
                    // It will be populated by view._fetchOptions(transportId) once
                    // the transport dropdown selection triggers an API call.
                    // Expected shape: [ { dataChangeName, nodeId, sampleValue }, ... ]
                    dataSource: new uilayer.data.DataSource({
                        data: view.dataChangeOptions
                    }),
                    dataTextField: "dataChangeName",
                    dataValueField: "dataChangeName",
                    optionLabel: {
                        dataChangeName: view.nls.SelectDataChange
                    },
                    change: function () {
                        var selectedItem = this.dataItem();
                        var selectedData;

                        if (!selectedItem) {
                            dataItem.set("dataChangeName", "");
                            dataItem.set("nodeId", "");
                            dataItem.set("sampleValue", "");
                            grid.refresh();
                            return;
                        }

                        selectedData = selectedItem.toJSON
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

                manager._storeRowDropdown(view, dropdown);
            });
        },

        _storeRowDropdown: function (view, dropdown) {
            view.dataChangeNameDropdowns = view.dataChangeNameDropdowns || [];
            view.dataChangeNameDropdowns.push(dropdown);
        }
    };

    return DataChangeGridManager;
});
