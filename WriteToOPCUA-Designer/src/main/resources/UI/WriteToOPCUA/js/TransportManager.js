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
                        if (!view.transportDropdown?.dataItem()) {
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
                        AjaxUtility.commonAjaxRequest("GET", "activities/writetoopcua/fetchOPCUATransportList", null, "json")
                            .done(function (data) {
                                options.success(data || []);
                            })
                            .fail(function (err) {
                                options.error(err);
                            });
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
                        for (var item of items) {
                            var tName = item.transportName || item.name;
                            if (tName === savedTransportName) {
                                this.value(item.transportId);

                                var transport = item.toJSON ? item.toJSON() : item;
                                view.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                                    if (opt && !opt.name && opt.dataChangeName) {
                                        opt.name = opt.dataChangeName;
                                    }
                                    return opt;
                                });
                                view.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                                    if (opt && !opt.name && opt.methodName) {
                                        opt.name = opt.methodName;
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
                            if (opt && !opt.name && opt.dataChangeName) {
                                opt.name = opt.dataChangeName;
                            }
                            return opt;
                        });
                        view.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                            if (opt && !opt.name && opt.methodName) {
                                opt.name = opt.methodName;
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

            var promise = AjaxUtility.commonAjaxRequest("GET", url, null, "json");
            promise.done(function (data) {
                if (data === false || (data?.success === false)) {
                    uilayer.notifier("warning", view.nls.TransportTestFailed);
                }
            });
            promise.fail(function (err) {
                logger.error("testTransportById request failed:", err);
                uilayer.notifier("warning", view.nls.TransportTestFailed);
            });
        }
    };

    return TransportManager;
});
