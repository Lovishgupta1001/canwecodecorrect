/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        Constants = require("./constants"),
        DataChangeGridManager = require("./DataChangeGridManager"),
        CallMethodGridManager = require("./CallMethodGridManager");

    var TransportManager = {

        updateTransportUI: function (view) {
            this.renderTransportName(view);
        },

        renderTransportName: function (view) {
            this.renderTransportDropdown(view);
        },

        renderTransportButtons: function (view) {
            var globalSelf = view;

            if (!globalSelf.refreshButton) {
                globalSelf.refreshButton = uilayer.button({
                    elem: globalSelf.$(".transports-refresh-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (globalSelf.transportDropdown) {
                            globalSelf.transportDropdown.destroy();
                            globalSelf.transportDropdown = null;
                            globalSelf.$(".transport-selector-dropdown").empty();
                        }
                        TransportManager.renderTransportDropdown(globalSelf);
                    }
                });
            }

            if (!globalSelf.createButton) {
                globalSelf.createButton = uilayer.button({
                    elem: globalSelf.$(".transports-create-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        window.open(
                            Constants.CREATE_TRANSPORT_URL,
                            "_blank"
                        );
                    }
                });
            }

            if (!globalSelf.openButton) {
                globalSelf.openButton = uilayer.button({
                    elem: globalSelf.$(".transports-open-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (!globalSelf.transportDropdown || !globalSelf.transportDropdown.dataItem()) {
                            return;
                        }

                        var item = globalSelf.transportDropdown.dataItem();
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
            var globalSelf = view;

            if (globalSelf.transportDropdown) {
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
                            var requestUrl = uilayer.rest && typeof uilayer.rest.serviceUrl === "function"
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

            globalSelf.transportDropdown = uilayer.dropDownList({
                elem: globalSelf.$(".transport-selector-dropdown"),
                filter: "contains",
                dataSource: dataSource,
                dataTextField: "transportName",
                dataValueField: "transportId",
                optionLabel: {
                    transportId: "",
                    transportName: globalSelf.nls.SelectTransport
                },
                dataBound: function () {
                    var savedTransportName = globalSelf.model.getKey("transportName");
                    if (savedTransportName && this.dataSource) {
                        var items = this.dataSource.data();
                        for (var i = 0; i < items.length; i++) {
                            var item = items[i];
                            var tName = item.transportName || item.name;

                            if (tName === savedTransportName) {
                                this.value(item.transportId);

                                var transport = item.toJSON ? item.toJSON() : item;
                                globalSelf.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                                    if (opt && !opt.dataChangeName && opt.name) {
                                        opt.dataChangeName = opt.name;
                                    }
                                    return opt;
                                });
                                globalSelf.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                                    if (opt && !opt.methodName && opt.name) {
                                        opt.methodName = opt.name;
                                    }
                                    return opt;
                                });

                                DataChangeGridManager.refreshGridMode(globalSelf);
                                CallMethodGridManager.refreshGridMode(globalSelf);
                                TransportManager.testTransportById(item.transportId, globalSelf);
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

                        globalSelf.model.setKey(
                            "transportName",
                            transport.transportName || ""
                        );

                        globalSelf.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                            if (opt && !opt.dataChangeName && opt.name) {
                                opt.dataChangeName = opt.name;
                            }
                            return opt;
                        });
                        globalSelf.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                            if (opt && !opt.methodName && opt.name) {
                                opt.methodName = opt.name;
                            }
                            return opt;
                        });

                        DataChangeGridManager.refreshGridMode(globalSelf);
                        CallMethodGridManager.refreshGridMode(globalSelf);
                        TransportManager.testTransportById(transport.transportId, globalSelf);
                    }
                }
            });

            this.renderTransportButtons(globalSelf);
        },

        testTransportById: function (transportId, view) {
            var globalSelf = view;
            if (!transportId) {
                return;
            }

            var url = "activities/writetoopcua/testTransportById?transportId=" + encodeURIComponent(transportId);

            if (typeof AjaxUtility !== "undefined" && typeof AjaxUtility.commonAjaxRequest === "function") {
                var promise = AjaxUtility.commonAjaxRequest("GET", url, null, "json");
                promise.done(function (data) {
                    if (data === false || (data && data.success === false)) {
                        uilayer.notifier("warning", globalSelf.nls.TransportTestFailed);
                    }
                });
                promise.fail(function (err) {
                    if (typeof logger !== "undefined" && typeof logger.error === "function") {
                        logger.error("testTransportById request failed:", err);
                    }
                    uilayer.notifier("warning", globalSelf.nls.TransportTestFailed);
                });
            } else {
                var requestUrl = uilayer.rest && typeof uilayer.rest.serviceUrl === "function"
                    ? uilayer.rest.serviceUrl(url)
                    : url;

                $.ajax({
                    url: requestUrl,
                    type: "GET",
                    dataType: "json",
                    success: function (data) {
                        if (data === false || (data && data.success === false)) {
                            uilayer.notifier("warning", globalSelf.nls.TransportTestFailed);
                        }
                    },
                    error: function (xhr, status, error) {
                        if (typeof logger !== "undefined" && typeof logger.error === "function") {
                            logger.error("testTransportById request failed:", error || status);
                        }
                        uilayer.notifier("warning", globalSelf.nls.TransportTestFailed);
                    }
                });
            }
        }
    };

    return TransportManager;
});
