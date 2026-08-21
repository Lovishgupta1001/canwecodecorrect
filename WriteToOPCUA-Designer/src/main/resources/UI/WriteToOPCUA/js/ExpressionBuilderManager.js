/**
 * Created by Lovish.
 * Delegates to CVTComponent methods (mixed-in on globalSelf in WriteToOPCUAComponent.onInitialize)
 * for correct edit-icon rendering and EB back/close behavior — same pattern as AddTab.js.
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility");

    var ExpressionBuilderManager = {

        /**
         * Returns the column template function.
         * Delegates to globalSelf.getExpressionBuilderTemplate (CVTComponent method)
         * which renders the cell with the correct edit icon and handles hover/visibility.
         */
        getTemplate: function (field, globalSelf) {
            // CVTComponent.prototype.getExpressionBuilderTemplate is bound onto globalSelf in onInitialize
            return globalSelf.getExpressionBuilderTemplate(field);
        },

        /**
         * Returns the column editor function.
         * Delegates to globalSelf.getExpressionBuilderEditor (CVTComponent method)
         * which handles: EB open, back/close (restores cell view), changeHandler.
         */
        getEditor: function (field, globalSelf) {
            // CVTComponent.prototype.getExpressionBuilderEditor is bound onto globalSelf in onInitialize
            return globalSelf.getExpressionBuilderEditor({
                configData: {
                    tabName: "CONFIGURATION"
                },
                field: field,
                changeHandler: function (expressionBuilder) {
                    // no-op: CVTComponent changeHandler updates the model internally
                }
            });
        },

        /**
         * Extracts the plain string expression from an EB object or string value.
         */
        getExpression: function (value, globalSelf) {
            if (!value) return "";
            return ExpressionBuilderUtility.getExpression(value) || "";
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder) {
                ExpressionBuilderUtility.destroy(expressionBuilder);
            }
        }
    };

    return ExpressionBuilderManager;
});
