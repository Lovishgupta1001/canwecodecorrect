import React, {useEffect} from 'react';
import PropTypes from 'prop-types';
import {EQULTypo} from '@uilayer/typography';
import {EQULGrid, EQULGridFilterColumnMenu} from '@uilayer/grid';
import {useTrans} from '@uilayer/react-i18n';
import constants from '../constants/constants';
import {customSubStepCell, customTxnIdCell} from './CustomGridCells';
import { DsUrlProvider } from '../context/DsURLContext';
import AbortTransactions from './AbortTransactions';

const ThreadDetailsTable = function({
  detailsList,
  setParentCallback,
  abortFlagforCheckbox,
  dsURL,
  toolbarIcons,
  abortRef,
  abortThreadIds,
  setAbortFlagCallback,
  setThreadIdsEmptyCallback,
  operationList
}){
  const nls = useTrans(["mimonitorthreadpool"]);
  const columns = [
    {
      field: constants.ThreaddetailsTableColumns.Field.threadName,
      title: nls("ThreaddetailsTableColumns.Title.threadName"),
      filter: "text",
      columnMenu: EQULGridFilterColumnMenu,
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.convId,
      title: nls("ThreaddetailsTableColumns.Title.convId"),
      filter: "text",
      columnMenu: EQULGridFilterColumnMenu,
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.txnId,
      title: nls("ThreaddetailsTableColumns.Title.txnId"),
      cell:customTxnIdCell,
      filter: "text",
      columnMenu: EQULGridFilterColumnMenu,
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.priority,
      title: nls("ThreaddetailsTableColumns.Title.priority"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.txnStartTime,
      title:  nls("ThreaddetailsTableColumns.Title.txnStartTime"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.fromTime,
      title:  nls("ThreaddetailsTableColumns.Title.fromTime"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.formattedDuration,
      title: nls("ThreaddetailsTableColumns.Title.formattedDuration"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.txnStatus,
      title: nls("ThreaddetailsTableColumns.Title.txnStatus"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.oprStatus,
      title: nls("ThreaddetailsTableColumns.Title.oprStatus"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.processName,
      title: nls("ThreaddetailsTableColumns.Title.processName"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.stepName,
      title: nls("ThreaddetailsTableColumns.Title.stepName"),
    },
    {
      field: constants.ThreaddetailsTableColumns.Field.subStepName,
      title: nls("ThreaddetailsTableColumns.Title.subStepName"),
      cell: customSubStepCell
    },

  ];
  const configObj = {
    selectable: {
      enabled: true,
      drag: false,
      cell: false,
      mode: "multiple",
    },
    sort: [
      {
        field: "threadName",
        dir: "asc",
      },
    ],
  };
  const [dataConfig, setDataConfig] = React.useState(configObj);
  const [selectedState, setSelectedState] = React.useState({});

  React.useEffect(() => {
    setSelectedState({});
},[detailsList,abortFlagforCheckbox])

  const onDataStateChange = (dataStateChanged) => {
    setDataConfig(dataStateChanged);
  };


  const onSelectionChange = (event, selectedFields) => {
    setSelectedState(selectedFields);
    const selectedIDs = new Set(
      Object.keys(selectedFields).filter((key) => selectedFields[key])
    );
    const selectedData = detailsList.filter(item => selectedIDs.has(item.prtThreadId));
    setParentCallback(selectedData);
  };

  const onHeaderSelectionChange = (event, selectedFields) => {
    const selectedIDs = new Set(
      Object.keys(selectedFields).filter((key) => selectedFields[key])
    );
    const selectedData = detailsList.filter(item => selectedIDs.has(item.prtThreadId));
    setParentCallback(selectedData);
    setSelectedState(selectedFields);
  };
  const tooltip = React.useMemo(()=>{
    const tooltipobject = {};
    for (const col of columns) {
        tooltipobject[col.field] = true;
    }
    return tooltipobject;

  },[])
    return(
        <DsUrlProvider dsURL={dsURL}>
          <div id='threadDetailsContainer' className='ul-fluid-container'>
            {abortRef && (
              <AbortTransactions
                ref={abortRef}
                hideIcon={true}
                abortThreadIds={abortThreadIds}
                abortFlagCallback={setAbortFlagCallback}
                emptyThreadIdsCallback={setThreadIdsEmptyCallback}
                OperationList={operationList}
              />
            )}
            <div id="threadDetailsTable" className='ul-row ul-pad-1x-y'>
                <EQULGrid   
                    id="threadName"
                    columns={columns}
                    data={detailsList ?? []}
                    selectableColumn={true}
                    gridConfig={dataConfig}
                    dataItemKey="prtThreadId"
                    onDataStateChange={onDataStateChange}
                    onSelectionChange={onSelectionChange}
                    onHeaderSelectionChange={onHeaderSelectionChange}
                    sortable={true}
                    selectedState={selectedState} 
                    className="fullheight-fullwidth"
                    spanColumnWidth={true}
                    tooltip={tooltip}
                    resizable={true}
                    searchByColumn={'all'}
                    searchPlaceholder={'Search'}
                    searchByColumnPlaceholder={'Search'}
                    placeholder={'Search'}
                    toolbarIcons={toolbarIcons}
                />
            </div>
        </div>
      </DsUrlProvider>
    );

};
ThreadDetailsTable.propTypes = {
    detailsList: PropTypes.array,
    setParentCallback: PropTypes.func,
    abortFlagforCheckbox: PropTypes.bool,
    dsURL: PropTypes.string,
    toolbarIcons: PropTypes.array,
    abortRef: PropTypes.object,
    abortThreadIds: PropTypes.array,
    setAbortFlagCallback: PropTypes.func,
    setThreadIdsEmptyCallback: PropTypes.func,
    operationList: PropTypes.array,
};

export default ThreadDetailsTable;
