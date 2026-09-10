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

            this.containerElem.find("#address-space-search-textbox").on("keyup", function () {
                browser._onSearch($(this).val());
            });

            // NOTE: Do NOT call _initTreeList() here.
            // The drawer is collapsed at render time (display:none), so Kendo
            // would compute 0x0 dimensions and render a blank widget.
            // TreeList is initialized lazily on first openForBrowse().
            this._bindTreeEvents();
        },

        _getContainer: function () {
            if (this.globalSelf && this.globalSelf.$el) {
                var el = this.globalSelf.$el.find("#invokeopcua-address-space-component");
                if (el.length) {
                    return el;
                }
            }
            return this.containerElem || $(document).find("#invokeopcua-address-space-component");
        },

        _getTreeWidget: function () {
            if (this.treeListWidget) {
                return this.treeListWidget.widget || this.treeListWidget;
            }
            var container = this._getContainer();
            if (container && container.length) {
                var elem = container.find("#address-space-treelist");
                if (elem && elem.length) {
                var treeListWidget = elem.data("treeList") || elem.data("ulTreeList") || elem;
                    return treeListWidget;
                }
            }
            return null;
        },

        _createTreeListDataSource: function (data) {
            var dsConfig = {
                data: data || [],
                schema: {
                    model: {
                        id: "id",
                        parentId: "parentId",
                        hasChildren: "hasChildren",
                        expanded: true,
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
            };

            if (typeof uilayer !== "undefined" && uilayer.data && typeof uilayer.data.TreeListDataSource === "function") {
                return new uilayer.data.TreeListDataSource(dsConfig);
            }
            // Fallback: uilayer.data.TreeListDataSource is the only supported path.
            // Direct window.kendo access is intentionally removed.
            return dsConfig;
        },

        _initTreeList: function (initialData) {
            var browser = this;
            var container = this._getContainer();
            if (!container || !container.length) {
                return;
            }

            var elem = container.find("#address-space-treelist");
            if (!elem.length) {
                this.render();
                container = this._getContainer();
                elem = container ? container.find("#address-space-treelist") : $();
            }
            if (!elem.length) {
                return;
            }

            var existingTree = this._getTreeWidget();
            if (existingTree && typeof existingTree.destroy === "function") {
                existingTree.destroy();
                this.treeListWidget = null;
                elem.empty();
            }

            var dataList = initialData || browser.rawAddressSpaceNodes || [];
            var dataSource = browser._createTreeListDataSource(dataList);

            // Use a concrete pixel height. "100%" fails when the drawer
            // is transitioning or the parent has display:none.
            var wrapperElem = container.find(".address-space-treelist-wrapper");
            var wrapperHeight = wrapperElem.length ? wrapperElem.height() : 0;
            var treeHeight = (wrapperHeight && wrapperHeight > 50) ? wrapperHeight : 400;

            this.treeListWidget = uilayer.treeList({
                elem: elem,
                dataSource: dataSource,
                height: treeHeight,
                columns: [
                    {
                        field: "displayName",
                        title: browser.nls.Node || "Node",
                        template: function (item) {
                            var selectable = browser.isNodeSelectable(item);
                            var itemId = (item.get ? item.get("id") : item.id) || "";
                            var itemNodeId = (item.get ? item.get("nodeId") : item.nodeId) || "";
                            var itemDisplayName = (item.get ? item.get("displayName") : item.displayName) || itemNodeId || "";
                            var itemNodeClass = ((item.get ? item.get("nodeClass") : item.nodeClass) || "").toUpperCase();

                            var isChecked = browser.selectedNode && (
                                String(browser.selectedNode.id) === String(itemId) ||
                                String(browser.selectedNode.nodeId) === String(itemNodeId)
                            );

                            var icon = "eQ-fonts-folder";
                            if (itemNodeClass === "METHOD" || itemNodeClass.indexOf("METHOD") !== -1) {
                                icon = "eQ-fonts-process";
                            } else if (itemNodeClass === "VARIABLE" || itemNodeClass === "VARIABLETYPE" || itemNodeClass === "PROPERTY" || itemNodeClass === "DATAVARIABLE") {
                                icon = "eQ-fonts-variable";
                            }

                            var radioHtml = selectable
                                ? "<input type='radio' name='addressSpaceRadio' class='address-space-node-radio ul-pad-1x-r' value='" +
                                  _.escape(itemId) + "'" +
                                  (isChecked ? " checked='checked'" : "") + "/>"
                                : "";

                            return radioHtml +
                                "<span class='eQ-icon " + icon + " ul-pad-1x-r'></span>" +
                                "<span class='address-space-node-title' title='" + _.escape(itemDisplayName) + "'>" +
                                _.escape(itemDisplayName) + "</span>";
                        }
                    },
                    {
                        field: "nodeClass",
                        title: browser.nls.NodeClass || "Node Class",
                        width: "110px",
                        template: function (item) {
                            var nc = (item.get ? item.get("nodeClass") : item.nodeClass) || "";
                            return "<span class='ul-body-s-b address-space-nodeclass-badge'>" + _.escape(nc) + "</span>";
                        }
                    },
                    {
                        field: "nodeId",
                        title: browser.nls.NodeId || "Node ID",
                        width: "140px",
                        template: function (item) {
                            var nid = (item.get ? item.get("nodeId") : item.nodeId) || "";
                            return "<span class='eq-common-ellipsis' title='" + _.escape(nid) + "'>" +
                                _.escape(nid) + "</span>";
                        }
                    }
                ]
            });

            browser._bindTreeEvents();
        },

        _bindTreeEvents: function () {
            var browser = this;
            var treeWidget = this._getTreeWidget();

            if (treeWidget && typeof treeWidget.bind === "function") {
                treeWidget.unbind("expand");
                treeWidget.bind("expand", function (e) {
                    var node = e.model;
                    if (node && node.needToFetchChildren && !browser.loadedNodeIds[node.nodeId]) {
                        browser._fetchChildren(node);
                    }
                });
            }

            this.containerElem.off("click", ".address-space-node-radio").on("click", ".address-space-node-radio", function (e) {
                e.stopPropagation();
                var id = $(this).val();
                var node = browser.allNodesMap[id];
                if (node) {
                    browser._selectNode(node);
                }
            });

            this.containerElem.off("click", "#address-space-treelist tbody tr").on("click", "#address-space-treelist tbody tr", function (e) {
                // Skip click events on tree expand/collapse toggles and radio inputs.
                // Use a data-attribute guard that works regardless of Kendo's internal CSS classes.
                var target = $(e.target);
                if (target.is("input[type='radio']") ||
                    target.closest(".k-i-expand, .k-i-collapse, .k-icon, [data-role='treelistexpand']").length ||
                    target.hasClass("k-icon")) {
                    return;
                }
                var row = $(this);
                var tree = browser._getTreeWidget();
                if (!tree || typeof tree.dataItem !== "function") {
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
            var nodeClass = (node.nodeClass || "").toUpperCase();
            if (this.targetMode === "DATA_CHANGE_WRITE") {
                if (nodeClass === "VARIABLE" || nodeClass === "VARIABLETYPE" || nodeClass === "PROPERTY" || nodeClass === "DATAVARIABLE") {
                    return true;
                }
                if (nodeClass !== "OBJECT" && nodeClass !== "OBJECTTYPE" && nodeClass !== "FOLDER" && nodeClass !== "VIEW" && nodeClass !== "METHOD") {
                    return !!node.nodeId && !node.hasChildren;
                }
                return false;
            }
            if (this.targetMode === "CALL_METHOD") {
                return nodeClass === "METHOD" || nodeClass.indexOf("METHOD") !== -1;
            }
            if (this.targetMode === "PARENT_OBJECT") {
                return nodeClass !== "METHOD";
            }
            return false;
        },

        _selectNode: function (node) {
            this.selectedNode = node;
            this._updateActionButtonState();
        },

        _updateActionButtonState: function () {
            // Use uilayer button's enable/disable API if the button widget is available,
            // otherwise fall back to the HTML disabled attribute only (no kendo classes).
            if (this.selectButton && typeof this.selectButton.enable === "function") {
                if (this.selectedNode && this.isNodeSelectable(this.selectedNode)) {
                    this.selectButton.enable();
                } else {
                    this.selectButton.enable(false);
                }
            } else {
                var btn = this.containerElem.find("#address-space-select-btn");
                if (this.selectedNode && this.isNodeSelectable(this.selectedNode)) {
                    btn.removeAttr("disabled");
                } else {
                    btn.attr("disabled", "disabled");
                }
            }
        },

        _getEffectiveConnectionPayload: function () {
            var connData = this.connectionData || (this.globalSelf?.getConnectionPayload ? this.globalSelf.getConnectionPayload() : null) || {};
            var connId = connData.connectionId;
            var connName = connData.connectionName || connData.name;
            if (!connId) {
                return null;
            }
            return {
                connectionId: connId,
                connectionName: connName,
                name: connName,
                type: connData.type || "OPCUA",
                connectionType: connData.connectionType || "OPCUA"
            };
        },

        prefetchAddressSpace: function (connectionData) {
            this.connectionData = connectionData || this._getEffectiveConnectionPayload();
            if (!this.connectionData || !this.connectionData.connectionId) {
                return;
            }
            var currentConnId = this.connectionData.connectionId;
            var hasNodes = Object.keys(this.allNodesMap || {}).length > 0;
            if (!this.lastFetchedConnId || String(this.lastFetchedConnId) !== String(currentConnId) || !hasNodes) {
                this._fetchRootAddressSpace();
            }
        },

        openForBrowse: function (targetRow, targetMode, connectionData) {
            var browser = this;
            this.targetRow = targetRow;
            this.targetMode = targetMode || "DATA_CHANGE_WRITE";
            this.connectionData = connectionData || this._getEffectiveConnectionPayload();

            var actionLabel = (this.targetMode === "CALL_METHOD")
                ? (this.nls.SelectMethod || "Select Method")
                : (this.targetMode === "PARENT_OBJECT")
                    ? (this.nls.SelectParentObject || "Select Parent Object")
                    : (this.nls.SelectVariableNode || this.nls.SelectNode || "Select Node");

            var container = this._getContainer();
            if (container && container.length) {
                container.find("#address-space-select-btn").text(actionLabel);
            }

            this.selectedNode = null;
            this._updateActionButtonState();

            // Expand the drawer first, then init/refresh the TreeList after
            // the drawer animation completes so Kendo can compute real dimensions.
            if (this.globalSelf.addressSpaceDrawer) {
                this.globalSelf.addressSpaceDrawer.expand("invokeopcua-address-space-drawer-section");
            }

            if (!this.connectionData || !this.connectionData.connectionId) {
                uilayer.notifier("warning", this.nls.SelectConnection || "Please select a connection.");
                return;
            }

            var currentConnId = this.connectionData.connectionId;
            var hasNodes = browser.rawAddressSpaceNodes && browser.rawAddressSpaceNodes.length > 0;

            if (!this.lastFetchedConnId || String(this.lastFetchedConnId) !== String(currentConnId) || !hasNodes) {
                // Fetch fresh data; TreeList will be (re)initialized inside _fetchRootAddressSpace.
                this._fetchRootAddressSpace(function () {
                    browser._preselectTargetNode();
                });
            } else {
                // Data already cached — re-init the TreeList once the drawer is open.
                setTimeout(function () {
                    browser._initTreeList(browser.rawAddressSpaceNodes);
                    browser._preselectTargetNode();
                    browser._forceTreeResize();
                }, 150);
            }
        },

        _forceTreeResize: function () {
            var browser = this;
            var attempts = [100, 300, 600];
            attempts.forEach(function (delay) {
                setTimeout(function () {
                    var tree = browser._getTreeWidget();
                    if (tree && typeof tree.resize === "function") {
                        tree.resize();
                    }
                }, delay);
            });
        },

        _preselectTargetNode: function () {
            if (!this.targetRow) {
                return;
            }
            var targetNodeId = this.targetMode === "PARENT_OBJECT"
                ? (this.targetRow.get ? this.targetRow.get("objectNodeId") : this.targetRow.objectNodeId)
                : (this.targetRow.get ? this.targetRow.get("nodeId") : this.targetRow.nodeId);
            if (!targetNodeId) {
                return;
            }

            for (var id in this.allNodesMap) {
                if (this.allNodesMap[id].nodeId === targetNodeId) {
                    this._selectNode(this.allNodesMap[id]);
                    var container = this._getContainer();
                    if (container && container.length) {
                        container.find(".address-space-node-radio[value='" + id + "']").prop("checked", true);
                    }
                    break;
                }
            }
        },

        _fetchRootAddressSpace: function (onSuccess) {
            var browser = this;
            var payload = this._getEffectiveConnectionPayload();
            if (!payload || !payload.connectionId) {
                return;
            }

            this.waitWidget.show();
            this.allNodesMap = {};
            this.loadedNodeIds = {};
            this.lastFetchedConnId = payload.connectionId;

            var promise = AjaxUtility.commonAjaxRequest(
                "POST",
                "activities/invokeopcua/fetchAddressSpace",
                JSON.stringify(payload),
                "json"
            );

            promise.done(function (response) {
                browser.waitWidget.hide();
                var data = (response && Array.isArray(response.data)) ? response.data : (Array.isArray(response) ? response : (response && response.data ? response.data : (response && Array.isArray(response.result) ? response.result : (response && Array.isArray(response.response) ? response.response : []))));
                var flatList = browser._processNodes(data, null);
                browser.rawAddressSpaceNodes = flatList;

                // Wait for the drawer to be fully visible before initializing
                // the TreeList — otherwise Kendo computes 0px height.
                setTimeout(function () {
                    browser._initTreeList(flatList);
                    browser._forceTreeResize();
                }, 100);

                // Prefetch children for root nodes
                var rootNodesToFetch = flatList.filter(function (n) {
                    return !n.parentId && n.needToFetchChildren && !browser.loadedNodeIds[n.nodeId];
                });

                if (rootNodesToFetch.length > 0) {
                    setTimeout(function () {
                        rootNodesToFetch.forEach(function (rootNode) {
                            browser._fetchChildren(rootNode);
                        });
                    }, 250);
                }

                if (typeof onSuccess === "function") {
                    onSuccess();
                }

                browser._preselectTargetNode();
            });

            promise.fail(function (e) {
                browser.waitWidget.hide();
                browser.lastFetchedConnId = null;
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

            var payload = this._getEffectiveConnectionPayload();
            var url = "activities/invokeopcua/fetchAddressSpaceChildrenByID?nodeId=" + encodeURIComponent(parentNode.nodeId);
            var promise = AjaxUtility.commonAjaxRequest("POST", url, JSON.stringify(payload), "json");

            promise.done(function (response) {
                browser.waitWidget.hide();
                var children = (response && Array.isArray(response.data)) ? response.data : (Array.isArray(response) ? response : (response && response.data ? response.data : []));
                var flatChildren = browser._processNodes(children, parentNode.id);
                if (browser.rawAddressSpaceNodes) {
                    browser.rawAddressSpaceNodes = browser.rawAddressSpaceNodes.concat(flatChildren);
                }

                var tree = browser._getTreeWidget();
                if (tree && tree.dataSource) {
                    flatChildren.forEach(function (childItem) {
                        if (!tree.dataSource.get(childItem.id)) {
                            tree.dataSource.add(childItem);
                        }
                    });
                    if (typeof parentNode.set === "function") {
                        parentNode.set("needToFetchChildren", false);
                    }
                    if (typeof tree.resize === "function") {
                        tree.resize();
                    }
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
            } else if (this.targetMode === "PARENT_OBJECT") {
                this._populateParentObjectRow(row, node);
                this._closeDrawer();
            }
        },

        _populateDataChangeRow: function (row, node) {
            var displayName = node.displayName || node.nodeId || "";
            var name = displayName.replace(/\s+/g, "");
            var nodeId = node.nodeId || "";
            var sampleVal = node.value !== undefined ? String(node.value) : "";
            var rawNode = node.rawNode || {};

            if (row.set) {
                row.set("name", name);
                row.set("nodeId", nodeId);
                row.set("sampleValue", sampleVal);
                if (rawNode.dataTypeName) {
                    row.set("dataTypeName", rawNode.dataTypeName);
                }
                if (rawNode.dataTypeNodeId) {
                    row.set("dataTypeNodeId", rawNode.dataTypeNodeId);
                }
                var curNewVal = row.get("newValue");
                if (!curNewVal && node.value !== undefined && node.value !== "") {
                    row.set("newValue", GridUtils.getDefaultExpression(node.value));
                }
            } else {
                row.name = name;
                row.nodeId = nodeId;
                row.sampleValue = sampleVal;
                if (rawNode.dataTypeName) {
                    row.dataTypeName = rawNode.dataTypeName;
                }
                if (rawNode.dataTypeNodeId) {
                    row.dataTypeNodeId = rawNode.dataTypeNodeId;
                }
                if (!row.newValue && node.value !== undefined && node.value !== "") {
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
            var displayName = node.displayName || node.nodeId || "";
            var name = displayName.replace(/\s+/g, "");
            var nodeId = node.nodeId || "";
            var parentObjectNodeId = this._resolveParentNodeId(node);
            var parentObjectName = this._resolveParentNodeName(node);

            if (row.set) {
                row.set("name", name);
                row.set("nodeId", nodeId);
                row.set("objectNodeId", parentObjectNodeId);
                row.set("objectName", parentObjectName);
            } else {
                row.name = name;
                row.nodeId = nodeId;
                row.objectNodeId = parentObjectNodeId;
                row.objectName = parentObjectName;
            }

            if (browser.globalSelf.callMethodGrid?.widget) {
                browser.globalSelf.callMethodGrid.widget.refresh();
            }

            this.waitWidget.show();

            var payload = this._getEffectiveConnectionPayload();
            var url = "activities/invokeopcua/fetchMethodParamsByID?nodeId=" + encodeURIComponent(nodeId);
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

        _populateParentObjectRow: function (row, node) {
            var objectName = node.displayName || node.nodeId || "";
            var objectNodeId = node.nodeId || "";

            if (row.set) {
                row.set("objectName", objectName);
                row.set("objectNodeId", objectNodeId);
            } else {
                row.objectName = objectName;
                row.objectNodeId = objectNodeId;
            }

            if (this.globalSelf.callMethodGrid?.widget) {
                this.globalSelf.callMethodGrid.widget.refresh();
                GridUtils.initializeGridHelpTooltips(this.globalSelf.$(".cvt-grid-div-call-method"));
            }
        },

        _resolveParentNodeId: function (node) {
            if (!node || !node.parentId) {
                return "";
            }
            var parentNode = this.allNodesMap[node.parentId];
            return parentNode ? (parentNode.nodeId || "") : "";
        },

        _resolveParentNodeName: function (node) {
            if (!node || !node.parentId) {
                return "";
            }
            var parentNode = this.allNodesMap[node.parentId];
            return parentNode ? (parentNode.displayName || parentNode.nodeId || "") : "";
        },

        _onSearch: function (query) {
            var tree = this._getTreeWidget();
            if (!tree || !tree.dataSource) {
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
