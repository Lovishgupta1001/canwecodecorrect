/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        getTemplate: function (field) {
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
                    "<span class='writetoopcua-editable-cell-value' title='" + value + "'>" +
                    value +
                    "</span>" +
                    "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer writetoopcua-editable-cell-icon'></span>" +
                    "</div>";
            };
        },

        getEditor: function (field, globalSelf) {
            return function (container, options) {
                var editor = $('<div class="expression-editor" data-bind="value:' + field + '"></div>');
                editor.appendTo(container);

                var configData = {
                    processModel: globalSelf.processModel,
                    activityID: globalSelf.activityId,
                    tabName: "CONFIGURATION"
                };

                var value = "";
                var rawVal = options.model.get ? options.model.get(field) : options.model[field];
                if (rawVal) {
                    if (typeof rawVal === "string") {
                        value = rawVal;
                    } else if (typeof rawVal === "object") {
                        value = rawVal.value || rawVal.expression || "";
                    }
                }

                var expressionBuilder;

                var changeHandler = function () {
                    var expression = ExpressionBuilderUtility.getExpression(expressionBuilder);
                    if (expression !== undefined && expression !== null) {
                        options.model.set(field, expression);
                    }

                    var gridWidget = (globalSelf.inputParametersModalGrid?.widget)
                        || (globalSelf._getGridInstance ? globalSelf._getGridInstance() : null);

                    if (gridWidget?.closeCell) {
                        gridWidget.closeCell();
                    }
                };

                expressionBuilder = ExpressionBuilderUtility.render(
                    editor,
                    ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                    configData,
                    value,
                    changeHandler
                );

                container.data("expressionBuilder", expressionBuilder);
            };
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
