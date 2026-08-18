/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        Constants = require("./constants"),
        ExpressionBuilderManager = require("./ExpressionBuilderManager"),
        DataChangeGridManager = require("./DataChangeGridManager"),
        CallMethodGridManager = require("./CallMethodGridManager");

    var TransportManager = {

        updateTransportUI: function (view) {
            var isDynamicTransport = !!view.model.getKey("dynamicTransport");
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

            var dataSource = new uilayer.data.DataSource({
                transport: {
                    read: function (options) {
                        if (typeof AjaxUtility !== "undefined" && typeof AjaxUtility.commonAjaxRequest === "function") {
                            AjaxUtility.commonAjaxRequest("GET", "activities/writetoopcua/fetchOPCUATransportList", null, "json")
                                .done(function (data) {
                                    options.success(data || []);
                                })
                                .fail(function (err) {
                                    options.error(err);
                                });
                        } else {
                            var requestUrl = typeof uilayer.rest !== "undefined" && typeof uilayer.rest.serviceUrl === "function"
                                ? uilayer.rest.serviceUrl("activities/writetoopcua/fetchOPCUATransportList")
                                : "activities/writetoopcua/fetchOPCUATransportList";

                            $.ajax({
                                url: requestUrl,
                                dataType: "json",
                                success: function (data) {
                                    options.success(data || []);
                                },
                                error: function (err) {
                                    options.error(err);
                                }
                            });
                        }
                    }
                }
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
                dataBound: function () {
                    var savedTransportName = view.model.getKey("transportName");
                    if (savedTransportName && this.dataSource) {
                        var items = this.dataSource.data();
                        for (var i = 0; i < items.length; i++) {
                            var item = items[i];
                            var tName = item.transportName || item.name;
                            if (tName === savedTransportName) {
                                this.value(item.transportId);

                                var transport = item.toJSON ? item.toJSON() : item;
                                view.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                                    if (opt && !opt.dataChangeName && opt.name) {
                                        opt.dataChangeName = opt.name;
                                    }
                                    return opt;
                                });
                                view.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                                    if (opt && !opt.methodName && opt.name) {
                                        opt.methodName = opt.name;
                                    }
                                    return opt;
                                });

                                DataChangeGridManager.refreshGridMode(view);
                                CallMethodGridManager.refreshGridMode(view);
                                TransportManager.testTransportById(item.transportId, view);
                                break;
                            }
                        }
                    }
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

                        view.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                            if (opt && !opt.dataChangeName && opt.name) {
                                opt.dataChangeName = opt.name;
                            }
                            return opt;
                        });
                        view.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                            if (opt && !opt.methodName && opt.name) {
                                opt.methodName = opt.name;
                            }
                            return opt;
                        });

                        DataChangeGridManager.refreshGridMode(view);
                        CallMethodGridManager.refreshGridMode(view);
                        TransportManager.testTransportById(transport.transportId, view);
                    }
                }
            });

            this.renderTransportButtons(view);
        },

        testTransportById: function (transportId, view) {
            if (!transportId) {
                return;
            }

            var url = "activities/writetoopcua/testTransportById?transportId=" + encodeURIComponent(transportId);

            if (typeof AjaxUtility !== "undefined" && typeof AjaxUtility.commonAjaxRequest === "function") {
                var promise = AjaxUtility.commonAjaxRequest("GET", url, null, "json");
                promise.done(function (data) {
                    if (data === false || (data && data.success === false)) {
                        if (typeof uilayer !== "undefined" && typeof uilayer.notifier === "function") {
                            uilayer.notifier("warning", view.nls.TransportTestFailed);
                        }
                    }
                });
                promise.fail(function (err) {
                    if (typeof logger !== "undefined" && typeof logger.error === "function") {
                        logger.error("testTransportById request failed:", err);
                    }
                    if (typeof uilayer !== "undefined" && typeof uilayer.notifier === "function") {
                        uilayer.notifier("warning", view.nls.TransportTestFailed);
                    }
                });
            } else {
                var requestUrl = typeof uilayer !== "undefined" && typeof uilayer.rest !== "undefined" && typeof uilayer.rest.serviceUrl === "function"
                    ? uilayer.rest.serviceUrl(url)
                    : url;

                $.ajax({
                    url: requestUrl,
                    type: "GET",
                    dataType: "json",
                    success: function (data) {
                        if (data === false || (data && data.success === false)) {
                            if (typeof uilayer !== "undefined" && typeof uilayer.notifier === "function") {
                                uilayer.notifier("warning", view.nls.TransportTestFailed);
                            }
                        }
                    },
                    error: function (xhr, status, error) {
                        if (typeof logger !== "undefined" && typeof logger.error === "function") {
                            logger.error("testTransportById request failed:", error || status);
                        }
                        if (typeof uilayer !== "undefined" && typeof uilayer.notifier === "function") {
                            uilayer.notifier("warning", view.nls.TransportTestFailed);
                        }
                    }
                });
            }
        }
    };

    return TransportManager;
});
