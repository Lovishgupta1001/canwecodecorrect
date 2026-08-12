/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        renderExpressionBuilder: function (element, launcherType, configData, selectedValue, changeHandler) {
            return ExpressionBuilderUtility.render(
                element,
                launcherType,
                configData,
                selectedValue,
                changeHandler
            );
        },

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

                    options.model.set(field, expression || "");
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

                    options.model.set("newValue", expression || "");

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

                    options.model.set("value", expression || "");

                    if (event.sender && event.sender.widget) {
                        event.sender.widget.close();
                    }
                }
            }, container, options);
        },

        renderParameterValueExpressionBuilders: function (view, modalGrid) {
            var self = this;

            if (!modalGrid || !modalGrid.widget) {
                return;
            }

            view.parameterValueExpressionBuilders = view.parameterValueExpressionBuilders || [];

            var configData = {
                processModel: view.processModel,
                activityID: view.activityId,
                tabName: "CONFIGURATION"
            };

            view.$(".param-value-expr-region").each(function () {
                var element = $(this);

                if (element.data("param-expr-initialized")) {
                    return;
                }
                element.data("param-expr-initialized", true);

                var row = element.closest("tr");
                var dataItem = modalGrid.widget.dataItem(row);

                if (!dataItem) {
                    return;
                }

                var eb = self.renderExpressionBuilder(
                    element,
                    ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                    configData,
                    dataItem.get("value") || "",
                    function (event) {
                        var expression = ExpressionBuilderUtility.getExpression(event);
                        dataItem.set("value", expression || "");
                        if (event.sender && event.sender.widget) {
                            event.sender.widget.close();
                        }
                    }
                );

                if (eb) {
                    view.parameterValueExpressionBuilders.push(eb);
                }
            });
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
