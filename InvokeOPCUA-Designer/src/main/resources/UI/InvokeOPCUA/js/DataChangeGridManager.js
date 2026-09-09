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
                    width: "55px"
                },
                {
                    field: "name",
                    title: globalSelf.nls.DataChangeName,
                    width: "25%",
                    attributes: { "class": "name" },
                    template: function (dataItem) {
                        var name = dataItem.get ? dataItem.get("name") : dataItem.name;
                        name = name || "";
                        return "<span class='data-change-name-cell eq-common-ellipsis' title='" + _.escape(name) + "'>" + _.escape(name) + "</span>";
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
                    template: GridUtils.getNodeIdTemplate(false),
                    filterable: true
                },
                {
                    field: "sampleValue",
                    title: globalSelf.nls.SampleValue,
                    width: "20%",
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
                },
                {
                    field: "browseAction",
                    title: globalSelf.nls.Action || "Action",
                    width: "90px",
                    attributes: { "class": "browse-action-cell" },
                    template: function (dataItem) {
                        return "<button type='button' class='k-button ul-tertiary-button browse-data-change-btn' data-row-uid='" +
                            dataItem.uid + "'>" + (globalSelf.nls.Browse || "Browse") + "</button>";
                    },
                    editable: function () {
                        return false;
                    },
                    filterable: false,
                    sortable: false
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
            if (!data.length) {
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

            this._bindGridEvents(globalSelf);

            globalSelf.dataChangeWriteSearchBar = GridUtils.renderGridSearchBar(
                "data-change-write-search",
                globalSelf.dataChangeWriteGrid,
                ["name", "nodeId", "sampleValue", "newValue"],
                globalSelf,
                globalSelf.nls
            );
        },

        _bindGridEvents: function (globalSelf) {
            GridUtils.initializeGridHelpTooltips(globalSelf.$(".cvt-grid-div-data-change-write"));

            globalSelf.$(".cvt-grid-div-data-change-write").off("click", ".browse-data-change-btn").on("click", ".browse-data-change-btn", function (e) {
                e.preventDefault();
                e.stopPropagation();

                var row = $(this).closest("tr");
                var grid = globalSelf.dataChangeWriteGrid ? (globalSelf.dataChangeWriteGrid.widget || globalSelf.dataChangeWriteGrid) : null;
                if (!grid) {
                    return;
                }

                var dataItem = grid.dataItem(row);
                if (!dataItem) {
                    return;
                }

                var connData = globalSelf.getConnectionPayload();
                if (!connData || !connData.connectionId) {
                    uilayer.notifier("warning", globalSelf.nls.SelectConnection || "Please select a connection.");
                    return;
                }

                if (globalSelf.addressSpaceBrowser) {
                    globalSelf.addressSpaceBrowser.openForBrowse(dataItem, "DATA_CHANGE_WRITE", connData);
                }
            });
        }
    };

    return DataChangeGridManager;
});
