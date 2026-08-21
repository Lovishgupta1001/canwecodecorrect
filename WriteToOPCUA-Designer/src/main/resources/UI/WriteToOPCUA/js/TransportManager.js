/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        Constants = require("./constants"),
        AjaxUtility = require("Widgets/common/utilities/utilities").AjaxUtility,
        DataChangeGridManager = require("./DataChangeGridManager"),
        CallMethodGridManager = require("./CallMethodGridManager");

    var TransportManager = {

        updateTransportUI: function (globalSelf) {
            this.renderTransportName(globalSelf);
        },

        renderTransportName: function (globalSelf) {
            this.renderTransportDropdown(globalSelf);
        },

        renderTransportButtons: function (globalSelf) {
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
                        if (!globalSelf.transportDropdown?.dataItem()) {
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

        renderTransportDropdown: function (globalSelf) {
            if (globalSelf.transportDropdown) {
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
                        for (var item of items) {
                            var tName = item.transportName || item.name;
                            if (tName === savedTransportName) {
                                this.value(item.transportId);

                                var transport = item.toJSON ? item.toJSON() : item;
                                globalSelf.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                                    if (opt && !opt.name && opt.dataChangeName) {
                                        opt.name = opt.dataChangeName;
                                    }
                                    return opt;
                                });
                                globalSelf.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                                    if (opt && !opt.name && opt.methodName) {
                                        opt.name = opt.methodName;
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
                    var selectedValue = this.value();

                    globalSelf.model.setKey("dataChangeWrite", []);
                    globalSelf.model.setKey("callMethod", []);

                    if (globalSelf.dataChangeWriteGrid?.widget?.dataSource) {
                        globalSelf.dataChangeWriteGrid.widget.dataSource.data([]);
                    }
                    if (globalSelf.callMethodGrid?.widget?.dataSource) {
                        globalSelf.callMethodGrid.widget.dataSource.data([]);
                    }

                    if (!selectedValue || !selectedItem?.transportId) {
                        globalSelf.model.setKey("transportName", "");
                        globalSelf.dataChangeOptions = [];
                        globalSelf.callMethodOptions = [];

                        DataChangeGridManager.refreshGridMode(globalSelf);
                        CallMethodGridManager.refreshGridMode(globalSelf);
                        return;
                    }

                    var transport = selectedItem.toJSON
                        ? selectedItem.toJSON()
                        : selectedItem;

                    globalSelf.model.setKey(
                        "transportName",
                        transport.transportName || ""
                    );

                    globalSelf.dataChangeOptions = (transport.dataChangeOptions || transport.dataChangeWriteOptions || []).map(function (opt) {
                        if (opt && !opt.name && opt.dataChangeName) {
                            opt.name = opt.dataChangeName;
                        }
                        return opt;
                    });
                    globalSelf.callMethodOptions = (transport.callMethodOptions || []).map(function (opt) {
                        if (opt && !opt.name && opt.methodName) {
                            opt.name = opt.methodName;
                        }
                        return opt;
                    });

                    globalSelf.model.setKey("dataChangeWrite", [{
                        name: "",
                        nodeId: "",
                        sampleValue: "",
                        newValue: ""
                    }]);

                    globalSelf.model.setKey("callMethod", [{
                        name: "",
                        nodeId: "",
                        objectNodeId: "",
                        inputParameters: [],
                        outputValue: ""
                    }]);

                    DataChangeGridManager.refreshGridMode(globalSelf);
                    CallMethodGridManager.refreshGridMode(globalSelf);
                    TransportManager.testTransportById(transport.transportId, globalSelf);
                }
            });

            this.renderTransportButtons(globalSelf);
        },

        testTransportById: function (transportId, globalSelf) {
            if (!transportId) {
                return;
            }

            var url = "activities/writetoopcua/testTransportById?transportId=" + encodeURIComponent(transportId);

            var promise = AjaxUtility.commonAjaxRequest("GET", url, null, "json");
            promise.done(function (data) {
                if (data === false || (data?.success === false)) {
                    uilayer.notifier("warning", globalSelf.nls.TransportTestFailed);
                }
            });
            promise.fail(function (err) {
                if (typeof logger !== "undefined" && logger?.error) {
                    logger.error("testTransportById request failed:", err);
                }
                uilayer.notifier("warning", globalSelf.nls.TransportTestFailed);
            });
        }
    };

    return TransportManager;
});
