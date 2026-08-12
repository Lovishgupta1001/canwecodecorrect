/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        Constants = require("./Constants"),
        ExpressionBuilderManager = require("./ExpressionBuilderManager");

    var TransportManager = {

        updateTransportUI: function (view) {
            var isDynamicTransport = view.$(".transport-name-variable-checkbox").is(":checked");
            this.renderTransportName(view, isDynamicTransport);
        },

        renderTransportName: function (view, isDynamicTransport) {
            if (isDynamicTransport) {
                view.$("#transport-name-expression-region").show();
                view.$("#transport-name-dropdown-region").hide();

                ExpressionBuilderManager.renderTransportExpressionBuilder(view);
            } else {
                view.$("#transport-name-expression-region").hide();
                view.$("#transport-name-dropdown-region").show();

                if (view.transportExpressionBuilder) {
                    ExpressionBuilderManager.destroy(view.transportExpressionBuilder);
                    view.transportExpressionBuilder = null;
                }

                this.renderTransportDropdown(view);
            }
        },

        renderTransportButtons: function (view) {
            if (!view.refreshButton) {
                view.refreshButton = uilayer.button({
                    elem: view.$(".transports-refresh-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (view.transportDropdown) {
                            view.transportDropdown.destroy();
                            view.transportDropdown = null;
                            view.$(".transport-selector-dropdown").empty();
                        }
                        TransportManager.renderTransportDropdown(view);
                    }
                });
            }

            if (!view.createButton) {
                view.createButton = uilayer.button({
                    elem: view.$(".transports-create-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        window.open(
                            Constants.CREATE_TRANSPORT_URL,
                            "_blank"
                        );
                    }
                });
            }

            if (!view.openButton) {
                view.openButton = uilayer.button({
                    elem: view.$(".transports-open-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (!view.transportDropdown || !view.transportDropdown.dataItem()) {
                            return;
                        }

                        var item = view.transportDropdown.dataItem();
                        var transportId = item.toJSON ? item.toJSON().transportId : item.transportId;

                        if (transportId) {
                            window.open(
                                Constants.EDIT_TRANSPORT_URL + transportId,
                                "_blank"
                            );
                        }
                    }
                });
            }
        },

        renderTransportDropdown: function (view) {
            if (view.transportDropdown) {
                return;
            }

            /*
             * TODO [API]: Replace hardcoded sample data with a real API call.
             * ─────────────────────────────────────────────────────────────────────
             * Expected API: GET /api/transports  (or Constants.CREATE_TRANSPORT_URL equivalent)
             * Expected response shape:
             *   [ { transportId: number, transportName: string }, ... ]
             *
             * Replace the static `data` array and `DataSource` below with:
             *   var dataSource = new uilayer.data.DataSource({
             *       transport: {
             *           read: {
             *               url: "/api/transports",
             *               dataType: "json"
             *           }
             *       },
             *       schema: {
             *           data: "data"   // adjust to match actual response envelope
             *       }
             *   });
             * ─────────────────────────────────────────────────────────────────────
             * Also: after a transport is selected in the dropdown `change` handler,
             * call view._fetchOptions(selectedTransportId) to reload
             * dataChangeOptions and callMethodOptions for the new transport.
             */
            // TODO [API]: Populate dataSource from GET /api/transports
            // Expected response shape: [ { transportId: number, transportName: string }, ... ]
            // Replace the empty DataSource below with a transport-backed one once the API is ready.
            var dataSource = new uilayer.data.DataSource({
                data: []
            });

            view.transportDropdown = uilayer.dropDownList({
                elem: view.$(".transport-selector-dropdown"),
                filter: "contains",
                dataSource: dataSource,
                dataTextField: "transportName",
                dataValueField: "transportId",
                optionLabel: {
                    transportId: "",
                    transportName: view.nls.SelectTransport
                },
                change: function () {
                    var selectedItem = this.dataItem();

                    if (selectedItem) {
                        var transport = selectedItem.toJSON
                            ? selectedItem.toJSON()
                            : selectedItem;

                        view.model.setKey(
                            "transportName",
                            transport.transportName || ""
                        );

                        // TODO [API]: After selecting a transport, fetch the
                        // available data-change and call-method options for it.
                        // Uncomment and implement _fetchOptions in the view:
                        //
                        // view._fetchOptions(transport.transportId);
                        //
                        // _fetchOptions should:
                        //   1. Call GET /api/dataChangeOptions?transportId=<id>
                        //      → set view.dataChangeOptions = response
                        //   2. Call GET /api/callMethodOptions?transportId=<id>
                        //      → set view.callMethodOptions = response
                        //   3. Then call refreshGridMode on both managers so
                        //      existing grid dropdowns reload with new options.
                    }
                }
            });

            this.renderTransportButtons(view);
        }
    };

    return TransportManager;
});
