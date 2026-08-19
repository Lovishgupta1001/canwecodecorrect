/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        renderGridExpressionEditor: function (container, options, globalSelf, field) {
            $('<div class="expression-editor" data-bind="value:' + field + '"></div>').appendTo(container);
            var element = container.find(".expression-editor");

            var configData = {
                processModel: globalSelf.processModel,
                activityID: globalSelf.activityId,
                tabName: "CONFIGURATION"
            };

            var value = "";
            var rawVal = options.model ? (options.model.get ? options.model.get(field) : options.model[field]) : "";

            if (rawVal) {
                if (typeof rawVal === "string") {
                    value = rawVal;
                } else if (typeof rawVal === "object") {
                    value = rawVal.value || rawVal.expression || "";
                }
            }

            var changeHandler = function (event) {
                var expression = ExpressionBuilderUtility.getExpression(event);
                if (expression !== undefined && expression !== null) {
                    options.model.set(field, expression);
                }
            };

            ExpressionBuilderUtility.render(element, ExpressionBuilderLauncherTypes.PROCESS_CONTEXT, configData, value, changeHandler);
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
