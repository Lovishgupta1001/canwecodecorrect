/**
 * Created by sharoni on 21-07-2021.
 */

define(function (require) {
    var uilayer = require("uilayer"),
        globalSelf,
        template = require("tpl!./template/PublishComponentTemplate"),
        JMSTemplate = require("tpl!./template/JMSTemplate"),
        model = require("./model/PublishComponentModel"),
        nls = require("i18n!./nls/PublishComponentNLS"),
        constants = require("./js/constants"),
        ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
        ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes;

    var PublishUIComponent = MIUIComponentI.extend({
        model: model,
        template: template,
        nls: nls,
        customEvents: constants.EVENTS_CONSTANTS,

        events: {
            "click input[name='connection-transport-radio']":"_onConnectionTransportRadioChange",
            "click #topic-queue-button": "_openTopicsQueuesPopup",
            "change input[type=radio][name=client-attributes-type]": "_hideShowClientAttributesType"
        },

        onInitialize: function (options) {
            globalSelf = this;
            this.activityId = options.activityId;
            this.designerReqres = options.reqres;
            this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore');
            this.promiseArray   = [];
            this.secondaryEntityExpBuilderForTransport = {};
        },

        onRender: function () {
            let deferred = $.Deferred ();
            this.clientConfigurationAttributesMap=this._renderExpressionBuilder(constants.clientConfigurationAttributesMap);
            this.$el.find('.publish-connection-transport-radio').kendoRadio();
            this.$el.find('.client-attributes-type').kendoRadio();
            this.$el.find(".topic-queue-button").kendoButton();
            globalSelf.$el.find("#topic-queue").hide();
            this._onConnectionTransportRadioChange();
            this.selectedItemTextBoxMessage = this._renderExpressionBuilder(constants.SELECTED_ITEM_TEXT_BOX);
            this._renderTransportTypeDropDown();
            this._renderSecondaryEntityComponentForConnection();
            this.promiseArray.push(this._renderHTTPAuthComponent());
            this.clientAttributesMapDiv=this.$el.find("#client-attributes-type-map-div");
            this.publishCVTDiv = this.$el.find("#publish-ap-config");
            this._createTabStrip();
            if(this.model.getKey(constants.clientAttributesMode) === constants.clientAttributesForm ){
                this.$el.find("#client-attributes-type-map").prop("checked",false);
                this.$el.find("#client-attributes-type-form").prop("checked",true);
                this.clientAttributesMapDiv.hide();
                this.publishCVTDiv.show();
            }else{
               this.$el.find("#client-attributes-type-form").prop("checked",false);
               this.$el.find("#client-attributes-type-map").prop("checked",true);
               this.clientAttributesMapDiv.show();
               this.publishCVTDiv.hide();
            }
            $.when ( ...this.promiseArray ).then ( () => {
                deferred.resolve ();
            } );
            return deferred.promise ();
        },
        _renderSecondaryEntityComponentForConnection: function () {
            // ----
            var promise = MIUIComponent.SecondaryEntitySelectorComponent({
                el: this.$el.find('#secondaryEntity'),
                secondaryEntityName: "Connection",
                secondaryEntityURL: {
                    first:"activities/publish/fetchTransportConnections",
                    second:"services/fetchAccessibleTransportConnections",
                },
                secondaryEntityDataSource: {
                    text:"connectionName",
                    value:"connectionId",
                },
                labelCssClass:"",
                valueCssClass:"ul-input-container publish-connection-padding",
                openURL: "#applicationConnections/Edit/",
                createURL: "#applicationConnections/New",
                adminConsole:  true,
                isRequired: true,
                rowCssClass: "ul-form-row ul-flex-gap-3x ",
                ValidateCreateOperation: "Add Application Connections",
                inputFieldId:"connectionCombobox",
                _setInitialDataForSecondaryComponent:globalSelf._setInitialDataForConnectionConfigiration.bind(globalSelf)


            });
            promise.done(function(component){
                globalSelf.SecondaryEntitySelector = component;
                globalSelf.listenTo(globalSelf.SecondaryEntitySelector,constants.SecondaryEntity_UPDATED,globalSelf._handleChangeForConnection.bind(this));
            });
            //--
        },
        _setInitialDataForConnectionConfigiration:function (connectionDropDownConfig) {
              connectionDropDownConfig.value (this.model.getKey(constants.CONNECTION_COMBOBOX) );
              connectionDropDownConfig.trigger("change")

},
        _handleChangeForConnection: function(){
            globalSelf.model.setKey(constants.CONNECTION_COMBOBOX, globalSelf.SecondaryEntitySelector.secondaryEntityDropdown.dropDown.value());
            globalSelf.SecondaryEntitySelector.secondaryEntityDropdown.dropDown.value(globalSelf.model.getKey(constants.CONNECTION_COMBOBOX));
        },
        _createTabStrip: function(){
            let globalSelf = this;
            this.publishTabStrip = uilayer.tabStrip({
                elem: this.$el.find("#publish-tabstrip"),
                animation: false,
                navigatable: true,
                select: function (e) {
                    globalSelf._showSubComponent(e.item.id);
                }
            });
            this.publishTabStrip.select(0);
        },
        _showSubComponent: function(componentName) {
            this._hideAllComponents();
            $("#"+componentName+"-component").css("display","block");
            if (componentName === "advancedConfSelect") {
                if(!this.PublishAPConfig){
                    this._appendPublishClientConfigCVTComponent();
                }
                else{
                    this._refreshPublishAPConfig();
                }
            }
        },
        _hideAllComponents: function() {
            $("#transportConfSelect-component").css("display","none");
            $("#advancedConfSelect-component").css("display","none");
        },
        _fetchAdvancedConfigProperties(transportType, transportName) {
            return AjaxUtility.commonAjaxRequest(
                "GET",
                "activities/publish/fetchAdvancedConfigProperty?transportType=" +
                transportType +
                "&transportName=" +
                transportName,
                null,
                "json"
            );
        },
        _refreshPublishAPConfig: function() {
            let isConnection = this.$el.find("#connectionRadio").is(":checked");
            let transportType;
            let transportName = "";
            if (isConnection) {
                transportType = "HTTP";
            } else {
                transportType = this.transportTypeDropdown.value();
                transportName = ExpressionBuilderUtility.getExpressionWithoutLanguage(this.secondaryEntityExpBuilderForTransport);
            }
            this._fetchAdvancedConfigProperties(transportType,transportName).done((response) => {
                let dropdownList = response.map(item => ({
                    text: item.label,
                    value: `"${item.key}"`
                }));
            if (this.PublishAPConfig) {
                this.PublishAPConfig.refreshTransportConfig(dropdownList);
                }
            });
        },
        _appendPublishClientConfigCVTComponent: function () {
            let deferred = $.Deferred ();
            let promise = MIUIComponent.AdvancedConfigurationPropertyCVT ( {
                el: this.$el.find("#publish-ap-config"),
                data: this.model.get ( constants.clientConfigurationAttributes ) || [],
                activityId: this.activityId,
                reqres: this.designerReqres,
            } );
            promise.done ( ( component ) => {
                deferred.resolve ();
                this.PublishAPConfig= component;
                this._refreshPublishAPConfig();
            } );
            return deferred.promise ();
        },
        _hideShowClientAttributesType: function ( event ) {
            let value = event.target ? $ ( event.target ).attr ( "value" ) : event;
            if ( value === "clientAttributesMap" ) {
                this.clientAttributesMapDiv.show();
                this.publishCVTDiv.hide();
            } else {
                this.clientAttributesMapDiv.hide();
                this.publishCVTDiv.show();
            }
            this.model.set ( constants.clientAttributesMode, value );
        },
        _renderSecondaryEntityComponent: function(transportType){
            // ----
            var promise = MIUIComponent.SecondaryEntitySelectorComponent({
                el: this.$el.find('#secondaryEntityForTransport'),
                secondaryEntityName: "Transport",
                secondaryEntityURL: {
                    first:"activities/publish/fetchTransportListByType?transportType=",
                },
                secondaryEntityDataSource: {
                    text:"text",
                    value:"value",
                },
                processModel: this.processModel,
                activityID: this.activityId,
                tabName: "CONFIGURATION",
                labelCssClass:"",
                valueCssClass:"ul-input-container",
                openURL: "#transports/edit/",
                createURL: "#transports/create",
                adminConsole:  true,
                isRequired: true,
                rowCssClass: "ul-form-row ul-flex-gap-3x ",
                expressionBuilder: true,
                transportType: transportType,
                ValidateCreateOperation: "Create Transport",
                inputFieldId:"transportCombobox",
                 _setInitialDataForSecondaryComponent:globalSelf._setInitialDataForPublishTransport.bind(globalSelf),
                _setExpressionBuilder:globalSelf.setExpressionBuilderForTransport.bind(globalSelf)


            });
            promise.done(function(component){
                globalSelf.SecondaryEntitySelectorForTransport = component;
                globalSelf.secondaryEntityExpBuilderForTransport = globalSelf.SecondaryEntitySelectorForTransport.secondaryEntityExpBuilder;
                globalSelf.listenTo(globalSelf.SecondaryEntitySelectorForTransport,constants.SecondaryEntity_UPDATED,globalSelf._handleChangeForTransport.bind(globalSelf));
            });
            //--
        },
        _setInitialDataForPublishTransport:function(){
             return this.model.getKey(constants.TRANSPORT_COMBO_BOX)
        },

         setExpressionBuilderForTransport:function(secondaryEntityExpBuilder ,transportList){
            this.transportList = transportList;
            this._handleChangeForTransport(secondaryEntityExpBuilder);

        },
        _clearCVTElements: function(){
            if(this.PublishAPConfig){
                this.model.set(constants.clientConfigurationAttributes,[]);
                this.PublishAPConfig.clearRows();
            }
        },
        _handleChangeForTransport: function(secondaryEntityExpBuilder){
            this.secondaryEntityExpBuilderForTransport = secondaryEntityExpBuilder;
            this._clearCVTElements();
            let selectedTransportName = ExpressionBuilderUtility.getExpressionWithoutLanguage(secondaryEntityExpBuilder) || "";
            let transport = globalSelf.transportList.filter(function(transport){
                return transport.name == selectedTransportName })[0];
            if(transport){
                globalSelf.$el.find("#url-where-data-published").text(transport.httpPublishURL);
                globalSelf.model.setKey(constants.HIDDEN_PUBLISH_VAR, constants.STATIC);
            }
            else{
                selectedTransportName = ExpressionBuilderUtility.getExpression(secondaryEntityExpBuilder);
                globalSelf.$el.find("#url-where-data-published").text("");
                globalSelf.model.setKey(constants.HIDDEN_PUBLISH_VAR, constants.DYNAMIC);
            }
            globalSelf.model.setKey(constants.TRANSPORT_COMBO_BOX, selectedTransportName);

        },
        _updateAndrenderSecondaryEntityComponent :function(transportType){
            if(globalSelf.SecondaryEntitySelectorForTransport){
                globalSelf.SecondaryEntitySelectorForTransport.updateTransportType(transportType);
            }else{
                globalSelf._renderSecondaryEntityComponent();
            }
        },

        _renderHTTPAuthComponent: function(){
            let deferred = $.Deferred ();
            if(globalSelf.httpAuthComponent ){
                globalSelf.httpAuthComponent.onDestroy();
                globalSelf.httpAuthComponent = null;
            }
            var promise = MIUIComponent.MessageAndHTTPVerb({
                el: this.$el.find("#message-http-component"),
                activityId: this.activityId,
                activityName: this.activityName,
                data: {
                    selectedItemTextbox: globalSelf.model.get(constants.SELECTED_ITEM_TEXT_BOX),
                    httpVerb: globalSelf.model.get(constants.HTTP_VERB),
                    nonRefAttachmentEbl: globalSelf.model.get(constants.NON_REF_ATTACHMENT_EBL),
                    cmbAuthorizationtype: globalSelf.model.get(constants.CMB_AUTHORIZATION_TYPE),
                    authorizationCredentialValue: globalSelf.model.get(constants.AUTHORIZATION_CREDENTIAL_VALUE),
                    authorizationCredentialVariable: globalSelf.model.get(constants.AUTHORIZATION_CREDENTIAL_VARIABLE),
                    cvtFormParameterTokens: globalSelf.model.get(constants.CVT_FORM_PARAMETER_TOKENS),
                    radioMap: globalSelf.model.get(constants.RADIO_MAP),
                    radioCVT: globalSelf.model.get(constants.RADIO_CVT),
                    mapParam: globalSelf.model.get(constants.MAP_PARAM)
                },
                reqres: this.designerReqres
            });
            promise.done(function (comp) {
                globalSelf.httpAuthComponent = comp;
                globalSelf._renderTransportType();
                globalSelf.$el.find(".msg-http-Verb").removeClass("ul-required").addClass("");
                deferred.resolve();
            });
            return deferred.promise();
        },

        _updateModelForHTTPTransportTab: function(){
            this.model.set ( constants.CMB_AUTHORIZATION_TYPE, "" );
            this.model.set ( constants.NON_REF_ATTACHMENT_EBL, "" );
            this.model.set ( constants.RADIO_MAP, false );
            this.model.set ( constants.RADIO_CVT, true );
            this.model.set ( constants.HTTP_VERB, "" );
            this.model.set ( constants.AUTHORIZATION_CREDENTIAL_VALUE, {
                txtUsername: "",
                txtPassword: ""
            } );
            this.model.set ( constants.AUTHORIZATION_CREDENTIAL_VARIABLE, {
                expUsername: "",
                expPassword: "",
                cmbDecryptor: ""
            });
        },
        _updateModelForJMSTransportTab: function(){
            this.model.set(constants.DESTINATION, "");
            this.model.set(constants.DEST_TYPE, "");
            this.model.set ( constants.TRANSPORT_COMBO_BOX, "" );
            ExpressionBuilderUtility.setValueOnExpressionBuilder(globalSelf.secondaryEntityExpBuilderForTransport, globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX));
        },

        _updateModelForConnectionTab: function(){
            this.model.set(constants.CONNECTION_COMBOBOX,"");
            globalSelf.SecondaryEntitySelector.secondaryEntityDropdown.dropDown.value(globalSelf.model.getKey(constants.CONNECTION_COMBOBOX));
        },
        _onConnectionTransportRadioChange: function (e) {
            if(e){
                if(e.target.getAttribute("id") == constants.CONNECTION_RADIO){
                    this.model.setKey(constants.CONNECTION_RADIO, true);
                    this.model.setKey(constants.TRANSPORT_RADIO, false);
                    this._updateModelForHTTPTransportTab();
                    this._updateModelForJMSTransportTab();

                    this.model.set ( constants.TRANSPORT_TYPE_COMBOBOX, nls['publish.httpTransport'] );
                    this.model.set ( constants.TRANSPORT_COMBO_BOX, "" );
                    this.transportTypeDropdown.value(globalSelf.model.getKey(constants.TRANSPORT_TYPE_COMBOBOX));
                    let transportType = this.transportTypeDropdown.value();
                    this._fetchTransportsBasedOnType(transportType,this.model.getKey(constants.DESTINATION));
                    this._changeTransportType();


                }
                else{
                    this.model.setKey(constants.CONNECTION_RADIO, false);
                    this.model.setKey(constants.TRANSPORT_RADIO, true);
                    this._updateModelForConnectionTab();
                }
            }

            if(this.model.getKey(constants.CONNECTION_RADIO) == true ){
                this.$el.find("#connection-div").show();
                this.$el.find("#transport-div").hide();
                this.$el.find("#connectionRadio").prop("checked",true);
                this.$el.find("#transportRadio").prop("checked",false);
            }
            else{
                this.$el.find("#connection-div").hide();
                this.$el.find("#transport-div").show();
                this.$el.find("#connectionRadio").prop("checked",false);
                this.$el.find("#transportRadio").prop("checked",true);
            }
        },

        _renderTransportTypeDropDown:function(){
            this.transportTypeDropdown = uilayer.dropDownList({
                elem: this.$el.find("#transportTypeCombobox"),
                dataSource: new uilayer.data.DataSource({
                    data: [{"text" : nls['publish.httpTransport'], "value" : nls['publish.httpTransport']},
                        {"text" : nls['publish.jmsTransport'], "value" : nls['publish.jmsTransport']}]
                }),
                dataTextField: "text",
                dataValueField: "value",
                change: function(){
                    globalSelf._renderTransportType();
                    globalSelf._changeTransportType();
                }
            });
            this.transportTypeDropdown.value(globalSelf.model.getKey(constants.TRANSPORT_TYPE_COMBOBOX));
            globalSelf._renderSecondaryEntityComponent(this.transportTypeDropdown.value());
        },
        _renderTransportType: function() {
            let transportType = globalSelf.transportTypeDropdown.value();
            globalSelf._fetchTransportsBasedOnType(transportType,this.model.getKey(constants.DESTINATION));

            if(transportType === nls['publish.jmsTransport']) {
                if(globalSelf.httpAuthComponent) globalSelf.httpAuthComponent.hideAllExceptMessage();
                globalSelf.$el.find(".url-div").hide();
                globalSelf.$el.find(".topic-queue-div").show();
                globalSelf.$el.find("#topic-queue-value").val(globalSelf.model.getKey("destination"));
                globalSelf.model.setKey(constants.TRANSPORT_TYPE_COMBOBOX,nls['publish.jmsTransport']);
                globalSelf.$el.find(".http-header-provided-as").html(nls['httpHeadersProvidedAsJms']);
                globalSelf.$el.find("label[for='http-header-type-map']").text(nls['mapJms']);
                globalSelf.$el.find("label[for='http-header-type-form']").text(nls['formJms']);
            }else {
                if(globalSelf.httpAuthComponent) globalSelf.httpAuthComponent.showAllAttris();
                globalSelf.$el.find(".url-div").show();
                globalSelf.$el.find(".topic-queue-div").hide();
                globalSelf.model.setKey(constants.TRANSPORT_TYPE_COMBOBOX,nls['publish.httpTransport']);
                globalSelf.$el.find(".http-header-provided-as").html(nls['httpHeadersProvidedAsHttp']);
                globalSelf.$el.find("label[for='http-header-type-map']").text(nls['mapHttp']);
                globalSelf.$el.find("label[for='http-header-type-form']").text(nls['formHttp']);
            }
            globalSelf.$el.find("#url-where-data-published").text("");
        },
        _changeTransportType: function() {
            let transportType = globalSelf.transportTypeDropdown.value();
            this._updateAndrenderSecondaryEntityComponent(transportType);
            if(transportType === nls['publish.jmsTransport']) {
                this._updateModelForHTTPTransportTab();
                this.model.set ( constants.TRANSPORT_COMBO_BOX, "" );
                ExpressionBuilderUtility.setValueOnExpressionBuilder(globalSelf.secondaryEntityExpBuilderForTransport, globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX));
                this._renderHTTPAuthComponent();
            }else {
                this._updateModelForJMSTransportTab();
                this.model.set ( constants.TRANSPORT_TYPE_COMBOBOX, nls['publish.httpTransport'] );
                this.model.set ( constants.TRANSPORT_COMBO_BOX, "" );
                this.transportTypeDropdown.value(globalSelf.model.getKey(constants.TRANSPORT_TYPE_COMBOBOX));
                ExpressionBuilderUtility.setValueOnExpressionBuilder(globalSelf.secondaryEntityExpBuilderForTransport, globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX));
                this._renderHTTPAuthComponent();
                this.$el.find(".message-http-row").show();
            }
            globalSelf.$el.find("#url-where-data-published").text("");
        },

        _fetchTransportsBasedOnType: function(value,destination){
            var fetchDataPromise = AjaxUtility.commonAjaxRequest("GET", "activities/publish/fetchTransportListByType?transportType="+value, null, "json");

            fetchDataPromise.done(function (data) {
                globalSelf.transportList = data;
                globalSelf.transportListArray = [];
                globalSelf.transportList.forEach(function(transport){
                    globalSelf.transportListArray.push(transport.name);

                });

                ExpressionBuilderUtility.setDropDownConfiguration(globalSelf.secondaryEntityExpBuilderForTransport, globalSelf.transportListArray);
                ExpressionBuilderUtility.setValueOnExpressionBuilder(globalSelf.secondaryEntityExpBuilderForTransport, globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX));

                if(globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX) !== ""){
                    let transport = globalSelf.transportList.filter(function(transport1){
                        return transport1.name == globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX)
                    })[0];
                    if(transport){
                        ExpressionBuilderUtility.setValueOnExpressionBuilder(globalSelf.secondaryEntityExpBuilderForTransport, globalSelf.model.getKey(constants.TRANSPORT_COMBO_BOX));
                        globalSelf.$el.find("#url-where-data-published").text(transport.httpPublishURL);
                    }
                }
                data.forEach(function(datas) {
                    var queuesList = datas.queues;
                    if (queuesList != null)
                        queuesList.forEach(function(queue) {
                            if (queue.name === destination) {
                                if (queue.type === constants.FIFO) {
                                    $("#topic-queue-value-info").show();
                                } else {
                                    $("#topic-queue-value-info").hide();
                                }
                            }
                        });
                });
            });
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

        _openTopicsQueuesPopup: function(){
            if(this.topicsAndQueuesPopup){
                this.topicsAndQueuesPopup.destroy();
                this.topicsAndQueuesPopup = null;
            }
            this.$el.append(function() {
                return JMSTemplate({
                    nls: nls
                })
            });

            this._createTopicsAndQueuesPopup();
            var jmsTransport = globalSelf.transportList.filter(function(transport){
                return transport.name == ExpressionBuilderUtility.getExpressionWithoutLanguage(globalSelf.secondaryEntityExpBuilderForTransport);
            })[0];
            if(jmsTransport){
                this._appendTopicsList(jmsTransport);
                this._appendQueuesList(jmsTransport);
                this.topicsAndQueuesPopup.$el.find('.topicRadio').kendoRadio();
                this.topicsAndQueuesPopup.$el.find('.queuesRadio').kendoRadio();
            }

            let destination = this.model.getKey(constants.DESTINATION);
            if(destination!== ""){
                $('input[name="topicOrQueueRadio"][value="'+destination+'"]').prop("checked",true);
            }
        },
        _createTopicsAndQueuesPopup: function(){
            this.topicsAndQueuesPopup = uilayer.modal({
                elem: globalSelf.$el.find("#topic-queue"),
                title: nls["topicQueue"],
                modal: true,
                animation: false,
                width: "60%",
                height: "40%",

                actions: [
                    "maximize",
                    "close"
                ],
                buttons: [
                    {
                        label: "save",
                        action: "save",
                        uiStyle: "primary"
                    }, {
                        label: "cancel",
                        action: "cancel_changes"
                    }
                ],
                close: function () {
                    this.destroy();
                },
                save: function () {
                    if(this.$el.find('input[name="topicOrQueueRadio"]:checked').length > 0){
                        let selectedTopicQueue = this.$el.find('input[name="topicOrQueueRadio"]:checked').val();
                        let selectedTopicQueueType = this.$el.find('input[name="topicOrQueueRadio"]:checked').attr('id');
                        let destType;
                        if(this.$el.find('input[name="topicOrQueueRadio"]:checked')[0].className.includes("topicRadio")){
                            destType = constants.TOPIC;
                        }
                        else{
                            destType = constants.QUEUE;
                        }
                        globalSelf.model.setKey(constants.DESTINATION, selectedTopicQueue);
                        globalSelf.model.setKey(constants.DEST_TYPE, destType);
                        $("#topic-queue-value").val(selectedTopicQueue);
                        if(selectedTopicQueueType===constants.FIFO){
                        $("#topic-queue-value-info").show();
                        }else{
                        $("#topic-queue-value-info").hide();
                        }
                    }

                    this.destroy();
                },
                cancel_changes: function () {
                    this.destroy();
                }

            });
            this.topicsAndQueuesPopup.center().open();
        },
        _appendTopicsList: function(jmsTransport){
            var topicList = jmsTransport.topics;
            topicList.forEach(function(topic){
                globalSelf.topicsAndQueuesPopup.$el.find("#topics-list").append('<div><input type="radio" class="topicRadio" name="topicOrQueueRadio" id="' + topic + '" value="' + topic + '" />'+topic +  '</div>');
            });
        },
        _appendQueuesList: function(jmsTransport){
            var queuesList = jmsTransport.queues;
            queuesList.forEach(function(queue){
                globalSelf.topicsAndQueuesPopup.$el.find("#queues-list").append('<div><input type="radio" class="queuesRadio" name="topicOrQueueRadio" id = "' + queue.type +'_'+queue.name + '" value = "' + queue.name + '" />'+queue.name +  '</div>');
            });
        },
        getData: function () {
            if(this.httpAuthComponent){
                let cmbAuthType = this.httpAuthComponent.value()[constants.CMB_AUTHORIZATION_TYPE];
                if(cmbAuthType == "None" || cmbAuthType == "")
                {
                    this.model.set ( constants.CMB_AUTHORIZATION_TYPE, constants.DEFAULT_CREDENTIAL );
                }
                else{
                    this.model.set ( constants.CMB_AUTHORIZATION_TYPE, this.httpAuthComponent.value()[constants.CMB_AUTHORIZATION_TYPE] );
                }
                this.model.set ( constants.NON_REF_ATTACHMENT_EBL, this.httpAuthComponent.value()[constants.NON_REF_ATTACHMENT_EBL] );
                this.model.set ( constants.RADIO_MAP, this.httpAuthComponent.value()[constants.RADIO_MAP] );
                this.model.set ( constants.RADIO_CVT, this.httpAuthComponent.value()[constants.RADIO_CVT] );
                this.model.set ( constants.SELECTED_ITEM_TEXT_BOX, this.httpAuthComponent.value()[constants.SELECTED_ITEM_TEXT_BOX] );
                this.model.set ( constants.HTTP_VERB, this.httpAuthComponent.value()[constants.HTTP_VERB] );
                this.model.set ( constants.CVT_FORM_PARAMETER_TOKENS, this.httpAuthComponent.value()[constants.CVT_FORM_PARAMETER_TOKENS] );
                this.model.set ( constants.MAP_PARAM, this.httpAuthComponent.value()[constants.MAP_PARAM] );
                this.model.set ( constants.AUTHORIZATION_CREDENTIAL_VALUE, this.httpAuthComponent.value()[constants.AUTHORIZATION_CREDENTIAL_VALUE] );
                this.model.set ( constants.AUTHORIZATION_CREDENTIAL_VARIABLE, this.httpAuthComponent.value()[constants.AUTHORIZATION_CREDENTIAL_VARIABLE] );

               }
               if(this.model.getKey(constants.CONNECTION_RADIO) == true){
                    this.model.set ( constants.SELECTED_ITEM_TEXT_BOX, ExpressionBuilderUtility.getExpression(this.selectedItemTextBoxMessage) );
               }
            if(this.model.getKey(constants.clientAttributesMode) === constants.clientAttributesForm){
                this.model.set(constants.clientConfigurationAttributes,this.PublishAPConfig.value())
                this.model.set ( constants.clientConfigurationAttributesMap,"")
            }
            else{
                this.model.set(constants.clientConfigurationAttributes,[])
                this.model.set ( constants.clientConfigurationAttributesMap, ExpressionBuilderUtility.getExpression(this.clientConfigurationAttributesMap) );
            }
            return this.model.toJSON();
        },

        highlightErrors: function (errorObjectList) {
            let globalSelf = this;
            errorObjectList.map(function (errorObject) {
                if(globalSelf.model.get("transportRadio")){
                    var element = globalSelf.$el.find("#transport-div").find('#' + errorObject.path);
                }
                else{
                    var element = globalSelf.$el.find("#connection-div").find('#' + errorObject.path);
                }
                if (element.length) {
                    globalSelf.focusErrorComponent(element);
                    if (!element.is(":visible") && globalSelf.$el.find('#'+errorObject.path + "_wrapper")) {
                        element = globalSelf.$el.find('#'+errorObject.path + "_wrapper");
                    }
                    element.addErrorHighlightClass('components-error-red-highlight');
                    globalSelf.showErrorTooltip(errorObject, element);
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

        onBeforeDestroy: function () {
            if(this.httpAuthComponent) this.httpAuthComponent.onDestroy();
            if(this.selectedItemTextBoxMessage){
                this.selectedItemTextBoxMessage.destroy();
                this.selectedItemTextBoxMessage = null;
            }
            if(this.publishTabStrip){
                this.publishTabStrip.destroy();
                this.publishTabStrip = null;
            }
            if(this.PublishAPConfig){
                this.PublishAPConfig.onDestroy();;
                this.PublishAPConfig = null;
            }
            if(this.clientConfigurationAttributesMap){
                this.clientConfigurationAttributesMap.destroy();
                this.clientConfigurationAttributesMap = null;
            }
        }
    });

    return PublishUIComponent;
});
