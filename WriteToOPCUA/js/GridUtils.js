/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore");

    var GridUtils = {

        getOperationGridToolbar: function (searchClass, nls) {
            var addTitle = (nls && nls.Add) ? nls.Add : "Add";
            var deleteTitle = (nls && nls.Delete) ? nls.Delete : "Delete";

            return [
                {
                    template: function () {
                        return "<div class='writetoopcua-grid-toolbar'>" +
                            "<div class='writetoopcua-grid-search'>" +
                            "<input type='text' class='" + searchClass + "'/>" +
                            "</div>" +
                            "<div class='writetoopcua-grid-actions'>" +
                            "<button type='button' class='k-button k-button-icontext k-grid-add' title='" + addTitle + "'>" +
                            "<span class='eQ-icon eQ-fonts-addRow'></span>" +
                            "</button>" +
                            "<button type='button' class='k-button k-button-icontext k-grid-delete writetoopcua-grid-delete-btn' title='" + deleteTitle + "'>" +
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
                "title='" + nls.Delete + "'></span>";
        },

        renderGridSearchBar: function (searchClass, grid, field, view, nls) {
            var searchElement = view.$("." + searchClass);

            if (!searchElement.length || !grid || !grid.widget || !grid.widget.dataSource) {
                return null;
            }

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: grid.widget.dataSource,
                filter: {
                    field: field,
                    operator: "contains"
                },
                placeholder: nls.Search,
                filterAfter: 3
            });
        },

        getNodeIdTemplate: function (selectionField, view) {
            return function (dataItem) {
                var isDynamicTransport = view.model.getKey("dynamicTransport");

                if (isDynamicTransport) {
                    return "";
                }

                var nodeId = dataItem.nodeId || "";
                var hasSelection = !!dataItem[selectionField];

                return "<div class='writetoopcua-info-cell'>" +
                    "<span class='writetoopcua-info-cell-value' " +
                    "title='" + _.escape(nodeId) + "'>" +
                    _.escape(nodeId) +
                    "</span>" +
                    (hasSelection
                        ? "<span class='eQ-icon eQ-fonts-getInformation " +
                          "writetoopcua-info-icon node-id-help-icon'></span>"
                        : "") +
                    "</div>";
            };
        },

        getSampleValueTemplate: function (view) {
            return function (dataItem) {
                var isDynamicTransport = view.model.getKey("dynamicTransport");

                if (isDynamicTransport) {
                    return "";
                }

                var sampleValue = dataItem.sampleValue || "";
                var hasSelection = !!dataItem.dataChangeName;

                return "<div class='writetoopcua-info-cell'>" +
                    "<span class='writetoopcua-info-cell-value' " +
                    "title='" + _.escape(sampleValue) + "'>" +
                    _.escape(sampleValue) +
                    "</span>" +
                    (hasSelection
                        ? "<span class='eQ-icon eQ-fonts-getInformation " +
                          "writetoopcua-info-icon sample-value-help-icon'></span>"
                        : "") +
                    "</div>";
            };
        },

        getNewValueTemplate: function (dataItem) {
            var value = dataItem.newValue || "";
            var isEmpty = !value;

            return "<div class='writetoopcua-editable-cell " + (isEmpty ? "is-empty" : "") + "'>" +
                "<span class='writetoopcua-editable-cell-value' " +
                "title='" + _.escape(value) + "'>" +
                _.escape(value) +
                "</span>" +
                "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer " +
                "writetoopcua-editable-cell-icon new-value-edit-icon'></span>" +
                "</div>";
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
            if (viewOrDataItem && viewOrDataItem.model) {
                var view = viewOrDataItem;
                return function (dataItem) {
                    var isDynamicTransport = view.model.getKey("dynamicTransport");

                    if (isDynamicTransport) {
                        var val = typeof dataItem.inputParameters === "string"
                            ? dataItem.inputParameters
                            : "";
                        var isEmpty = !val;

                        return "<div class='writetoopcua-editable-cell " + (isEmpty ? "is-empty" : "") + "'>" +
                            "<span class='writetoopcua-editable-cell-value' " +
                            "title='" + _.escape(val) + "'>" +
                            _.escape(val) +
                            "</span>" +
                            "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer " +
                            "writetoopcua-editable-cell-icon input-parameters-edit-icon'></span>" +
                            "</div>";
                    }

                    var params = dataItem.inputParameters;
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
            }

            var dataItem = viewOrDataItem || {};
            var params = dataItem.inputParameters;
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
        },

        getEditableValueTemplate: function (field, iconClass) {
            return function (dataItem) {
                var rawVal = dataItem.get ? dataItem.get(field) : dataItem[field];
                var value = rawVal || "";
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
