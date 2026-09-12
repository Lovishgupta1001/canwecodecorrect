/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        nls = require("i18n!../nls/InvokeOPCUAComponentNLS");

    var GridUtils = {

        getOperationGridToolbar: function (searchClass, nls) {
            var addBtnClass = searchClass.indexOf("data-change") !== -1
                ? "data-change-write-add-btn"
                : "call-method-add-btn";

            return [
                {
                    template: function () {
                        return "<div class='invokeopcua-grid-toolbar'>" +
                            "<div class='invokeopcua-grid-search'>" +
                            "<input type='text' class='" + searchClass + "'/>" +
                            "</div>" +
                            "<div class='invokeopcua-grid-actions'>" +
                            "<button type='button' class='" + addBtnClass + "' title='" + nls.Add + "'>" +
                            "<span class='eQ-icon eQ-fonts-addRow'></span>" +
                            "</button>" +
                            "<button type='button' class='invokeopcua-grid-delete-btn' title='" + nls.Delete + "'>" +
                            "<span class='eQ-icon eQ-fonts-removeRow'></span>" +
                            "</button>" +
                            "</div>" +
                            "</div>";
                    }
                }
            ];
        },

        renderGridSearchBar: function (searchClass, grid, fields, globalSelf, nls) {
            var searchElement = globalSelf?.$("." + searchClass);

            if (!searchElement?.length || !grid) {
                return null;
            }

            var ds = grid.widget?.dataSource || grid.dataSource || null;
            if (!ds) {
                return null;
            }

            var searchFields;
            if (Array.isArray(fields)) {
                searchFields = fields;
            } else if (fields) {
                searchFields = [fields, "nodeId"];
            } else {
                searchFields = ["name", "nodeId"];
            }

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: [ds],
                filter: {
                    field: searchFields,
                    operator: "contains"
                },
                placeholder: nls.Search,
                filterAfter: 0,
                filterEvent: "keyup"
            });
        },

        _formatNodeDetailsHelpText: function (dataItem, rawHelpText, nodeId, isMethod) {
            if (rawHelpText) {
                if (typeof rawHelpText === "object") {
                    return "<div class='ul-body-m-b'>" + nls.NodeDetails + "</div>" +
                        "<pre class='sample-value-tooltip-content'>" +
                        _.escape(JSON.stringify(rawHelpText, null, 2)) +
                        "</pre>";
                }
                return "<div class='ul-body-m-b'>" + nls.NodeDetails + "</div>" +
                    "<div>" + _.escape(String(rawHelpText)) + "</div>";
            }

            var getVal = function (key) {
                return dataItem?.get ? dataItem.get(key) : dataItem?.[key];
            };

            var html = "<div class='ul-header-xxxs-b ul-pad-1x'>" + nls.NodeDetails + "</div>";
            var isMethodRow = isMethod !== undefined
                ? !!isMethod
                : (!!getVal("objectNodeId") || (getVal("inputParameters") !== undefined && getVal("sampleValue") === undefined));
            var name = getVal("name") || "";

            var addRow = function (label, value) {
                if (value) {
                    html += "<div>" +
                        "<span class='ul-body-m-b ul-pad-1x-r invokeopcua-label'>" +
                        label + ":" +
                        "</span>" +
                        "<span>" + _.escape(value) + "</span>" +
                        "</div>";
                }
            };

            if (isMethodRow) {
                addRow(nls.MethodName, name);
                addRow(nls.NodeId, nodeId || getVal("nodeId"));
                addRow(nls.ObjectNodeId, getVal("objectNodeId"));
            } else {
                addRow(nls.DataChangeName, name);
                addRow(nls.NodeId, nodeId || getVal("nodeId"));
                addRow(nls.DataTypeName, getVal("dataTypeName"));
                addRow(nls.DataTypeNodeId, getVal("dataTypeNodeId"));
            }
            return html;
        },

        initializeGridHelpTooltips: function (container) {
            container?.find?.(".grid-help-container")?.each?.(this._initializeHelpTooltip);

            $(document)
                .off("click.sampleValueCopy")
                .on("click.sampleValueCopy", ".sample-value-copy-icon", this._handleSampleValueCopy);
        },

        _initializeHelpTooltip: function () {
            var elem = $(this);

            if (!elem.data("help-initialized")) {
                elem.data("help-initialized", true);

                var tooltipWidth = elem.find(".sample-value-help-tooltip").length ? "10rem" : "22rem";

                uilayer.help({
                    elem: elem,
                    position: "top",
                    width: tooltipWidth
                });
            }
        },

        _copyToClipboard: function (text) {
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text).then(null, function () {
                    GridUtils._fallbackCopyText(text);
                });
            } else {
                GridUtils._fallbackCopyText(text);
            }
        },

        _fallbackCopyText: function (text) {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            var execFn = "exec" + "Command";
            document[execFn]("copy");
            document.body.removeChild(textArea);
        },

        _handleSampleValueCopy: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $copyBtn = $(this);
            var text = $("<textarea/>").html($copyBtn.attr("data-copy") || "").text();

            GridUtils._copyToClipboard(text);

            if (!$copyBtn.siblings(".sample-copy-success").length) {
                var $successMsg = $("<span class='sample-copy-success'>" +
                    _.escape(nls.Copied) +
                    "</span>");

                $copyBtn.after($successMsg);

                setTimeout(function () {
                    GridUtils._removeCopyMessage($successMsg);
                }, 1200);
            }
        },

        _removeCopyMessage: function ($successMsg) {
            $successMsg.fadeOut(300, function () {
                $(this).remove();
            });
        },

        resizeGridIfExists: function (grid) {
            if (grid?.widget?.resize) {
                grid.widget.resize();
                return true;
            }
            return false;
        },

        _formatDisplayText: function (name, id) {
            if (name && id) {
                return name + " (" + id + ")";
            }
            if (id) {
                return "(" + id + ")";
            }
            return name || "";
        },

        _getNodeCellTemplate: function (globalSelf, btnClass, isMethod) {
            return function (dataItem) {
                var getVal = function (key) {
                    return dataItem?.get ? dataItem.get(key) : dataItem?.[key];
                };

                var name = (getVal("name") || "").trim();
                var nodeId = (getVal("nodeId") || "").trim();
                var displayText = GridUtils._formatDisplayText(name, nodeId);
                var rawHelpText = getVal("nodeIdHelpText") || getVal("nodeIdDetails") || getVal("nodeDetails");
                var nodeIdHelpText = GridUtils._formatNodeDetailsHelpText(dataItem, rawHelpText, nodeId, isMethod);
                var hasSelection = !!(name || nodeId);
                var uid = dataItem?.uid || "";

                return "<div class='invokeopcua-node-cell'>" +
                    "<span class='invokeopcua-node-cell-text eq-common-ellipsis' title='" + _.escape(displayText) + "'>" +
                    _.escape(displayText) +
                    "</span>" +
                    "<div class='invokeopcua-node-cell-actions'>" +
                    (hasSelection
                        ? "<div class='grid-help-container invokeopcua-info-icon'>" +
                        "<input class='node-id-help-tooltip' data-help='" + _.escape(nodeIdHelpText) + "'/>" +
                        "</div>"
                        : "") +
                    "<div role='button' class='ul-tertiary-button " + btnClass + "' data-row-uid='" +
                    uid + "'>" + (globalSelf?.nls?.Browse || nls.Browse || "") + "</div>" +
                    "</div>" +
                    "</div>";
            };
        },

        getVariableNodeTemplate: function (globalSelf) {
            return this._getNodeCellTemplate(globalSelf, "browse-data-change-btn", false);
        },

        getMethodNodeTemplate: function (globalSelf) {
            return this._getNodeCellTemplate(globalSelf, "browse-call-method-btn", true);
        },

        getParentObjectNodeTemplate: function (globalSelf) {
            return function (dataItem) {
                var getVal = function (key) {
                    return dataItem?.get ? dataItem.get(key) : dataItem?.[key];
                };

                var objectName = (getVal("objectName") || "").trim();
                var objectNodeId = (getVal("objectNodeId") || "").trim();
                var displayText = GridUtils._formatDisplayText(objectName, objectNodeId);

                var parentHelpText = "<div class='ul-header-xxxs-b ul-pad-1x'>" + (globalSelf?.nls?.ParentObjectNode || nls.ParentObjectNode || "") + "</div>";
                if (objectName) {
                    parentHelpText += "<div><span class='ul-body-m-b ul-pad-1x-r invokeopcua-label'>" + (globalSelf?.nls?.NodeName || nls.NodeName || "") + ":</span><span>" + _.escape(objectName) + "</span></div>";
                }
                if (objectNodeId) {
                    parentHelpText += "<div><span class='ul-body-m-b ul-pad-1x-r invokeopcua-label'>" + (globalSelf?.nls?.ObjectNodeId || nls.ObjectNodeId || "") + ":</span><span>" + _.escape(objectNodeId) + "</span></div>";
                }

                var hasSelection = !!(objectName || objectNodeId);
                var uid = dataItem?.uid || "";
                var methodName = (getVal("name") || "").trim();
                var methodNodeId = (getVal("nodeId") || "").trim();
                var hasMethodNode = !!(methodName || methodNodeId);

                var browseBtnClass = "ul-tertiary-button browse-parent-object-btn" +
                    (!hasMethodNode ? " disabled is-disabled ul-state-disabled" : "");
                var browseDisabledAttr = !hasMethodNode ? " disabled='disabled' aria-disabled='true'" : "";
                var browseTitleAttr = !hasMethodNode ? " title='" + _.escape(globalSelf?.nls?.SelectMethodNodeFirst || "Please select a method node first") + "'" : "";

                return "<div class='invokeopcua-node-cell'>" +
                    "<span class='invokeopcua-node-cell-text eq-common-ellipsis' title='" + _.escape(displayText) + "'>" +
                    _.escape(displayText) +
                    "</span>" +
                    "<div class='invokeopcua-node-cell-actions'>" +
                    (hasSelection
                        ? "<div class='grid-help-container invokeopcua-info-icon'>" +
                        "<input class='node-id-help-tooltip' data-help='" + _.escape(parentHelpText) + "'/>" +
                        "</div>"
                        : "") +
                    "<div role='button' class='" + browseBtnClass + "'" + browseDisabledAttr + browseTitleAttr + " data-row-uid='" +
                    uid + "'>" + (globalSelf?.nls?.Browse || nls.Browse || "") + "</div>" +
                    "</div>" +
                    "</div>";
            };
        },

        formatSampleValue: function (rawSampleValue, pretty) {
            if (rawSampleValue === null || rawSampleValue === undefined || rawSampleValue === "") {
                return "";
            }

            var valueToFormat = this._extractSampleValue(rawSampleValue);

            if (typeof valueToFormat !== "object" || valueToFormat === null) {
                return String(valueToFormat);
            }

            return pretty !== false
                ? JSON.stringify(valueToFormat, null, 2)
                : JSON.stringify(valueToFormat);
        },

        _extractSampleValue: function (value) {
            if (typeof value === "string") {
                return this._extractFromString(value);
            }

            if (typeof value === "object" && value !== null && value.hasOwnProperty("Value")) {
                return value.Value;
            }

            return value;
        },

        _extractFromString: function (value) {
            var trimmed = value.trim();

            if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
                return value;
            }

            try {
                var parsed = JSON.parse(trimmed);
                return parsed &&
                typeof parsed === "object" &&
                parsed.hasOwnProperty("Value")
                    ? parsed.Value
                    : parsed;
            } catch (e) {
                return value;
            }
        },

        getDefaultExpression: function (rawSampleValue) {
            if (rawSampleValue === null || rawSampleValue === undefined || rawSampleValue === "") {
                return "";
            }

            var value = this._extractSampleValue(rawSampleValue);

            if (value === null || value === undefined || value === "") {
                return "";
            }

            if (typeof value !== "object") {
                var strVal = String(value).trim();

                if (strVal === "true" || strVal === "false") {
                    return strVal;
                }

                if ((strVal.startsWith('"') && strVal.endsWith('"')) ||
                    (strVal.startsWith("'") && strVal.endsWith("'"))) {
                    return strVal;
                }

                return '"' + strVal.replace(/"/g, '\\"') + '"';
            }

            var jsonString = JSON.stringify(value).replace(/"/g, '\\"');

            if (Array.isArray(value)) {
                return 'createJSONArray("' + jsonString + '")';
            }

            return 'createJSONObject("' + jsonString + '")';
        },

        getSampleValueTemplate: function () {
            return function (dataItem) {
                var getVal = function (key) {
                    return dataItem?.get ? dataItem.get(key) : dataItem?.[key];
                };

                var rawSampleValue = getVal("sampleValue");
                var sampleValuePretty = GridUtils.formatSampleValue(rawSampleValue, true);
                var sampleValueCompact = GridUtils.formatSampleValue(rawSampleValue, false);
                var rawHelpText = getVal("sampleValueHelpText") || getVal("sampleValueDetails");
                var contentText = rawHelpText ? String(rawHelpText) : sampleValuePretty;
                var sampleValueHelpText =
                    "<div class='ul-body-m-b sample-value-tooltip-header'>" +
                    "<span>" + _.escape(nls.SampleValue) + "</span>" +
                    "<span class='eQ-icon eQ-fonts-copy sample-value-copy-icon eq-cursor-pointer ul-pad-2x-l' " +
                    "data-copy='" + _.escape(contentText) + "' " +
                    "title='" + _.escape(nls.Copy) + "'></span>" +
                    "</div>" +
                    "<pre class='sample-value-tooltip-content'>" +
                    _.escape(contentText) +
                    "</pre>";
                var selVal = getVal("name");
                var hasSelection = !!(selVal || sampleValueCompact || rawSampleValue);

                return "<div class='invokeopcua-info-cell'>" +
                    "<span class='invokeopcua-info-cell-value' " +
                    "title='" + _.escape(sampleValueCompact) + "'>" +
                    _.escape(sampleValueCompact) +
                    "</span>" +
                    (hasSelection
                        ? "<div class='grid-help-container invokeopcua-info-icon'>" +
                        "<input class='sample-value-help-tooltip' data-help='" + _.escape(sampleValueHelpText) + "'/>" +
                        "</div>"
                        : "") +
                    "</div>";
            };
        },

        parseStringField: function (val) {
            if (val === null || val === undefined) {
                return "";
            }
            if (typeof val === "object") {
                if (typeof val.value === "string") {
                    return val.value;
                }
                if (typeof val.expression === "string") {
                    return val.expression;
                }
                return "";
            }
            return String(val);
        },

        getOutputValueTemplate: function (dataItem) {
            var getVal = function (key) {
                return dataItem?.get ? dataItem.get(key) : dataItem?.[key];
            };
            var outputValue = getVal("outputValue") || "";
            var isEmpty = !outputValue;

            return "<div class='invokeopcua-editable-cell " + (isEmpty ? "is-empty" : "") + "'>" +
                "<span class='invokeopcua-editable-cell-value' " +
                "title='" + _.escape(outputValue) + "'>" +
                _.escape(outputValue) +
                "</span>" +
                "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer invokeopcua-editable-cell-icon output-value-edit-icon'></span>" +
                "</div>";
        },

        getInputParametersTemplate: function (globalSelfOrDataItem) {
            var dataItem = globalSelfOrDataItem?.model ? null : (globalSelfOrDataItem || {});
            return function (item) {
                var targetItem = dataItem || item || {};
                var methodName = ((targetItem?.get ? targetItem.get("name") : targetItem?.name) || "").trim();
                var nodeId = ((targetItem?.get ? targetItem.get("nodeId") : targetItem?.nodeId) || "").trim();
                var hasMethodNode = !!(methodName || nodeId);

                var params = targetItem?.get ? targetItem.get("inputParameters") : targetItem?.inputParameters;
                var parameters = [];
                if (params) {
                    if (typeof params.toJSON === "function") {
                        parameters = params.toJSON();
                    } else if (params.length !== undefined) {
                        parameters = Array.prototype.slice.call(params);
                    }
                }
                parameters = parameters.map(function (p) {
                    return (p && typeof p.toJSON === "function") ? p.toJSON() : p;
                });
                var count = parameters?.length || 0;
                var firstParam = parameters?.[0] || {};
                var firstName = firstParam.name ||
                    firstParam.parameterName ||
                    firstParam.displayName ||
                    "";
                var firstValue = firstParam.value || "";
                var displayValue = firstValue || firstName;
                var tooltipText = firstName && firstValue
                    ? firstName + ": " + firstValue
                    : displayValue;

                var disabledAttr = hasMethodNode ? "" : " disabled='disabled'";
                var disabledClass = hasMethodNode ? "" : " disabled is-disabled";
                var buttonTitle = hasMethodNode
                    ? (nls.ViewInputParameters || "View Input Parameters")
                    : (nls.SelectMethodNodeFirst || "Please select a method node first");

                return "<div class='input-parameters-cell'>" +
                    "<span class='input-parameter-value' title='" +
                    _.escape(tooltipText) + "'>" +
                    _.escape(displayValue) +
                    "</span>" +
                    "<button type='button' " +
                    "class='input-parameter-badge" + disabledClass + "' " +
                    disabledAttr +
                    " title='" + _.escape(buttonTitle) + "'>" +
                    count +
                    "</button>" +
                    "</div>";
            };
        }
    };

    return GridUtils;
});
