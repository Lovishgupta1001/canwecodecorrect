function _typeof2(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

/**
 * Created by Pranjali
 */
define(function (require) {
  var uilayer = require("uilayer"),
      model = require("./model/AddTabModel"),
      AddTabTemplate = require("tpl!./template/AddTabTemplate"),
      AddTabNLS = require("i18n!./nls/AddTabNLS"),
      UndoRedoConstants = require("./undoRedo/UndoRedoConstants"),
      UndoRedoNLS = require("i18n!./undoRedo/nls/UndoRedoNLS"),
      ProcessModel = require("Widgets/Designer/ProcessModel/ProcessModel"),
      ExpressionBuilderUtility = require("Components/ExpressionBuilderUtility/ExpressionBuilderUtility"),
      ExpressionBuilderLauncherTypes = require("Widgets/Designer/ExpressionBuilder/ExpressionBuilder").ExpressionBuilderLauncherTypes,
      ProcessUndoManagerEventHandler = require("Widgets/Designer/ProcessUndoManager/ProcessUndoManager").ProcessUndoManagerEventHandler,
      CVTComponent = require("Components/CVTComponent/CVTComponent");

  var AddTab = CVTComponent.extend({
    model: model,
    template: AddTabTemplate,
    events: {
      "click .add-tab-div .k-grid-delete": "_deleteRow"
    },
    onInitialize: function onInitialize(options) {
      this.setShortcuts();
      this.activityId = options.activityId;
      this.designerReqres = options.reqres;
      this.isEventRecordingStarted = false;
    },
    onRender: function onRender() {
      CVTComponent.prototype.onRender.call(this);
      this.onCVTRender();
    },
    onCVTRender: function onCVTRender() {
      this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore');
      var activity = this.processModel.getBPMEntityById(this.activityId);
      var variableList = activity.getAllKeys("ADD");
      var variableNameDS = [];

      _.each(variableList, function (variable) {
        variableNameDS.push({
          id: variable,
          variableName: variable
        });
      });

      this._getVariableNameDS(variableNameDS);

      var addTabDataModel = activity.getEntityData().getAddVariables();
      var addTabDataList = [];

      _.each(addTabDataModel.models, function (model) {
        addTabDataList.push(model.attributes);
      });

      if (addTabDataList && addTabDataList.length > 0) {
        this.grid.widget.setDataSource(this._createDataSource(addTabDataList));
      } else {
        this.grid.widget.addRow();
      }
    },
    getElement: function getElement() {
      return Array.isArray(this.$el) ? this.$el.filter(".add-tab-div")[0] : this.$el.find(".add-tab-div");
    },
    getColumns: function getColumns() {
      var globalSelf = this;
      return [{
        selectable: true,
        width: "43px"
      }, {
        field: "variableName",
        headerTemplate: function headerTemplate() {
          return '<div title="' + AddTabNLS.variable + '">' + AddTabNLS.variable + '</div>';
        },
        title: AddTabNLS.variable,
        width: "20%",
        template: function template(data) {
          var varName = data.variableName;

          if (data.variableName && data.variableName.variableName) {
            varName = data.variableName.variableName;
          }

          if (!varName) return globalSelf.prepareGridElementWithEditIcon("<div class='editable hide-text-overflow'></div>");
          var dataValue = globalSelf.variableNameDS.get(varName);

          if (!dataValue && varName) {
            dataValue = globalSelf.variableNameDS.add({
              id: varName,
              variableName: varName
            });
          }

          return globalSelf.prepareGridElementWithEditIcon("<div class='editable varName hide-text-overflow'>" + uilayer.htmlEncode(dataValue.variableName) + "</div>");
        },
        editor: function editor(container, options) {
          $('<input name="variableName"  class="variableDropdown"/>').appendTo(container);
          globalSelf.variableDropdownList = uilayer.comboBox({
            elem: Array.isArray(globalSelf.$el) ? globalSelf.$el.filter('[name="variableName"]')[0] : globalSelf.$el.find('[name="variableName"]'),
            ignoreCase: false,
            dataSource: globalSelf.variableNameDS,
            dataValueField: "id",
            dataIdField: "id",
            dataTextField: "id",
            template: "<div>#:variableName#</div>",
            valueTemplate: "<div>#:variableName#</div>"
          });
        },
        attributes: {
          "class": "variableName"
        }
      }, {
        field: "expression",
        headerTemplate: function headerTemplate() {
          return '<div title="' + AddTabNLS.expression + '">' + AddTabNLS.expression + '</div>';
        },
        title: AddTabNLS.expression,
        customEditor: true,
        template: this.getExpressionBuilderTemplate.bind(this, "expression"),
        editor: this.getExpressionBuilderEditor.bind(this, {
          configData: {
            tabName: "ADD"
          },
          changeHandler: this._changeHandler.bind(this)
        }),
        attributes: {
          "class": "expression"
        }
      }];
    },
    _createDataSource: function _createDataSource(data) {
      var globalSelf = this;
      return new uilayer.data.DataSource({
        data: data,
        schema: {
          model: {
            fields: {
              fieldId: {
                defaultValue: ""
              },
              variableName: {
                defaultValue: ""
              },
              expression: {
                defaultValue: ""
              }
            }
          }
        }
      });
    },
    _getVariableNameDS: function _getVariableNameDS(data) {
      var variableNameDS = new uilayer.data.DataSource({
        data: data
      });
      variableNameDS.fetch();
      this.variableNameDS = variableNameDS;
      return variableNameDS;
    },
    _deleteRow: function _deleteRow(e) {
      var globalSelf = this;
      var rowsToBeDeleted = [];
      var deletedRows = 0;
      globalSelf.getSelectedRows().each(function () {
        rowsToBeDeleted.push($(this).closest('tr'));
        var rowData = globalSelf.grid.widget.dataItem($(this).closest('tr'));
        var variableName = rowData.variableName && _typeof(rowData.variableName) == 'object' ? rowData.variableName.variableName : rowData.variableName;
        var expression = rowData.expression && globalSelf.getExpression(rowData.expression);
        var fieldId = rowData.fieldId;
        var rowId = globalSelf.getIndexOfDataItem($(this).closest('tr')); //Start UndoManager Transaction if VariableName is available.

        if (variableName) {
          ProcessUndoManagerEventHandler.startEventRecording(UndoRedoConstants.EVENT_DETAILS.DELETE_VARIABLE, UndoRedoNLS.messages.DELETE_VARIABLE, globalSelf, globalSelf.processModel._getHintNotificationNamespace(), null, [variableName, globalSelf._getEntityName()]);
        }

        globalSelf.processModel.removeVariable(variableName, expression, globalSelf.activityId, "ADD", fieldId, rowId - deletedRows);
        globalSelf.processModel.updateRowOfAddVariables(globalSelf.activityId, rowId - deletedRows);
        deletedRows++;
        ProcessUndoManagerEventHandler.endEventRecording(UndoRedoConstants.EVENT_DETAILS.DELETE_VARIABLE, globalSelf, globalSelf.processModel._getHintNotificationNamespace());
      });
      $.each(rowsToBeDeleted, function (index, item) {
        globalSelf.grid.widget.removeRow(item);
      });

      if (this.onRowsDelete) {
        this.onRowsDelete(rowsToBeDeleted);
      }
    },
    onSaveGridChange: function onSaveGridChange(event, oldName) {
      this.processModel = this.designerReqres.request('getCurrentActiveEntityModelFromDataStore');
      var variableName;

      if (_typeof2(event.model.get("variableName")) == 'object') {
        variableName = event.model.get("variableName").variableName;
      } else {
        variableName = event.model.get("variableName");
      }

      var expression = _.isObject(event.model.expression) ? this.getExpression(event.model.expression) : event.model.expression; //Start UndoManager Transaction if both VariableName and Expression are available.

      if (variableName && expression) {
        ProcessUndoManagerEventHandler.startEventRecording(UndoRedoConstants.EVENT_DETAILS.ADD_VARIABLE, UndoRedoNLS.messages.ADD_VARIABLE, this, this.processModel._getHintNotificationNamespace(), null, [variableName, this._getEntityName()]);
      }

      var gridData = this._getGridData();

      if (!_.isNull(oldName) && !_.isUndefined(oldName) && !_.isObject(oldName)) {
        this._addOldVariableName(gridData, oldName, event.model.fieldId);
      }

      this.processModel.addVariable(gridData, event.model.fieldId, this.activityId, "ADD");
      ProcessUndoManagerEventHandler.endEventRecording(UndoRedoConstants.EVENT_DETAILS.ADD_VARIABLE, this, this.processModel._getHintNotificationNamespace());
    },

    /**
     * This function is responsible to return the Grid data.
     * @return {Array}
     * @private
     */
    _getGridData: function _getGridData() {
      var _this = this;

      var gridData = [];

      _.each(this.grid.widget.dataSource.data().toJSON(), function (variable) {
        gridData.push({
          variableName: _.isObject(variable.variableName) ? variable.variableName.variableName : variable.variableName,
          expression: _.isObject(variable.expression) ? _this.getExpression(variable.expression) : variable.expression,
          fieldId: variable.fieldId
        });
      });

      return gridData;
    },
    _addOldVariableName: function _addOldVariableName(gridData, oldName, fieldId) {
      _.each(gridData, function (variable) {
        if (variable.fieldId === fieldId && variable.variableName !== oldName) {
          variable.oldName = oldName;
        }
      });
    },
    setData: function setData(obj) {},
    getErrorMessage: function getErrorMessage() {},

    /**
     * This function is called when reordering operation is performed. Here, list of all the variables present
     * on ADD Tab is sent to the process Model
     */
    onChangeRowIndex: function onChangeRowIndex() {
      this.processModel.updateVariables(this._getGridData(), this.activityId, "ADD");
    },

    /**
     * This function returns the current activity name.
     * @private
     */
    _getEntityName: function _getEntityName() {
      return this.processModel.getBPMEntityById(this.activityId).getName();
    },
    onBeforeDestroy: function onBeforeDestroy() {
      this.activityId = null;
      this.designerReqres = null;
      this.processModel = null;
      this.variableNameDS = null;

      if (this.variableDropdownList) {
        this.variableDropdownList.destroy();
        this.variableDropdownList = null;
      }
    }
  });
  return AddTab;
});
