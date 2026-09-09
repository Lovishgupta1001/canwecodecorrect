/**
* Created by Lovish.
*/
define([
    "uilayer",
    "underscore",
    "Widgets/common/utilities/utilities",
    "tpl!../template/AddressSpaceTemplate",
    "./GridUtils"
], function (uilayer, _, utilities, AddressSpaceTemplate, GridUtils) {
    "use strict";

    var AjaxUtility = utilities.AjaxUtility;

    var AddressSpaceBrowser = {
        init: function (globalSelf, containerElem) {
            this.globalSelf = globalSelf;
            this.containerElem = containerElem;
            this.nls = globalSelf.nls;
            this.selectedNode = null;
            this.targetRow = null;
            this.targetMode = "DATA_CHANGE_WRITE";
            this.connectionData = null;
            this.allNodesMap = {};
            this.loadedNodeIds = {};

            this.render();
        },

        render: function () {
            var browser = this;
            var html = AddressSpaceTemplate({ nls: this.nls });
            this.containerElem.html(html);

            this.waitWidget = uilayer.wait({
                elem: this.containerElem.find(".address-space-loading-container"),
                isTransparent: true
            });

            this.selectButton = uilayer.button({
                elem: this.containerElem.find("#address-space-select-btn"),
                uiStyle: "Tertiary",
                click: function () {
                    browser._onSelectNodeClick();
                }
            });

            this.searchInput = uilayer.textBox({
                elem: this.containerElem.find("#address-space-search-textbox")
            });

            this.containerElem.find("#address-space-search-textbox").on("keyup", function (e) {
                browser._onSearch($(this).val());
            });

            this._initTreeList();
            this._bindTreeEvents();
        },

        _initTreeList: function () {
            var browser = this;
            var elem = this.containerElem.find("#address-space-treelist");

            this.treeListWidget = uilayer.treeList({
                elem: elem,
                dataSource: new uilayer.data.TreeListDataSource({
                    data: [],
                    schema: {
                        model: {
                            id: "id",
                            parentId: "parentId",
                            fields: {
                                id: { type: "string" },
                                parentId: { type: "string", nullable: true },
                                displayName: { type: "string" },
                                nodeClass: { type: "string" },
                                nodeId: { type: "string" },
                                hasChildren: { type: "boolean" }
                            }
                        }
                    }
                }),
                height: "calc(100% - 7rem)",
                columns: [
                    {
                        field: "selection",
                        title: " ",
                        width: "48px",
                        template: function (item) {
                            var selectable = browser.isNodeSelectable(item);
                            var isChecked = browser.selectedNode && String(browser.selectedNode.id) === String(item.id);
                            if (!selectable) {
                                return "";
                            }
                            return "<input type='radio' name='addressSpaceRadio' class='address-space-node-radio' value='" +
                                _.escape(item.id) + "'" +
                                (isChecked ? " checked='checked'" : "") + "/>";
                        }
                    },
                    {
                        field: "displayName",
                        title: browser.nls.Node || "Node",
                        expandable: true,
                        template: function (item) {
                            var icon = "eQ-fonts-folder";
                            if (item.nodeClass === "Method") {
                                icon = "eQ-fonts-process";
                            } else if (item.nodeClass === "Variable") {
                                icon = "eQ-fonts-variable";
                            }
                            return "<span class='eQ-icon " + icon + " ul-pad-1x-r'></span>" +
                                "<span class='address-space-node-title' title='" + _.escape(item.displayName || item.nodeId) + "'>" +
                                _.escape(item.displayName || item.nodeId) + "</span>";
                        }
                    },
                    {
                        field: "nodeClass",
                        title: browser.nls.NodeClass || "Node Class",
                        width: "110px",
                        template: function (item) {
                            return "<span class='ul-body-s-b address-space-nodeclass-badge'>" + _.escape(item.nodeClass || "") + "</span>";
                        }
                    },
                    {
                        field: "nodeId",
                        title: browser.nls.NodeId || "Node ID",
                        width: "140px",
                        template: function (item) {
                            return "<span class='eq-common-ellipsis' title='" + _.escape(item.nodeId || "") + "'>" +
                                _.escape(item.nodeId || "") + "</span>";
                        }
                    }
                ]
            });
        },

        _bindTreeEvents: function () {
            var browser = this;
            var treeWidget = this.treeListWidget ? (this.treeListWidget.widget || this.treeListWidget) : null;

            if (treeWidget?.bind) {
                treeWidget.bind("expand", function (e) {
                    var node = e.model;
                    if (node && node.needToFetchChildren && !browser.loadedNodeIds[node.nodeId]) {
                        browser._fetchChildren(node);
                    }
                });
            }

            this.containerElem.off("click", ".address-space-node-radio").on("click", ".address-space-node-radio", function (e) {
                var nodeId = $(this).val();
                var node = browser.allNodesMap[nodeId];
                if (node) {
                    browser._selectNode(node);
                }
            });

            this.containerElem.off("click", "#address-space-treelist tbody tr").on("click", "#address-space-treelist tbody tr", function (e) {
                if ($(e.target).is(".k-icon, .k-i-expand, .k-i-collapse, input[type='radio']")) {
                    return;
                }
                var row = $(this);
                var tree = browser.treeListWidget ? (browser.treeListWidget.widget || browser.treeListWidget) : null;
                if (!tree?.dataItem) {
                    return;
                }
                var node = tree.dataItem(row);
                if (node && browser.isNodeSelectable(node)) {
                    browser._selectNode(node);
                    row.find(".address-space-node-radio").prop("checked", true);
                }
            });
        },

        isNodeSelectable: function (node) {
            if (!node) {
                return false;
            }
            if (this.targetMode === "DATA_CHANGE_WRITE") {
                return node.nodeClass === "Variable";
            }
            if (this.targetMode === "CALL_METHOD") {
                return node.nodeClass === "Method";
            }
            return false;
        },

        _selectNode: function (node) {
            this.selectedNode = node;
            this._updateActionButtonState();
        },

        _updateActionButtonState: function () {
            var btn = this.containerElem.find("#address-space-select-btn");
            if (this.selectedNode && this.isNodeSelectable(this.selectedNode)) {
                btn.removeAttr("disabled").removeClass("k-state-disabled");
            } else {
                btn.attr("disabled", "disabled").addClass("k-state-disabled");
            }
        },

        openForBrowse: function (targetRow, targetMode, connectionData) {
            var browser = this;
            this.targetRow = targetRow;
            this.targetMode = targetMode || "DATA_CHANGE_WRITE";
            this.connectionData = connectionData;

            var actionLabel = (this.targetMode === "CALL_METHOD")
                ? (this.nls.SelectMethod || "Select Method")
                : (this.nls.SelectNode || "Select Node");

            this.containerElem.find("#address-space-select-btn").text(actionLabel);

            this.selectedNode = null;
            this._updateActionButtonState();

            if (this.globalSelf.addressSpaceDrawer) {
                this.globalSelf.addressSpaceDrawer.expand("invokeopcua-address-space-drawer-section");
            }

            var currentConnId = connectionData ? connectionData.connectionId : null;
            if (!this.lastFetchedConnId || String(this.lastFetchedConnId) !== String(currentConnId)) {
                this._fetchRootAddressSpace();
            } else {
                this._preselectTargetNode();
            }
        },

        _preselectTargetNode: function () {
            if (!this.targetRow) {
                return;
            }
            var targetNodeId = this.targetRow.get ? this.targetRow.get("nodeId") : this.targetRow.nodeId;
            if (!targetNodeId) {
                return;
            }

            for (var id in this.allNodesMap) {
                if (this.allNodesMap[id].nodeId === targetNodeId) {
                    this._selectNode(this.allNodesMap[id]);
                    this.containerElem.find(".address-space-node-radio[value='" + id + "']").prop("checked", true);
                    break;
                }
            }
        },

        _fetchRootAddressSpace: function () {
            var browser = this;
            if (!this.connectionData || !this.connectionData.connectionId) {
                return;
            }

            this.waitWidget.show();
            this.allNodesMap = {};
            this.loadedNodeIds = {};
            this.lastFetchedConnId = this.connectionData.connectionId;

            var payload = {
                connectionId: this.connectionData.connectionId,
                connectionName: this.connectionData.connectionName || this.connectionData.name,
                name: this.connectionData.connectionName || this.connectionData.name,
                type: "OPCUA"
            };

            var promise = AjaxUtility.commonAjaxRequest(
                "POST",
                "transport/transportUIServices/fetchAddressSpace",
                JSON.stringify(payload),
                "json"
            );

            promise.done(function (response) {
                browser.waitWidget.hide();
                var data = response?.data || response || [];
                var flatList = browser._processNodes(data, null);

                var tree = browser.treeListWidget ? (browser.treeListWidget.widget || browser.treeListWidget) : null;
                if (tree?.setDataSource) {
                    var ds = new uilayer.data.TreeListDataSource({
                        data: flatList,
                        schema: {
                            model: {
                                id: "id",
                                parentId: "parentId",
                                fields: {
                                    id: { type: "string" },
                                    parentId: { type: "string", nullable: true },
                                    displayName: { type: "string" },
                                    nodeClass: { type: "string" },
                                    nodeId: { type: "string" },
                                    hasChildren: { type: "boolean" }
                                }
                            }
                        }
                    });
                    tree.setDataSource(ds);
                }

                browser._preselectTargetNode();
            });

            promise.fail(function (e) {
                browser.waitWidget.hide();
                uilayer.notifier("error", browser.nls.ErrorFetchingAddressSpace || "Error while fetching address space.");
            });
        },

        _processNodes: function (nodes, parentId) {
            var flat = [];
            var browser = this;

            if (!nodes || !Array.isArray(nodes)) {
                return flat;
            }

            nodes.forEach(function (node, index) {
                var uniqueId = node.id || (parentId ? parentId + "_" + (node.nodeId || index) : (node.nodeId || "node_" + index));
                var hasChildren = !!(node.needToFetchChildren || (node.children && node.children.length > 0));

                var nodeItem = {
                    id: String(uniqueId),
                    parentId: parentId ? String(parentId) : null,
                    nodeId: node.nodeId || "",
                    displayName: node.displayName || node.nodeId || "",
                    nodeClass: node.nodeClass || "",
                    needToFetchChildren: node.needToFetchChildren !== undefined ? node.needToFetchChildren : false,
                    hasChildren: hasChildren,
                    value: node.value !== undefined ? node.value : "",
                    valueType: node.valueType || "",
                    rawNode: node
                };

                browser.allNodesMap[nodeItem.id] = nodeItem;
                flat.push(nodeItem);

                if (node.children && node.children.length > 0) {
                    var childList = browser._processNodes(node.children, nodeItem.id);
                    flat = flat.concat(childList);
                }
            });

            return flat;
        },

        _fetchChildren: function (parentNode) {
            var browser = this;
            if (!parentNode || !parentNode.nodeId) {
                return;
            }

            this.waitWidget.show();
            this.loadedNodeIds[parentNode.nodeId] = true;

            var payload = {
                connectionId: this.connectionData.connectionId,
                connectionName: this.connectionData.connectionName || this.connectionData.name,
                name: this.connectionData.connectionName || this.connectionData.name,
                type: "OPCUA"
            };

            var url = "transport/transportUIServices/fetchAddressSpaceChildrenByID?nodeId=" + encodeURIComponent(parentNode.nodeId);
            var promise = AjaxUtility.commonAjaxRequest("POST", url, JSON.stringify(payload), "json");

            promise.done(function (response) {
                browser.waitWidget.hide();
                var children = response?.data || response || [];
                var flatChildren = browser._processNodes(children, parentNode.id);

                var tree = browser.treeListWidget ? (browser.treeListWidget.widget || browser.treeListWidget) : null;
                if (tree?.dataSource) {
                    flatChildren.forEach(function (childItem) {
                        if (!tree.dataSource.get(childItem.id)) {
                            tree.dataSource.add(childItem);
                        }
                    });
                    parentNode.set("needToFetchChildren", false);
                }
            });

            promise.fail(function (e) {
                browser.waitWidget.hide();
                uilayer.notifier("error", browser.nls.ErrorFetchingChildren || "Error while fetching child nodes.");
            });
        },

        _onSelectNodeClick: function () {
            if (!this.selectedNode || !this.targetRow) {
                return;
            }

            var browser = this;
            var node = this.selectedNode;
            var row = this.targetRow;

            if (this.targetMode === "DATA_CHANGE_WRITE") {
                this._populateDataChangeRow(row, node);
                this._closeDrawer();
            } else if (this.targetMode === "CALL_METHOD") {
                this._populateCallMethodRow(row, node);
            }
        },

        _populateDataChangeRow: function (row, node) {
            var displayName = node.displayName || "";
            var name = displayName.replace(/\s/g, "");
            var nodeId = node.nodeId || "";
            var sampleVal = node.value !== undefined ? String(node.value) : "";

            if (row.set) {
                row.set("name", name);
                row.set("nodeId", nodeId);
                row.set("sampleValue", sampleVal);
                var curNewVal = row.get("newValue");
                if (!curNewVal && node.value !== undefined) {
                    row.set("newValue", GridUtils.getDefaultExpression(node.value));
                }
            } else {
                row.name = name;
                row.nodeId = nodeId;
                row.sampleValue = sampleVal;
                if (!row.newValue && node.value !== undefined) {
                    row.newValue = GridUtils.getDefaultExpression(node.value);
                }
            }

            if (this.globalSelf.dataChangeWriteGrid?.widget) {
                this.globalSelf.dataChangeWriteGrid.widget.refresh();
                GridUtils.initializeGridHelpTooltips(this.globalSelf.$(".cvt-grid-div-data-change-write"));
            }
        },

        _populateCallMethodRow: function (row, node) {
            var browser = this;
            var displayName = node.displayName || "";
            var name = displayName.replace(/\s/g, "");
            var nodeId = node.nodeId || "";
            var parentObjectNodeId = this._resolveParentNodeId(node);

            if (row.set) {
                row.set("name", name);
                row.set("nodeId", nodeId);
                row.set("objectNodeId", parentObjectNodeId);
            } else {
                row.name = name;
                row.nodeId = nodeId;
                row.objectNodeId = parentObjectNodeId;
            }

            this.waitWidget.show();

            var payload = {
                connectionId: this.connectionData.connectionId,
                connectionName: this.connectionData.connectionName || this.connectionData.name,
                name: this.connectionData.connectionName || this.connectionData.name,
                type: "OPCUA"
            };

            var url = "transport/transportUIServices/fetchMethodParamsByID?nodeId=" + encodeURIComponent(nodeId);
            var promise = AjaxUtility.commonAjaxRequest("POST", url, JSON.stringify(payload), "json");

            promise.done(function (response) {
                browser.waitWidget.hide();
                var data = response?.data || response || {};
                var inputArgs = data.inputArguments || data.inputParameters || [];

                var params = inputArgs.map(function (arg) {
                    return {
                        name: arg.name || arg.displayName || "",
                        type: arg.dataType || arg.valueType || arg.type || "String",
                        value: "",
                        description: arg.description || ""
                    };
                });

                if (row.set) {
                    row.set("inputParameters", params);
                } else {
                    row.inputParameters = params;
                }

                if (browser.globalSelf.callMethodGrid?.widget) {
                    browser.globalSelf.callMethodGrid.widget.refresh();
                    GridUtils.initializeGridHelpTooltips(browser.globalSelf.$(".cvt-grid-div-call-method"));
                }

                browser._closeDrawer();
            });

            promise.fail(function () {
                browser.waitWidget.hide();
                if (browser.globalSelf.callMethodGrid?.widget) {
                    browser.globalSelf.callMethodGrid.widget.refresh();
                    GridUtils.initializeGridHelpTooltips(browser.globalSelf.$(".cvt-grid-div-call-method"));
                }
                browser._closeDrawer();
            });
        },

        _resolveParentNodeId: function (node) {
            if (!node || !node.parentId) {
                return "";
            }
            var parentNode = this.allNodesMap[node.parentId];
            return parentNode ? (parentNode.nodeId || "") : "";
        },

        _onSearch: function (query) {
            var tree = this.treeListWidget ? (this.treeListWidget.widget || this.treeListWidget) : null;
            if (!tree?.dataSource) {
                return;
            }

            query = (query || "").trim();
            if (!query) {
                tree.dataSource.filter([]);
                return;
            }

            tree.dataSource.filter({
                logic: "or",
                filters: [
                    { field: "displayName", operator: "contains", value: query },
                    { field: "nodeId", operator: "contains", value: query }
                ]
            });
        },

        _closeDrawer: function () {
            if (this.globalSelf.addressSpaceDrawer) {
                this.globalSelf.addressSpaceDrawer.collapse("invokeopcua-address-space-drawer-section");
            }
        },

        onDestroy: function () {
            this.containerElem?.off();
            this.waitWidget?.destroy();
            this.waitWidget = null;
            this.selectButton?.destroy();
            this.selectButton = null;
            this.searchInput?.destroy();
            this.searchInput = null;
            if (this.treeListWidget) {
                this.treeListWidget.destroy();
                this.treeListWidget = null;
            }
            this.selectedNode = null;
            this.targetRow = null;
            this.allNodesMap = null;
            this.loadedNodeIds = null;
        }
    };

    return AddressSpaceBrowser;
});
