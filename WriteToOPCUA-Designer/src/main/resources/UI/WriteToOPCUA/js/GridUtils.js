/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore"),
        nls = require("i18n!../nls/WriteToOPCUAComponentNLS");

    var GridUtils = {

        getDeleteActionTemplate: function (nls) {
            return "<span class='eQ-icon eQ-fonts-delete eq-cursor-pointer writetoopcua-delete-row' " +
                "title='" + nls.Delete + "'></span>";
        },

        renderGridSearchBar: function (searchClass, grid, field, view, nls) {
            var searchElement = view.$("." + searchClass);

            if (!searchElement.length || !grid || !grid.widget || !grid.widget.dataSource) {
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
                    try {
                        return "<div class='ul-body-m-b'>" + nls.NodeDetails + "</div>" +
                            "<pre style='margin:0;font-family:inherit;white-space:pre-wrap;'>" +
                            _.escape(JSON.stringify(rawHelpText, null, 2)) +
                            "</pre>";
                    } catch (e) {
                        return "<div class='ul-body-m-b'>" + nls.NodeDetails + "</div>" +
                            "<div>" + _.escape(String(rawHelpText)) + "</div>";
                    }
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
            if (typeof uilayer !== "undefined" && typeof uilayer.help === "function") {
                container.find(".grid-help-container").each(function () {
                    var elem = $(this);
                    if (!elem.data("help-initialized")) {
                        elem.data("help-initialized", true);
                        uilayer.help({
                            elem: elem,
                            position: "top",
                            width: "12rem",
                            height: "auto"
                        });
                    }
                });
            }
            $(document)
                .off("click.sampleValueCopy")
                .on("click.sampleValueCopy", ".sample-value-copy-icon", function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var text = $("<textarea/>").html($(this).attr("data-copy")).text();

                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(text);
                    } else {
                        var temp = $("<textarea>");
                        $("body").append(temp);
                        temp.val(text).select();
                        document.execCommand("copy");
                        temp.remove();
                    }
                });
        },

        getNodeIdTemplate: function (selectionField) {
            return function (dataItem) {
                var nodeId = dataItem.nodeId || "";
                var rawHelpText = dataItem.nodeIdHelpText || dataItem.nodeIdDetails || dataItem.nodeDetails;
                var nodeIdHelpText = GridUtils._formatNodeDetailsHelpText(dataItem, rawHelpText, nodeId);
                var hasSelection = !!dataItem[selectionField];

                return "<div class='writetoopcua-info-cell'>" +
                    "<span class='writetoopcua-info-cell-value' " +
                    "title='" + _.escape(nodeId) + "'>" +
                    _.escape(nodeId) +
                    "</span>" +
                    (hasSelection
                        ? "<div class='grid-help-container writetoopcua-info-icon'>" +
                          "<input class='node-id-help-tooltip' data-help='" + _.escape(nodeIdHelpText) + "'></input>" +
                          "</div>"
                        : "") +
                    "</div>";
            };
        },

        formatSampleValue: function (rawSampleValue) {
            if (rawSampleValue === null || rawSampleValue === undefined || rawSampleValue === "") {
                return "";
            }

            var valueToFormat = rawSampleValue;

            if (typeof rawSampleValue === "string") {
                var trimmed = rawSampleValue.trim();
                if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                    try {
                        var parsed = JSON.parse(trimmed);
                        if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("Value")) {
                            valueToFormat = parsed.Value;
                        } else {
                            valueToFormat = parsed;
                        }
                    } catch (e) {
                        valueToFormat = rawSampleValue;
                    }
                } else {
                    valueToFormat = rawSampleValue;
                }
            } else if (typeof rawSampleValue === "object" && rawSampleValue !== null) {
                if (rawSampleValue.hasOwnProperty("Value")) {
                    valueToFormat = rawSampleValue.Value;
                }
            }

            if (typeof valueToFormat === "object" && valueToFormat !== null) {
                try {
                    return JSON.stringify(valueToFormat, null, 2);
                } catch (e) {
                    return String(valueToFormat);
                }
            }

            return String(valueToFormat);
        },

        getSampleValueTemplate: function () {
            return function (dataItem) {
                var rawSampleValue = dataItem.sampleValue;
                var sampleValue = GridUtils.formatSampleValue(rawSampleValue);
                var rawHelpText = dataItem.sampleValueHelpText || dataItem.sampleValueDetails;
                var contentText = rawHelpText ? String(rawHelpText) : sampleValue;
                var sampleValueHelpText =
                    "<div class='ul-body-m-b' style='display:flex;justify-content:space-between;align-items:center;'>" +
                    "<span>Sample Value</span>" +
                    "<span class='eQ-icon eQ-fonts-copy sample-value-copy-icon eq-cursor-pointer' " +
                    "data-copy='" + _.escape(contentText) + "' " +
                    "title='Copy'></span>" +
                    "</div>" +
                    "<pre style='margin:0;font-family:inherit;white-space:pre-wrap;'>" +
                    _.escape(contentText) +
                    "</pre>";
                var hasSelection = !!dataItem.dataChangeName;

                return "<div class='writetoopcua-info-cell'>" +
                    "<span class='writetoopcua-info-cell-value' style='white-space: pre-wrap;' " +
                    "title='" + _.escape(sampleValue) + "'>" +
                    _.escape(sampleValue) +
                    "</span>" +
                    (hasSelection
                        ? "<div class='grid-help-container writetoopcua-info-icon'>" +
                          "<input class='sample-value-help-tooltip' data-help='" + _.escape(sampleValueHelpText) + "'></input>" +
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
            var outputValue = dataItem.outputValue || "";
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
            var dataItem = (viewOrDataItem && viewOrDataItem.model) ? null : (viewOrDataItem || {});

            return function (item) {
                var targetItem = dataItem || item || {};
                var params = targetItem.inputParameters;
                var parameters = [];

                if (params) {
                    if (typeof params.toJSON === "function") {
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
                          "title='View input parameters'>" +
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
