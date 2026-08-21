/**
 * Created by Lovish.
 * Delegates to CVTComponent methods (mixed-in on globalSelf in WriteToOPCUAComponent.onInitialize).
 * Pattern exactly matches AddTab.js:
 *   template: this.getExpressionBuilderTemplate.bind(this, "expression")
 *   editor:   this.getExpressionBuilderEditor.bind(this, { launcherType, configData, changeHandler })
 */
define(function (require) {
    "use strict";

    var ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var ExpressionBuilderManager = {

        /**
         * Returns a bound template function — same as AddTab.js:
         *   this.getExpressionBuilderTemplate.bind(this, "expression")
         * Grid calls it as: template(dataItem) → getExpressionBuilderTemplate(field, dataItem)
         */
        getTemplate: function (field, globalSelf) {
            return globalSelf.getExpressionBuilderTemplate.bind(globalSelf, field);
        },

        /**
         * Returns a bound editor function — same as AddTab.js:
         *   this.getExpressionBuilderEditor.bind(this, { configData, changeHandler })
         * Grid calls it as: editor(container, options) → getExpressionBuilderEditor({...}, container, options)
         */
        getEditor: function (field, globalSelf) {
            return globalSelf.getExpressionBuilderEditor.bind(globalSelf, {
                launcherType: ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,
                configData: {
                    tabName: "CONFIGURATION"
                },
                changeHandler: null
            });
        },

        destroy: function (expressionBuilder) {
            if (expressionBuilder && expressionBuilder.destroy) {
                var elem = expressionBuilder.$el && expressionBuilder.$el.find(".ul-minified-ee-container .ul-nxt-ee-editor");
                if (elem && elem.length) {
                    elem.off(".editorHover");
                }
                expressionBuilder.destroy();
                if (expressionBuilder.$el) {
                    expressionBuilder.$el.empty();
                }
            }
        }
    };

    return ExpressionBuilderManager;
});
