({
  paths: {
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
    //all common MI widget ignore
    "Widgets/common/utilities/utilities": "empty:",
    "Components/Activities/ActivitiesUtility/ActivitiesUtility": "empty:",
    //Though these named modules are contained in uilayer.js, to compile template these files are required
    "underscore": "Lib/UILayer/underscore",
    "text": "Lib/UILayer/text",
    "tpl": "Lib/UILayer/tpl",
    "i18n": "Lib/UILayer/i18n",
    "json": "Lib/UILayer/json",
    "Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent": "Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent"
  },
  appDir: "./",
  useStrict: true,
  optimize: "uglify",
  removeCombined: true,
  writeBuildTxt: false,
  baseUrl: "./../../..",
  findNestedDependencies: true,
  fileExclusionRegExp: /collection|^js$|behavior|constants|controller|model|template|view|.less$|build.js/,
  dir: "./../../../_Components/Activities/DeviceConnectorConnComponent",
  modules: [{
    name: "Components/Activities/DeviceConnectorConnComponent/DeviceConnectorConnComponent",
    exclude: ["text", "tpl", "uilayer", "i18n"]
  }]
});
