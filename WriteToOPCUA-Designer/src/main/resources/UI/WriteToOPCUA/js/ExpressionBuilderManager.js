/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        renderGridExpressionEditor: function (container, options, view, field) {
            var globalSelf = view;
            var editorElement = $("<div class='grid-expression-editor'></div>");
            editorElement.appendTo(container);

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

                    if (!expression || /^[a-zA-Z][a-zA-Z0-9+\-.]*:$/.test(expression)) {
                        if (event?.sender?.widget?.close) {
                            event.sender.widget.close();
                        }
                        return;
                    }

                    options.model.set(field, expression);

                    if (event?.sender?.widget?.close) {
                        event.sender.widget.close();
                    }
                }
            }, container, options);
        },

        newValueEditor: function (container, options, view) {
            this.renderGridExpressionEditor(container, options, view, "newValue");
        },

        parameterValueEditor: function (container, options, view) {
            this.renderGridExpressionEditor(container, options, view, "value");
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
