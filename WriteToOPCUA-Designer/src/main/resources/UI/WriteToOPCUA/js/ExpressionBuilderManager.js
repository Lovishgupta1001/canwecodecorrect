/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        _openFloatingExpressionBuilder: function (anchorCell, options, globalSelf, field) {
            var existing = globalSelf.$el.find(".writetoopcua-floating-eb-container");
            if (existing.length) {
                ExpressionBuilderUtility.destroy(existing.data("expressionBuilder"));
                existing.remove();
            }

            var configData = {
                processModel: globalSelf.processModel,
                activityID: globalSelf.activityId,
                tabName: "CONFIGURATION"
            };

            var rawVal = options.model.get ? options.model.get(field) : options.model[field];
            var value = "";
            if (typeof rawVal === "string") {
                value = rawVal;
            } else if (rawVal && typeof rawVal === "object") {
                value = rawVal.value || rawVal.expression || "";
            }

            var $container = $("<div class='writetoopcua-floating-eb-container'>" +
                "<div class='expression-editor' data-bind='value:" + field + "'></div>" +
                "</div>");

            globalSelf.$el.append($container);

            var editorDiv = $container.find(".expression-editor");

            var expressionBuilder;
            var changeHandler = function () {
                var expression = ExpressionBuilderUtility.getExpression(expressionBuilder);
                if (expression !== undefined && expression !== null) {
                    options.model.set(field, expression);
                    var display = expression;
                    anchorCell.find(".writetoopcua-editable-cell-value").text(display).attr("title", display);
                    anchorCell.find(".writetoopcua-editable-cell").toggleClass("is-empty", !display);
                }
            };

            expressionBuilder = ExpressionBuilderUtility.render(
                editorDiv,
                ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData,
                value,
                changeHandler
            );

            $container.data("expressionBuilder", expressionBuilder);
        },

        onEditIconClick: function (e, globalSelf, field, gridWidget) {
            e.stopPropagation();
            var icon = $(e.currentTarget);
            var cell = icon.closest("td");
            var row = cell.closest("tr");
            if (!gridWidget) {
                return;
            }
            var dataItem = gridWidget.dataItem(row);
            if (!dataItem) {
                return;
            }
            this._openFloatingExpressionBuilder(cell, { model: dataItem }, globalSelf, field);
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
