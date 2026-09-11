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
            this.nls = globalSelf?.nls;
            this.selectedNode = null;
            this.targetRow = null;
            this.targetMode = null;
            this.openedFromBrowse = false;
            this.connectionData = null;
            this.allNodesMap = {};
            this.loadedNodeIds = {};
            this._rendered = false;
            this.lastFetchedConnId = null;

            // Render drawer contents immediately with empty treelist
            this.render();
        },

        _ensureRendered: function () {
            if (!this._rendered) {
                this.render();
            }
        },

        render: function () {
            this._rendered = true;
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
                    if (browser.openedFromBrowse && browser.targetRow) {
                        browser._onSelectNodeClick();
                    }
                }
            });

            this.searchInput = uilayer.textBox({
                elem: this.containerElem.find("#address-space-search-textbox")
            });

            this.containerElem.find("#address-space-search-textbox").on("keyup", function () {
                browser._onSearch($(this).val());
            });

            this._initTreeList([]);
            this._bindTreeEvents();
            this._updateActionButtonState();
        },

        _createTreeDataSource: function (data) {
            return {
                data: data || [],
                schema: {
                    model: {
                        id: "id",
                        parentId: "parentId",
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
        },

        _getTreeWidget: function () {
            if (this.treeListWidget) {
                return this.treeListWidget.widget || this.treeListWidget;
            }
            if (this.containerElem) {
                var elem = this.containerElem.find("#address-space-treelist");
                if (elem.length) {
                    return elem.data("ulTreeList") || null;
                }
            }
            return null;
        },

        _getTreeColumns: function () {
            var browser = this;
            return [
                {
                    field: "selection",
                    title: " ",
                    width: "56px",
                    attributes: { "class": "address-space-selection-cell" },
                    headerAttributes: { "class": "address-space-selection-cell" },
                    template: function (item) {
                        if (!item) {
                            return "";
                        }
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
                    title: browser.nls?.Node,
                    expandable: true,
                    template: function (item) {
                        if (!item) {
                            return "";
                        }
                        var icon = "eQ-fonts-folder";
                        var nc = (item.nodeClass || "").toUpperCase();
                        if (nc === "METHOD" || nc.indexOf("METHOD") !== -1) {
                            icon = "eQ-fonts-process";
                        } else if (nc === "VARIABLE" || nc === "PROPERTY") {
                            icon = "eQ-fonts-variable";
                        }
                        var title = item.displayName || item.nodeId || "";
                        return "<span class='eQ-icon " + icon + " ul-pad-1x-r'></span>" +
                            "<span class='address-space-node-title' title='" + _.escape(title) + "'>" +
                            _.escape(title) + "</span>";
                    }
                },
                {
                    field: "nodeClass",
                    title: browser.nls?.NodeClass,
                    width: "110px",
                    template: function (item) {
                        if (!item) {
                            return "";
                        }
                        return "<span class='ul-body-s-b address-space-nodeclass-badge'>" + _.escape(item.nodeClass || "") + "</span>";
                    }
                },
                {
                    field: "nodeId",
                    title: browser.nls?.NodeId,
                    width: "140px",
                    template: function (item) {
                        if (!item) {
                            return "";
                        }
                        return "<span class='eq-common-ellipsis' title='" + _.escape(item.nodeId || "") + "'>" +
                            _.escape(item.nodeId || "") + "</span>";
                    }
                }
            ];
        },

        _initTreeList: function (initialData) {
            var elem = this.containerElem.find("#address-space-treelist");
            if (!elem.length) {
                return;
            }

            this.treeListWidget?.destroy?.();
            this.treeListWidget = null;
            elem.empty();

            var ds = this._createTreeDataSource(initialData || []);
            var columns = this._getTreeColumns();

            if (uilayer?.treeList) {
                this.treeListWidget = uilayer.treeList({
                    elem: elem,
                    dataSource: ds,
                    height: 400,
                    columns: columns
                });
            }
        },

        _bindTreeEvents: function () {
            var browser = this;
            var treeWidget = this._getTreeWidget();

            treeWidget?.bind?.("expand", function (e) {
                var node = e.model;
                if (node?.needToFetchChildren && !browser.loadedNodeIds[node.nodeId]) {
                    browser._fetchChildren(node);
                }
            });

            this.containerElem.off("click.addressSpaceRadio change.addressSpaceRadio", ".address-space-node-radio")
                .on("click.addressSpaceRadio change.addressSpaceRadio", ".address-space-node-radio", function () {
                    var nodeId = $(this).val();
                    var node = browser.allNodesMap?.[nodeId] || { id: nodeId, nodeId: nodeId };
                    browser._selectNode(node);
                });

            this.containerElem.off("click.addressSpaceRow", "#address-space-treelist tbody tr")
                .on("click.addressSpaceRow", "#address-space-treelist tbody tr", function (e) {
                    var target = $(e.target);
                    if (target.closest("[class*='expand'], [class*='collapse'], .eQ-icon").length) {
                        return;
                    }
                    var row = $(this);
                    var tree = browser._getTreeWidget();
                    if (!tree?.dataItem) {
                        return;
                    }
                    var node = tree.dataItem(row);
                    if (node && browser.isNodeSelectable(node)) {
                        browser._selectNode(node);
                    }
                });

            this.containerElem.off("click.addressSpaceSelect", "#address-space-select-btn")
                .on("click.addressSpaceSelect", "#address-space-select-btn", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!$(this).hasClass("ul-state-disabled") && !$(this).attr("disabled") && browser.openedFromBrowse && browser.targetRow) {
                        browser._onSelectNodeClick();
                    }
                });
        },

        isNodeSelectable: function (node) {
            if (!node) {
                return false;
            }
            var nodeClass = (node.nodeClass || node.get?.("nodeClass") || "").toUpperCase();
            if (this.targetMode === "DATA_CHANGE_WRITE") {
                return nodeClass === "VARIABLE" || nodeClass === "VARIABLETYPE" || nodeClass === "PROPERTY";
            }
            if (this.targetMode === "CALL_METHOD") {
                return nodeClass === "METHOD";
            }
            if (this.targetMode === "PARENT_OBJECT") {
                return nodeClass === "OBJECT" || nodeClass === "OBJECTTYPE" || nodeClass === "FOLDER";
            }
            return Boolean(nodeClass);
        },

        _selectNode: function (node) {
            if (!node) {
                return;
            }
            var id = node.id || node.get?.("id") || null;
            var nodeId = node.nodeId || node.get?.("nodeId") || null;
            var actualNode = null;
            if (this.allNodesMap) {
                actualNode = (id && this.allNodesMap[id]) || (nodeId && this.allNodesMap[nodeId]) || null;
            }
            if (!actualNode) {
                actualNode = node;
            }
            this.selectedNode = actualNode;

            var lookupId = actualNode.id || actualNode.get?.("id") || id;
            if (lookupId) {
                this.containerElem.find(".address-space-node-radio").prop("checked", false);
                this.containerElem.find(".address-space-node-radio").filter(function () {
                    return $(this).val() === String(lookupId);
                }).prop("checked", true);
            }

            this._updateActionButtonState();
        },

        _updateActionButtonState: function () {
            var canSelect = Boolean(this.openedFromBrowse && this.targetRow && this.selectedNode && this.isNodeSelectable(this.selectedNode));
            this.selectButton?.enable?.(canSelect);
            var btn = this.containerElem ? this.containerElem.find("#address-space-select-btn") : null;
            if (btn?.length) {
                var kendoBtn = btn.data ? btn.data("kendoButton") : null;
                kendoBtn?.enable?.(canSelect);
                if (canSelect) {
                    btn.removeAttr("disabled").removeClass("ul-state-disabled k-state-disabled");
                } else {
                    btn.attr("disabled", "disabled").addClass("ul-state-disabled k-state-disabled");
                }
            }
        },

        _getEffectiveConnectionPayload: function () {
            var connData = this.connectionData ||
                this.globalSelf?.getConnectionPayload?.() || {};
            var connId = connData.connectionId;
            var connName = connData.connectionName || connData.name;
            if (!connId) {
                return null;
            }
            return {
                connectionId: connId,
                connectionName: connName,
                name: connName,
                type: connData.type || "OPC_UA",
                connectionType: connData.connectionType || "OPC_UA"
            };
        },

        isDrawerOpen: function () {
            if (!this.globalSelf?.$el) {
                return false;
            }
            var sec = this.globalSelf.$el.find("#invokeopcua-address-space-drawer-section");
            return Boolean(sec.length && sec.is(":visible") && sec.width() > 50 && !sec.hasClass("ul-state-collapsed"));
        },

        onConnectionChange: function (connectionData) {
            this.connectionData = connectionData || this._getEffectiveConnectionPayload();
            this.allNodesMap = {};
            this.loadedNodeIds = {};
            this.selectedNode = null;
            this.lastFetchedConnId = null;
            this._updateActionButtonState();

            var tree = this._getTreeWidget();
            tree?.setDataSource?.(this._createTreeDataSource([]));

            if (this.isDrawerOpen() && this.connectionData?.connectionId) {
                this._fetchRootAddressSpace();
            }
        },

        openForBrowse: function (targetRow, targetMode, connectionData) {
            var browser = this;
            this._isProgrammaticBrowseOpen = true;
            this.openedFromBrowse = true;
            this.targetRow = targetRow;
            this.targetMode = targetMode || "DATA_CHANGE_WRITE";
            this.connectionData = connectionData || this._getEffectiveConnectionPayload();

            setTimeout(function () {
                browser._isProgrammaticBrowseOpen = false;
            }, 1000);

            this.globalSelf?.addressSpaceDrawer?.expand?.("invokeopcua-address-space-drawer-section");
            this.globalSelf?.$el?.find("#invokeopcua-address-space-drawer-section")?.removeClass("ul-state-collapsed");

            this._ensureRendered();

            var actionLabel = (this.targetMode === "CALL_METHOD")
                ? this.nls?.SelectMethod
                : this.nls?.SelectNode;

            this.containerElem.find("#address-space-select-btn").text(actionLabel);

            this.selectedNode = null;
            this._updateActionButtonState();

            // After drawer animation, resize TreeList so it properly paints in expanded container
            setTimeout(function () {
                var tree = browser._getTreeWidget();
                tree?.resize?.(true);
                var wrapper = browser.containerElem.find(".address-space-treelist-wrapper");
                var wh = wrapper.length ? wrapper.height() : 0;
                if (wh > 50) {
                    tree?.setOptions?.({ height: wh });
                }
            }, 250);

            if (!this.connectionData?.connectionId) {
                uilayer.notifier("warning", this.nls?.SelectConnection);
                return;
            }

            var currentConnId = this.connectionData.connectionId;
            if (!this.lastFetchedConnId || String(this.lastFetchedConnId) !== String(currentConnId)) {
                this._fetchRootAddressSpace();
            } else {
                this._preselectTargetNode();
            }
        },

        openOnDrawerExpand: function () {
            this.globalSelf?.$el?.find("#invokeopcua-address-space-drawer-section")?.removeClass("ul-state-collapsed");
            this._ensureRendered();

            // If the drawer was NOT opened programmatically from a Browse button,
            // ensure it operates in view-only mode with the select button disabled.
            if (!this._isProgrammaticBrowseOpen && !this.openedFromBrowse) {
                this.openedFromBrowse = false;
                this.targetRow = null;
                this.targetMode = null;
                if (this.containerElem) {
                    this.containerElem.find("#address-space-select-btn").text(this.nls?.SelectNode);
                }
                this._updateActionButtonState();
            }

            var browser = this;
            setTimeout(function () {
                var tree = browser._getTreeWidget();
                tree?.resize?.(true);
                var wrapper = browser.containerElem.find(".address-space-treelist-wrapper");
                var wh = wrapper.length ? wrapper.height() : 0;
                if (wh > 50) {
                    tree?.setOptions?.({ height: wh });
                }
            }, 250);

            var conn = this._getEffectiveConnectionPayload();
            if (!conn?.connectionId) {
                return;
            }

            var currentConnId = conn.connectionId;
            if (!this.lastFetchedConnId || String(this.lastFetchedConnId) !== String(currentConnId)) {
                this._fetchRootAddressSpace();
            }
        },

        _preselectTargetNode: function () {
            if (!this.targetRow) {
                return;
            }
            var targetNodeId = this.targetRow.get ? this.targetRow.get("nodeId") : this.targetRow?.nodeId;
            if (!targetNodeId) {
                return;
            }

            for (var id in this.allNodesMap) {
                if (this.allNodesMap[id]?.nodeId === targetNodeId) {
                    this._selectNode(this.allNodesMap[id]);
                    break;
                }
            }
        },

        _fetchRootAddressSpace: function () {
            var browser = this;
            var payload = this._getEffectiveConnectionPayload();
            if (!payload?.connectionId) {
                return;
            }

            this.waitWidget?.show?.();
            this.allNodesMap = {};
            this.loadedNodeIds = {};
            this.lastFetchedConnId = payload.connectionId;

            var promise = AjaxUtility.commonAjaxRequest(
                "POST",
                "activities/invokeopcua/fetchAddressSpace",
                JSON.stringify(payload),
                "json"
            );

            promise?.done?.(function (response) {
                browser.waitWidget?.hide?.();
                var data = response?.data || response || [];
                var flatList = browser._processNodes(data, null);

                var tree = browser._getTreeWidget();
                if (!tree) {
                    browser._initTreeList(flatList);
                    browser._bindTreeEvents();
                    tree = browser._getTreeWidget();
                } else if (tree.setDataSource) {
                    var ds = browser._createTreeDataSource(flatList);
                    tree.setDataSource(ds);
                }

                tree?.resize?.(true);
                browser._preselectTargetNode();
            });

            promise?.fail?.(function () {
                browser.waitWidget?.hide?.();
                uilayer.notifier("error", browser.nls?.ErrorFetchingAddressSpace);
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
                var hasChildren = Boolean(node.needToFetchChildren || (node.children && node.children.length > 0));

                var nodeItem = {
                    id: String(uniqueId),
                    parentId: parentId ? String(parentId) : null,
                    nodeId: node.nodeId || "",
                    displayName: node.displayName || node.nodeId || "",
                    nodeClass: node.nodeClass || "",
                    needToFetchChildren: (node.needToFetchChildren !== null && node.needToFetchChildren !== void 0) ? node.needToFetchChildren : false,
                    hasChildren: hasChildren,
                    value: (node.value !== null && node.value !== void 0) ? node.value : "",
                    valueType: node.valueType || "",
                    rawNode: node
                };

                browser.allNodesMap[nodeItem.id] = nodeItem;
                if (nodeItem.nodeId) {
                    browser.allNodesMap[nodeItem.nodeId] = nodeItem;
                }
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
            if (!parentNode?.nodeId) {
                return;
            }

            this.waitWidget?.show?.();
            this.loadedNodeIds[parentNode.nodeId] = true;

            var payload = this._getEffectiveConnectionPayload();
            var url = "activities/invokeopcua/fetchAddressSpaceChildrenByID?nodeId=" + encodeURIComponent(parentNode.nodeId);
            var promise = AjaxUtility.commonAjaxRequest("POST", url, JSON.stringify(payload), "json");

            promise?.done?.(function (response) {
                browser.waitWidget?.hide?.();
                var children = response?.data || response || [];
                var flatChildren = browser._processNodes(children, parentNode.id);

                var tree = browser._getTreeWidget();
                if (tree?.dataSource) {
                    flatChildren.forEach(function (childItem) {
                        if (!tree.dataSource.get(childItem.id)) {
                            tree.dataSource.add(childItem);
                        }
                    });
                    parentNode.set?.("needToFetchChildren", false);
                }
            });

            promise?.fail?.(function () {
                browser.waitWidget?.hide?.();
                uilayer.notifier("error", browser.nls?.ErrorFetchingChildren);
            });
        },

        _onSelectNodeClick: function () {
            if (!this.openedFromBrowse || !this.targetRow || !this.selectedNode) {
                return;
            }

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
            if (!row || !node) {
                return;
            }
            var displayName = (node.get ? node.get("displayName") : node.displayName) || "";
            var name = displayName.replace(/\s/g, "");
            var nodeId = (node.get ? node.get("nodeId") : node.nodeId) || "";
            var val = (node.get ? node.get("value") : node.value);
            var sampleVal = (val !== null && val !== void 0) ? String(val) : "";

            if (row.set) {
                row.set("name", name);
                row.set("nodeId", nodeId);
                row.set("sampleValue", sampleVal);
                var curNewVal = row.get ? row.get("newValue") : row.newValue;
                if (!curNewVal && val !== null && val !== void 0) {
                    row.set("newValue", GridUtils.getDefaultExpression(val));
                }
            } else {
                row.name = name;
                row.nodeId = nodeId;
                row.sampleValue = sampleVal;
                if (!row.newValue && val !== null && val !== void 0) {
                    row.newValue = GridUtils.getDefaultExpression(val);
                }
            }

            var grid = this.globalSelf?.dataChangeWriteGrid ? (this.globalSelf.dataChangeWriteGrid.widget || this.globalSelf.dataChangeWriteGrid) : null;
            if (grid?.refresh) {
                grid.refresh();
                GridUtils.initializeGridHelpTooltips(this.globalSelf.$(".cvt-grid-div-data-change-write"));
            }
        },

        _populateCallMethodRow: function (row, node) {
            if (!row || !node) {
                return;
            }
            var browser = this;
            var displayName = (node.get ? node.get("displayName") : node.displayName) || "";
            var name = displayName.replace(/\s/g, "");
            var nodeId = (node.get ? node.get("nodeId") : node.nodeId) || "";
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

            var grid = this.globalSelf?.callMethodGrid ? (this.globalSelf.callMethodGrid.widget || this.globalSelf.callMethodGrid) : null;
            grid?.refresh?.();

            this.waitWidget?.show?.();

            var payload = this._getEffectiveConnectionPayload();
            var url = "activities/invokeopcua/fetchMethodParamsByID?nodeId=" + encodeURIComponent(nodeId);
            var promise = AjaxUtility.commonAjaxRequest("POST", url, JSON.stringify(payload), "json");

            promise?.done?.(function (response) {
                browser.waitWidget?.hide?.();
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

                var g = browser.globalSelf?.callMethodGrid ? (browser.globalSelf.callMethodGrid.widget || browser.globalSelf.callMethodGrid) : null;
                if (g?.refresh) {
                    g.refresh();
                    GridUtils.initializeGridHelpTooltips(browser.globalSelf.$(".cvt-grid-div-call-method"));
                }
                browser._closeDrawer();
            });

            promise?.fail?.(function () {
                browser.waitWidget?.hide?.();
                if (browser.globalSelf?.callMethodGrid?.widget) {
                    browser.globalSelf.callMethodGrid.widget.refresh();
                    GridUtils.initializeGridHelpTooltips(browser.globalSelf.$(".cvt-grid-div-call-method"));
                }
                uilayer.notifier("error", browser.nls?.ErrorFetchingMethodParams);
                browser._closeDrawer();
            });
        },

        _populateParentObjectRow: function (row, node) {
            if (!row || !node) {
                return;
            }
            var objectName = (node.get ? node.get("displayName") : node.displayName) || "";
            var objectNodeId = (node.get ? node.get("nodeId") : node.nodeId) || "";

            if (row.set) {
                row.set("objectName", objectName);
                row.set("objectNodeId", objectNodeId);
            } else {
                row.objectName = objectName;
                row.objectNodeId = objectNodeId;
            }

            var grid = this.globalSelf?.callMethodGrid ? (this.globalSelf.callMethodGrid.widget || this.globalSelf.callMethodGrid) : null;
            if (grid?.refresh) {
                grid.refresh();
                GridUtils.initializeGridHelpTooltips(this.globalSelf.$(".cvt-grid-div-call-method"));
            }
        },

        _getParentNode: function (node) {
            return node?.parentId ? (this.allNodesMap[node.parentId] || null) : null;
        },

        _resolveParentNodeId: function (node) {
            return this._getParentNode(node)?.nodeId || "";
        },

        _resolveParentNodeName: function (node) {
            var parentNode = this._getParentNode(node);
            return parentNode ? (parentNode.displayName || parentNode.nodeId || "") : "";
        },

        _onSearch: function (query) {
            var tree = this._getTreeWidget();
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
            this.globalSelf?.addressSpaceDrawer?.collapse?.("invokeopcua-address-space-drawer-section");
            this.onDrawerCollapse();
        },

        onDrawerCollapse: function () {
            this._isProgrammaticBrowseOpen = false;
            this.openedFromBrowse = false;
            this.targetRow = null;
            this.targetMode = null;
            this._updateActionButtonState();
            this.globalSelf?.$el?.find("#invokeopcua-address-space-drawer-section")?.addClass("ul-state-collapsed");
        },

        onDestroy: function () {
            this.containerElem?.off();
            this.containerElem?.empty();
            this.waitWidget?.destroy?.();
            this.waitWidget = null;
            this.selectButton?.destroy?.();
            this.selectButton = null;
            this.searchInput?.destroy?.();
            this.searchInput = null;
            this.treeListWidget?.destroy?.();
            this.treeListWidget = null;
            this._rendered = false;
            this.lastFetchedConnId = null;
            this.selectedNode = null;
            this.targetRow = null;
            this.allNodesMap = null;
            this.loadedNodeIds = null;
        }
    };

    return AddressSpaceBrowser;
});
