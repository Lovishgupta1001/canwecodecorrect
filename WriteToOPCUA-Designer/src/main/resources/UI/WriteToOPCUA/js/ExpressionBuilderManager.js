/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        renderGridExpressionEditor: function (container, options, view, field) {
            var editorElement = $("<div class='grid-expression-editor'></div>");
            editorElement.appendTo(container);

            var configData = {
                processModel: view.processModel,
                activityID: view.activityId,
                tabName: "CONFIGURATION"
            };

            ExpressionBuilderUtility.getExpressionBuilderEditor({
                launcherType: ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData: configData,
                changeHandler: function (event) {
                    var expression = ExpressionBuilderUtility.getExpression(event);

                    // Do not write back if the expression is empty or just a
                    // bare protocol prefix produced by clicking outside without
                    // making a selection (e.g. "eQParser:").
                    if (!expression || /^[a-zA-Z][a-zA-Z0-9+\-.]*:$/.test(expression)) {
                        if (event.sender && event.sender.widget) {
                            event.sender.widget.close();
                        }
                        return;
                    }

                    options.model.set(field, expression);
                    options.model.set("nodeId", "");

                    if (field === "dataChangeName") {
                        options.model.set("sampleValue", "");
                    }

                    if (event.sender && event.sender.widget) {
                        event.sender.widget.close();
                    }
                }
            }, container, options);
        },

        dataChangeNameEditor: function (container, options, view) {
            this.renderGridExpressionEditor(container, options, view, "dataChangeName");
        },

        methodNameEditor: function (container, options, view) {
            this.renderGridExpressionEditor(container, options, view, "methodName");
        },

        inputParametersEditor: function (container, options, view) {
            this.renderGridExpressionEditor(container, options, view, "inputParameters");
        },

        renderTransportExpressionBuilder: function (view) {
            if (view.transportExpressionBuilder) {
                ExpressionBuilderUtility.destroy(view.transportExpressionBuilder);
            }

            var configData = {
                processModel: view.processModel,
                activityID: view.activityId,
                tabName: "CONFIGURATION"
            };

            view.transportExpressionBuilder = ExpressionBuilderUtility.render(
                view.$el.find("#transport-name-expression-region"),
                ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData,
                view.model.getKey("transportName"),
                this.onTransportExpressionChanged.bind(this, view)
            );
        },

        onTransportExpressionChanged: function (view, e) {
            var expression = ExpressionBuilderUtility.getExpression(e);

            view.model.setKey("transportName", expression || "");

            if (e.sender && e.sender.widget) {
                e.sender.widget.close();
            }
        },

        newValueEditor: function (container, options, view) {
            var editorElement = $("<div class='new-value-expression-editor'></div>");
            editorElement.appendTo(container);

            var configData = {
                processModel: view.processModel,
                activityID: view.activityId,
                tabName: "CONFIGURATION"
            };

            ExpressionBuilderUtility.getExpressionBuilderEditor({
                launcherType: ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData: configData,
                changeHandler: function (event) {
                    var expression = ExpressionBuilderUtility.getExpression(event);

                    if (!expression || /^[a-zA-Z][a-zA-Z0-9+\-.]*:$/.test(expression)) {
                        if (event.sender && event.sender.widget) {
                            event.sender.widget.close();
                        }
                        return;
                    }

                    options.model.set("newValue", expression);

                    if (event.sender && event.sender.widget) {
                        event.sender.widget.close();
                    }
                }
            }, container, options);
        },

        parameterValueEditor: function (container, options, view) {
            var editorElement = $("<div class='parameter-value-expression-editor'></div>");
            editorElement.appendTo(container);

            var configData = {
                processModel: view.processModel,
                activityID: view.activityId,
                tabName: "CONFIGURATION"
            };

            ExpressionBuilderUtility.getExpressionBuilderEditor({
                launcherType: ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData: configData,
                changeHandler: function (event) {
                    var expression = ExpressionBuilderUtility.getExpression(event);

                    if (!expression || /^[a-zA-Z][a-zA-Z0-9+\-.]*:$/.test(expression)) {
                        if (event.sender && event.sender.widget) {
                            event.sender.widget.close();
                        }
                        return;
                    }

                    options.model.set("value", expression);

                    if (event.sender && event.sender.widget) {
                        event.sender.widget.close();
                    }
                }
            }, container, options);
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
