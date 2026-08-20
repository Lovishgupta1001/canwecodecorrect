/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        renderGridExpressionEditor: function (container, options, globalSelf, field) {

            var editor = $('<div class="expression-editor" data-bind="value:' + field + '"></div>');
            editor.appendTo(container);

            var configData = {
                processModel: globalSelf.processModel,
                activityID: globalSelf.activityId,
                tabName: "CONFIGURATION"
            };

            var value = "";
            var rawVal = options.model
                ? (options.model.get ? options.model.get(field) : options.model[field])
                : "";

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
            };

            expressionBuilder = ExpressionBuilderUtility.render(
                editor,
                ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData,
                value,
                changeHandler
            );

            container.data("expressionBuilder", expressionBuilder);
        },

        newValueEditor: function (container, options, globalSelf) {
            this.renderGridExpressionEditor(container, options, globalSelf, "newValue");
        },

        parameterValueEditor: function (container, options, globalSelf) {
            this.renderGridExpressionEditor(container, options, globalSelf, "value");
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
