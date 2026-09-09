({
    paths: {
        //give empty paths to all named modules which are already built or external dependencies
        //named modules in uilayer
        "backbone": "empty:",
        "backbone.relational": "empty:",
        "marionette": "empty:",
        "jquery": "empty:",
        "dotdotdot": "empty:",
        "jquery.slimscroll": "empty:",

        //Named modules in widget-framework.js
        "WidgetModel": "empty:",
        "WidgetView": "empty:",
        "WidgetController": "empty:",
        "ContainerWidgetModel": "empty:",
        "ContextController": "empty:",
        "ContainerWidgetController": "empty:",
        "SettingView": "empty:",
        "SettingController": "empty:",
        "WidgetFactory": "empty:",
        "Behavior": "empty:",
        "FloatingEditorView": "empty:",
        "FloatingEditorController": "empty:",
        "Queue": "empty:",
        "ThemeUtil": "empty:",
        "ThemeService": "empty:",

        //paths to uilayer libs
        "uilayer": "empty:",
        "widgets": "empty:",
        "event-bus": "empty:",
        "Application/Application": "empty:",
        "ModelStore": "empty:",

        //all common MI widget ignore
        "Widgets/common/utilities/utilities": "empty:",
        "Widgets/Designer/ProcessModel/ProcessModel": "empty:",
        "Components/ExpressionBuilderUtility/ExpressionBuilderUtility": "empty:",
        "Components/Activities/ActivitiesUtility/ActivitiesUtility": "empty:",
        "Widgets/Designer/ExpressionBuilder/constants/ExpressionBuilderLauncherTypes": "empty:",
        "Widgets/Designer/ExpressionBuilder/ExpressionBuilder": "empty:",

        //Though these named modules are contained in uilayer.js, to compile template these files are required
        "underscore": "Lib/UILayer/underscore",
        "text": "Lib/UILayer/text",
        "tpl": "Lib/UILayer/tpl",
        "i18n": "Lib/UILayer/i18n",
        "json": "Lib/UILayer/json",
        "Activities/InvokeOPCUA/UI/InvokeOPCUA/InvokeOPCUAComponent": "Activities/InvokeOPCUA/UI/InvokeOPCUA/InvokeOPCUAComponent"
    },
    appDir: "./",
    useStrict: true,
    //it can take none, uglify,
    optimize: "none",
    //do not change removeCombined
    removeCombined: true,
    //Dont create build.txt
    writeBuildTxt: false,
    //do not change baseUrl
    baseUrl: "./../../../..",
    //do not change findNestedDependencies
    findNestedDependencies: true,
    fileExclusionRegExp: /collection|^js$|behavior|constants|controller|template|view|.less$|build.js/,
    //instead of Logs use your widget name ( this should be same as widget parent directory name )
    dir: "./../../../../_Activities/InvokeOPCUA/UI/InvokeOPCUA",
    modules: [
        {
            //instead of Logs use WiodgetNameEdit ( this should be same as WidgetNameEdit.js file omitting the .js extension
            name: "Activities/InvokeOPCUA/UI/InvokeOPCUA/InvokeOPCUAComponent",
            //specify the dependencies that are not supposed to be there in widget edit build
            exclude: [
                "text",
                "tpl",
                "uilayer",
                "i18n"
            ]
        }
    ]
})
