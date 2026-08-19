/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        renderGridExpressionEditor: function (container, options, globalSelf, field) {
            container.off("click.prevent-close mousedown.prevent-close").on("click.prevent-close mousedown.prevent-close", function (e) {
                e.stopPropagation();
            });

            var editorElement = $("<div class='grid-expression-editor'></div>");
            editorElement.appendTo(container);

            editorElement.off("click.prevent-close mousedown.prevent-close").on("click.prevent-close mousedown.prevent-close", function (e) {
                e.stopPropagation();
            });

            var configData = {
                processModel: globalSelf.processModel,
                activityID: globalSelf.activityId,
                tabName: "CONFIGURATION"
            };

            ExpressionBuilderUtility.getExpressionBuilderEditor({
                launcherType: ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData: configData,
                changeHandler: function (event) {
                    var expression = ExpressionBuilderUtility.getExpression(event);
                    if (expression !== undefined && expression !== null) {
                        options.model.set(field, expression);
                    }
                }
            }, container, options);
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
