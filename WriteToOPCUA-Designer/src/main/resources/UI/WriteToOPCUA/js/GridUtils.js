/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        nls = require("i18n!../nls/WriteToOPCUAComponentNLS");

    var GridUtils = {

        getOperationGridToolbar: function (searchClass, nls) {
            var addBtnClass = searchClass.indexOf("data-change") !== -1
                ? "data-change-write-add-btn"
                : "call-method-add-btn";

            return [
                {
                    template: function () {
                        return "<div class='writetoopcua-grid-toolbar'>" +
                            "<div class='writetoopcua-grid-search'>" +
                            "<input type='text' class='" + searchClass + "'/>" +
                            "</div>" +
                            "<div class='writetoopcua-grid-actions'>" +
                            "<button type='button' class='" + addBtnClass + "' title='" + nls.Add + "'>" +
                            "<span class='eQ-icon eQ-fonts-addRow'></span>" +
                            "</button>" +
                            "<button type='button' class='writetoopcua-grid-delete-btn' title='" + nls.Delete + "'>" +
                            "<span class='eQ-icon eQ-fonts-removeRow'></span>" +
                            "</button>" +
                            "</div>" +
                            "</div>";
                    }
                }
            ];
        },

        getDeleteActionTemplate: function (nls) {
            return "<span class='eQ-icon eQ-fonts-delete eq-cursor-pointer writetoopcua-delete-row' " +
                "title='" + (nls ? nls.Delete : "Delete") + "'></span>";
        },

        renderGridSearchBar: function (searchClass, grid, field, view, nls) {
            var globalSelf = view;
            var searchElement = globalSelf.$("." + searchClass);

            if (!searchElement.length || !grid?.widget?.dataSource) {
                return null;
            }

            var ds = grid.widget.dataSource;

            searchElement.off("keyup.gridSearch input.gridSearch").on("keyup.gridSearch input.gridSearch", function () {
                var val = $(this).val();
                if (!val || val.trim() === "") {
                    ds.filter([]);
                } else {
                    var query = val.trim();
                    ds.filter({
                        logic: "or",
                        filters: [
                            { field: field, operator: "contains", value: query },
                            { field: "nodeId", operator: "contains", value: query }
                        ]
                    });
                }
            });

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: ds,
                filter: {
                    logic: "or",
                    filters: [
                        { field: field, operator: "contains" },
                        { field: "nodeId", operator: "contains" }
                    ]
                },
                placeholder: nls.Search,
                filterAfter: 1
            });
        },

        _formatNodeDetailsHelpText: function (dataItem, rawHelpText, nodeId) {
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

            var html = "<div class='ul-header-xxxs-b ul-pad-1x'>" + nls.NodeDetails + "</div>";
            var isMethod = !!(dataItem.methodName || dataItem.objectNodeId);
            var name = dataItem.name || dataItem.dataChangeName || dataItem.methodName || "";

            var addRow = function (label, value) {
                if (value) {
                    html += "<div>" +
                        "<span class='ul-body-s-b ul-pad-1x-r writetoopcua-label'>" +
                        label + ":" +
                        "</span>" +
                        "<span>" + _.escape(value) + "</span>" +
                        "</div>";
                }
            };

            if (isMethod) {
                addRow(nls.MethodName, name);
                addRow(nls.NodeId, nodeId);
                addRow(nls.ObjectNodeId, dataItem.objectNodeId);
            } else {
                addRow(nls.NodeName, name);
                addRow(nls.NodeId, nodeId);
                addRow(nls.DataTypeName, dataItem.dataTypeName);
                addRow(nls.DataTypeNodeId, dataItem.dataTypeNodeId);
            }
            return html;
        },

        initializeGridHelpTooltips: function (container) {
            if (typeof uilayer !== "undefined" && uilayer.help) {
                container.find(".node-id-help-icon, .sample-value-help-icon, .node-id-help-tooltip, .sample-value-help-tooltip, .grid-help-container").each(function () {
                    var elem = $(this);
                    if (!elem.data("help-initialized")) {
                        elem.data("help-initialized", true);
                        uilayer.help({
                            elem: elem,
                            position: "top",
                            width: "12rem"
                        });
                    }
                });
            }

            $(document)
                .off("click.sampleValueCopy")
                .on("click.sampleValueCopy", ".sample-value-copy-icon", this._handleSampleValueCopy);
        },

        _handleSampleValueCopy: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $copyBtn = $(this);
            var text = $("<textarea/>").html($copyBtn.attr("data-copy")).text();

            if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
            }

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

        getNodeIdTemplate: function (selectionField) {
            return function (dataItem) {
                var nodeId = (dataItem.get ? dataItem.get("nodeId") : dataItem.nodeId) || "";
                var rawHelpText = dataItem.nodeIdHelpText || dataItem.nodeIdDetails || dataItem.nodeDetails;
                var nodeIdHelpText = GridUtils._formatNodeDetailsHelpText(dataItem, rawHelpText, nodeId);
                var selVal = dataItem.get ? dataItem.get(selectionField) : dataItem[selectionField];
                var hasSelection = !!selVal;

                return "<div class='writetoopcua-info-cell'>" +
                    "<span class='writetoopcua-info-cell-value' " +
                    "title='" + _.escape(nodeId) + "'>" +
                    _.escape(nodeId) +
                    "</span>" +
                    (hasSelection
                        ? "<span class='eQ-icon eQ-fonts-info writetoopcua-info-icon node-id-help-icon' " +
                        "title='" + _.escape(nodeIdHelpText) + "' " +
                        "data-help='" + _.escape(nodeIdHelpText) + "'></span>"
                        : "") +
                    "</div>";
            };
        },

        formatSampleValue: function (rawSampleValue) {
            if (rawSampleValue === null || rawSampleValue === undefined || rawSampleValue === "") {
                return "";
            }

            var valueToFormat = this._extractSampleValue(rawSampleValue);

            if (typeof valueToFormat !== "object" || valueToFormat === null) {
                return String(valueToFormat);
            }

            return JSON.stringify(valueToFormat, null, 2);
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

            var parsed = JSON.parse(trimmed);
            return parsed && typeof parsed === "object" && parsed.hasOwnProperty("Value")
                ? parsed.Value
                : parsed;
        },

        getSampleValueTemplate: function () {
            return function (dataItem) {
                var rawSampleValue = dataItem.get ? dataItem.get("sampleValue") : dataItem.sampleValue;
                var sampleValue = GridUtils.formatSampleValue(rawSampleValue);
                var rawHelpText = dataItem.sampleValueHelpText || dataItem.sampleValueDetails;
                var contentText = rawHelpText ? String(rawHelpText) : sampleValue;
                var sampleValueHelpText =
                    "<div class='ul-body-m-b sample-value-tooltip-header'>" +
                    "<span>" + _.escape(nls.SampleValue) + "</span>" +
                    "<span class='eQ-icon eQ-fonts-copy sample-value-copy-icon eq-cursor-pointer' " +
                    "data-copy='" + _.escape(contentText) + "' " +
                    "title='" + _.escape(nls.Copy) + "'></span>" +
                    "</div>" +
                    "<pre class='sample-value-tooltip-content'>" +
                    _.escape(contentText) +
                    "</pre>";
                var selVal = dataItem.get ? dataItem.get("dataChangeName") : dataItem.dataChangeName;
                var hasSelection = !!selVal;

                return "<div class='writetoopcua-info-cell'>" +
                    "<span class='writetoopcua-info-cell-value sample-value-text' " +
                    "title='" + _.escape(sampleValue) + "'>" +
                    _.escape(sampleValue) +
                    "</span>" +
                    (hasSelection
                        ? "<span class='eQ-icon eQ-fonts-info writetoopcua-info-icon sample-value-help-icon' " +
                        "title='" + _.escape(sampleValueHelpText) + "' " +
                        "data-help='" + _.escape(sampleValueHelpText) + "'></span>"
                        : "") +
                    "</div>";
            };
        },

        parseStringField: function (val) {
            if (val === null || val === undefined) {
                return "";
            }
            if (typeof val === "object") {
                if (val.value) {
                    return val.value;
                }
                if (val.expression) {
                    return val.expression;
                }
                return "";
            }
            return String(val);
        },

        getOutputValueTemplate: function (dataItem) {
            var outputValue = (dataItem.get ? dataItem.get("outputValue") : dataItem.outputValue) || "";
            var isEmpty = !outputValue;

            return "<div class='writetoopcua-editable-cell " + (isEmpty ? "is-empty" : "") + "'>" +
                "<span class='writetoopcua-editable-cell-value' " +
                "title='" + _.escape(outputValue) + "'>" +
                _.escape(outputValue) +
                "</span>" +
                "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer " +
                "writetoopcua-editable-cell-icon output-value-edit-icon'></span>" +
                "</div>";
        },

        getInputParametersTemplate: function (viewOrDataItem) {
            var dataItem = viewOrDataItem?.model ? null : (viewOrDataItem || {});

            return function (item) {
                var targetItem = (dataItem && dataItem.inputParameters) ? dataItem : (item || {});
                var params = targetItem.inputParameters;
                var parameters = [];

                if (params) {
                    if (params.toJSON) {
                        parameters = params.toJSON();
                    } else if (params.length !== undefined) {
                        parameters = params;
                    }
                }

                var count = parameters.length || 0;
                var firstParam = parameters[0] || {};
                var displayValue = firstParam.name ||
                    firstParam.parameterName ||
                    firstParam.displayName ||
                    "";

                return "<div class='input-parameters-cell'>" +
                    "<span class='input-parameter-value' title='" +
                    _.escape(displayValue) + "'>" +
                    _.escape(displayValue) +
                    "</span>" +
                    (count > 0
                        ? "<button type='button' " +
                        "class='input-parameter-badge' " +
                        "title='" + _.escape(nls.ViewInputParameters) + "'>" +
                        count +
                        "</button>"
                        : "") +
                    "</div>";
            };
        },

        getEditableValueTemplate: function (field, iconClass) {
            return function (dataItem) {
                var rawVal = dataItem.get ? dataItem.get(field) : dataItem[field];
                var value = "";
                if (typeof rawVal === "string") {
                    value = rawVal;
                } else if (rawVal && typeof rawVal === "object") {
                    value = rawVal.value || rawVal.expression || "";
                }
                var isEmpty = !value;

                return "<div class='writetoopcua-editable-cell " + (isEmpty ? "is-empty" : "") + "'>" +
                    "<span class='writetoopcua-editable-cell-value' " +
                    "title='" + _.escape(value) + "'>" +
                    _.escape(value) +
                    "</span>" +
                    "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer " +
                    "writetoopcua-editable-cell-icon " +
                    iconClass + "'></span>" +
                    "</div>";
            };
        }
    };

    return GridUtils;
});
