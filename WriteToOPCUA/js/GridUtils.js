/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var uilayer = require("uilayer"),
        _ = require("underscore");

    var GridUtils = {

        getOperationGridToolbar: function (searchClass, nls) {
            return [
                {
                    template:
                        "<div class='writetoopcua-grid-toolbar' style='display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box;'>" +
                        "<div class='writetoopcua-grid-search' style='flex: 1; max-width: 250px;'>" +
                        "<input type='text' class='" + searchClass + "' style='width: 100%;'/>" +
                        "</div>" +
                        "<div class='writetoopcua-grid-actions' style='display: flex; gap: 0.5rem; align-items: center;'>" +
                        "<button type='button' class='k-button k-button-icontext k-grid-add' title='" + (nls.Add || "Add") + "'>" +
                        "<span class='eQ-icon eQ-fonts-addRow'></span>" +
                        "</button>" +
                        "<button type='button' class='k-button k-button-icontext writetoopcua-grid-delete-btn' title='" + (nls.Delete || "Delete") + "'>" +
                        "<span class='eQ-icon eQ-fonts-removeRow'></span>" +
                        "</button>" +
                        "</div>" +
                        "</div>"
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

            return "<div class='writetoopcua-editable-cell'>" +
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

            return "<div class='writetoopcua-editable-cell'>" +
                "<span class='writetoopcua-editable-cell-value' " +
                "title='" + _.escape(outputValue) + "'>" +
                _.escape(outputValue) +
                "</span>" +
                "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer " +
                "writetoopcua-editable-cell-icon output-value-edit-icon'></span>" +
                "</div>";
        },

        getInputParametersTemplate: function (dataItem) {
            var parameters = dataItem.inputParameters || [];
            var count = parameters.length;
            var displayValue = "";

            if (count > 0) {
                displayValue = parameters[0].name ||
                    parameters[0].parameterName ||
                    parameters[0].displayName ||
                    "";
            }

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
                var value = dataItem[field] || "";

                return "<div class='writetoopcua-editable-cell'>" +
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
