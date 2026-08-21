/**
 * Created by Lovish.
 */
define(function (require) {
    "use strict";

    var CVTComponent = require("Components/CVTComponent/CVTComponent"),
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility");

    var ExpressionBuilderManager = {

        getTemplate: function (field, globalSelf) {
            return function (dataItem) {
                if (globalSelf?.getExpressionBuilderTemplate) {
                    return globalSelf.getExpressionBuilderTemplate(field, dataItem);
                }
                return CVTComponent.prototype.getExpressionBuilderTemplate.call(globalSelf, field, dataItem);
            };
        },

        getEditor: function (field, globalSelf, changeHandler) {
            return function (container, options) {
                var config = {
                    configData: {
                        tabName: "CONFIGURATION"
                    },
                    changeHandler: changeHandler || function () {}
                };
                if (globalSelf?.getExpressionBuilderEditor) {
                    return globalSelf.getExpressionBuilderEditor(config, container, options);
                }
                return CVTComponent.prototype.getExpressionBuilderEditor.call(globalSelf, config, container, options);
            };
        },

        destroy: function (expressionBuilder) {
            expressionBuilder?.destroy?.();
        }
    };

    return ExpressionBuilderManager;
});

