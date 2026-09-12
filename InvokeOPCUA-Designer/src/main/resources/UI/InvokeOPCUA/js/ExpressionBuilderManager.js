/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        _extractValue: function (rawVal) {
            if (typeof rawVal === "string") {
                return rawVal;
            }
            if (rawVal && typeof rawVal === "object") {
                return rawVal.value || rawVal.expression || "";
            }
            return "";
        },

        getTemplate: function (field) {
            var manager = this;
            return function (dataItem) {
                var rawVal = (dataItem && dataItem.get) ? dataItem.get(field) : (dataItem ? dataItem[field] : "");
                var value = manager._extractValue(rawVal);
                var isEmpty = !value;
                return "<div class='invokeopcua-editable-cell " + (isEmpty ? "is-empty" : "") + "'>" +
                    "<span class='invokeopcua-editable-cell-value' title='" + value + "'>" +
                    value +
                    "</span>" +
                    "<span class='eQ-icon eQ-fonts-edit eq-cursor-pointer invokeopcua-editable-cell-icon'></span>" +
                    "</div>";
            };
        },

        getEditor: function (field, globalSelf) {
            var manager = this;
            return function (container, options) {
                var editor = $('<div class="expression-editor" data-bind="value:' + field + '"></div>');
                editor.appendTo(container);

                var configData = {
                    processModel: globalSelf.processModel,
                    activityID: globalSelf.activityId,
                    tabName: "CONFIGURATION"
                };

                var rawVal = (options.model && options.model.get) ? options.model.get(field) : (options.model ? options.model[field] : "");
                var value = manager._extractValue(rawVal);

                var expressionBuilder;

                var changeHandler = function () {
                    var expression = ExpressionBuilderUtility.getExpression(expressionBuilder);
                    if (expression !== undefined && expression !== null) {
                        if (options.model && options.model.set) {
                            options.model.set(field, expression);
                        }
                    }

                    var gridWidget = (globalSelf.inputParametersModalGrid && globalSelf.inputParametersModalGrid.widget)
                        || (globalSelf._getGridInstance ? globalSelf._getGridInstance() : null);

                    if (gridWidget && gridWidget.closeCell) {
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
            if (ExpressionBuilderUtility && ExpressionBuilderUtility.destroy) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
