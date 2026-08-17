/**
 * Created by avdhut on 23-07-2024.
 */

define(function (require) {
    var uilayer = require("uilayer"),
        template = require("tpl!./template/PublishToKafkaComponentTemplate"),
        model = require("./model/PublishToKafkaComponentModel"),
        nls = require("i18n!./nls/PublishToKafkaComponentNLS"),
        constants = require("./js/constants"),
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var PublishToKafkaUIComponent = MIUIComponentI.extend({
        model: model,
        template: template,
        nls: nls,
        customEvents: constants.EVENTS_CONSTANTS,

        events: {
        },

        onInitialize: function (options) {
            this.activityId = options.activityId;
            this.designerReqres = options.reqres;
            this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore');
            this.promiseArray   = [];
            this.availableProducerProperties = [];
            this._fetchProducerProperties();
        },

        /**
         * fetches list of default producer properties to show as hint in drop down
         * @private
         */
        _fetchProducerProperties: function() {
            let globalSelf = this;
            let promise = AjaxUtility.commonAjaxSyncRequest("GET", "activities/publishToKafka/fetchProducerPropertyNames", null, "json");
            promise.done(function (producerProperties) {
                globalSelf.additionalProducerPropData = [];
                _.each(producerProperties, function(producerProperty){
                    globalSelf.additionalProducerPropData[producerProperty.configKey] = {
                        defaultValue: producerProperty.defaultValue,
                        desc: producerProperty.description.replace(/<.[a-z]*>/g,'"')
                    };
                    globalSelf.availableProducerProperties.push({
                        text: producerProperty.configKey,
                        value: producerProperty.configKey
                    });
                });
            });
        },

        onRender: function () {
            let globalSelf = this;
            let deferred = $.Deferred ();

            var promise = MIUIComponent.TransportSelectorComponent({
                el: this.$el.find("#kafkaTransport"),
                streamingAttribute: {
                    topicName: "topicsToPublish",
                    transportName: "transportName",
                    transportNameAsVar: "dynamicTransport"
                },
                activityID: this.activityId,
                tabName: "CONFIGURATION",
                labelCssClass: "kafka-label",
                valueCssClass: "kafka-value ",
                ullabelsize:"ul-label-large",
                topicType: "topicsToPublish",
                transportDataURL: "activities/publishToKafka/fetchKafkaTransportList",
                processModel: globalSelf.processModel,
                transportPassedInfo: nls["publishToKafka.transportPassedInfo"]
            });
            promise.done(function (component) {
                globalSelf.transportSelector = component;
                globalSelf.listenTo(globalSelf.transportSelector, constants.UPDATE_MODEL, globalSelf.onTransportChange.bind(globalSelf));

                globalSelf.transportSelector.populateFields({
                    topicName: (globalSelf.model.getKey(constants.TOPIC_TO_PUBLISH) && globalSelf.model.getKey(constants.TOPIC_TO_PUBLISH).length > 0) ? globalSelf.model.getKey(constants.TOPIC_TO_PUBLISH)[0] : [""],
                    transportName:  globalSelf.model.getKey(constants.TRANSPORT_NAME),
                    transportNameAsVar: globalSelf.model.getKey("dynamicTransport")
                });
            });


            globalSelf.messageKey = globalSelf._renderExpressionBuilder(constants.MESSAGE_KEY);
            globalSelf.messageValue = globalSelf._renderExpressionBuilder(constants.MESSAGE_VALUE);
            let headerCompPromise = globalSelf._appendNameValuePropertiesCVTComponent(constants.HEADERS);
            this.promiseArray.push(headerCompPromise);
            $.when(headerCompPromise).then(function(comp){
               globalSelf.headers = comp;
            });
            let producerCompPromise = globalSelf._appendStaticNameValuePropertiesCVTComponent(constants.PRODUCER_PROP, globalSelf.availableProducerProperties);
            this.promiseArray.push(producerCompPromise);
            $.when(producerCompPromise).then(function(comp){
                globalSelf.additionalProducerProperties = comp;
                globalSelf.additionalProducerProperties.propertiesData = globalSelf.additionalProducerPropData;
            });
            $.when ( ...this.promiseArray ).then ( () => {
                deferred.resolve ();
            } );
            return deferred.promise ();
        },

        onTransportChange: function(updatedData){
            if(updatedData.key == constants.TOPIC_TO_PUBLISH)
                this.model.setKey(updatedData.key, [updatedData.value]);
            else{
                if(updatedData.key == constants.DYNAMIC_TRANSPORT){
                    this.model.setKey(constants.TRANSPORT_NAME, "");
                    this.model.setKey(constants.TOPIC_TO_PUBLISH, [""]);
                }
                
                this.model.setKey(updatedData.key, updatedData.value);
            }
        },

        _renderData: function() {
            let globalSelf = this;
            globalSelf.transportSelector.populateFields({
                topicName: globalSelf.model.getKey(constants.TOPIC_TO_PUBLISH)[0],
                transportName:  globalSelf.model.getKey(constants.TRANSPORT_NAME),
                transportNameAsVar: globalSelf.model.getKey("dynamicTransport")
            });
        },

        /**
         * appends CVT for name value type form
         * @private
         */
        _appendStaticNameValuePropertiesCVTComponent: function (id, nameDropDownArr) {
            let globalSelf = this;
            let deferred = $.Deferred();
            this.$el.find("#" + id).css("height", "240px");
            var promise = MIUIComponent.StaticNameValuePropertiesCVT({
                el: this.$el.find("#" + id),
                data: globalSelf.model.getKey(id),
                activityId: this.activityId,
                reqres: this.designerReqres,
                nameDropDownConfig: nameDropDownArr ? nameDropDownArr : [],
                propertiesData: globalSelf.additionalProducerPropData
            });
            promise.done(function (component) {
                deferred.resolve(component);
            });
            return deferred.promise();
        },

        /**
         * appends CVT for name value type form
         * @private
         */
        _appendNameValuePropertiesCVTComponent: function (id) {
            let globalSelf = this;
            let deferred = $.Deferred();
            this.$el.find("#" + id).css("height", "205px");
            var promise = MIUIComponent.NameValuePropertiesCVT({
                el: this.$el.find("#" + id),
                data: globalSelf.model.getKey(id),
                activityId: this.activityId,
                reqres: this.designerReqres
            });
            promise.done(function (component) {
                deferred.resolve(component);
            });
            return deferred.promise();
        },

        _renderExpressionBuilder:function(elemId){
            var globalSelf = this;
            var element = globalSelf.$el.find("#"+elemId);
            var configData = {
                processModel:this.processModel,
                activityID:this.activityId,
                tabName: "CONFIGURATION"
            };
            var value = "";
            if(this.model.getKey(elemId)){
                value = this.model.getKey(elemId);
            }

            return ExpressionBuilderUtility.render(element,ExpressionBuilderLauncherTypes.PROCESS_CONTEXT,configData,value,null);
        },
        /**
         * Used to render the expression builder
         * @param id
         * @param key
         * @param changeHandler
         * @param dropDownArr
         * @private
         */
        _renderExpressionBuilderDropdown: function _renderExpressionBuilderDropdown(id, key, changeHandler, dropDownArr) {
            var configData = {
                processModel: this.processModel,
                activityID: this.activityId,
                tabName: "CONFIGURATION"
            };
            this[id] = ExpressionBuilderUtility.render(this.$el.find("#" + id) , ExpressionBuilderLauncherTypes.PROCESS_CONTEXT, configData, this.model.get(key), changeHandler, null, null, null, dropDownArr);
        },

        getData: function () {
            let globalSelf = this;

            globalSelf.model.setKey(constants.MESSAGE_KEY, ExpressionBuilderUtility.getExpression(this.messageKey));

            globalSelf.model.setKey(constants.MESSAGE_VALUE, ExpressionBuilderUtility.getExpression(this.messageValue));

            if(globalSelf.headers)
                globalSelf.model.setKey(constants.HEADERS, globalSelf.headers.value());

            if(globalSelf.additionalProducerProperties)
                globalSelf.model.setKey(constants.PRODUCER_PROP, globalSelf.additionalProducerProperties.value());

            return this.model.toJSON();
        },

        highlightErrors: function (errorObjectList) {
            let globalSelf = this;
            errorObjectList.map(function (errorObject) {
                if(errorObject.path == constants.TRANSPORT_NAME){
                    if(globalSelf.model.get(constants.DYNAMIC_TRANSPORT)){
                        errorObject.path = "transport-name-exp";
                    } else {
                        errorObject.path = "transport-dropdown-region";
                    }
                    globalSelf.transportSelector.highlightErrors([errorObject]);
                } else if(errorObject.path == constants.TOPIC_TO_PUBLISH){
                    errorObject.path = "topic-name";
                    globalSelf.transportSelector.highlightErrors([errorObject]);
                } else {
                    var arr = errorObject.path.split("/");
                    if(arr[0] == constants.PRODUCER_PROP && arr.length> 2){
                        globalSelf.additionalProducerProperties.highlightErrors([errorObject]);
                    } else if(arr[0] == constants.HEADERS && arr.length > 2){
                        globalSelf.headers.highlightErrors([errorObject]);
                } else {
                    var element = globalSelf.$el.find("#transport-div").find('#' + errorObject.path);
                    if (element.length) {
                        globalSelf.focusErrorComponent(element);
                        if (!element.is(":visible") && globalSelf.$el.find('#' + errorObject.path + "_wrapper")) {
                            element = globalSelf.$el.find('#' + errorObject.path + "_wrapper");
                        }
                        element.addErrorHighlightClass('components-error-red-highlight');
                        globalSelf.showErrorTooltip(errorObject, element);
                        }
                    }
                }
            });
        },

        setData: function (obj) {
            for (var key in obj) {
                if(this.model.attributes.hasOwnProperty(key)){
                    this.model.set(key,obj[key]);
                }
            }
        },

        getErrorMessage: function () {
            return validator.getErrorMessage(this.model.toJSON());
        },

        _destroyComponent: function (comp) {
            if(comp && comp.destroy)
                comp.destroy();
            comp = null;
        },

        onBeforeDestroy: function () {
            let globalSelf = this;
            this._destroyComponent(this.designerReqres);
            this._destroyComponent(globalSelf.transportList);
            this._destroyComponent(globalSelf.availableProducerProperties);
            this._destroyComponent(globalSelf.transportList);
            this._destroyComponent(globalSelf.selectedTransport);
            this._destroyComponent(globalSelf.transportName);
            this._destroyComponent(globalSelf.topicsToPublish);
            this._destroyComponent(globalSelf.selectedTransport);
            this._destroyComponent(this.messageKey);
            this._destroyComponent(this.messageValue);
            this._destroyComponent(globalSelf.headers);
            this._destroyComponent(globalSelf.additionalProducerProperties);
            this._destroyComponent(globalSelf.transportSelector);
            if(globalSelf.transportSelector && globalSelf.transportSelector.onDestroy){
                globalSelf.transportSelector.onDestroy();
            }
            globalSelf.transportSelector = null;
        }
    });

    return PublishToKafkaUIComponent;
});
