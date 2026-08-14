import React from 'react';
import PropTypes from 'prop-types';
import {abortTransactions} from '../service/MonitorThreadpoolService';
import {EQULTypo} from '@uilayer/typography';
import {EQULTooltipOnIcon} from '@uilayer/icons';
import {EQULWindow} from '@uilayer/dialogs';
import {eQULNotify} from '@uilayer/notification';
import {EQULRadioButton} from '@uilayer/inputs';
import {EQULGrid} from '@uilayer/grid';
import {useTrans} from '@uilayer/react-i18n';
import constants from '../constants/constants';
import {getExceptionHandler} from '../utilities/exceptionHandler';

const AbortTransactions = React.forwardRef(function AbortTransactions({abortThreadIds,OperationList,abortFlagCallback,emptyThreadIdsCallback, hideIcon}, ref) {
    const nls = useTrans("mimonitorthreadpool");
    const exceptionNLS = useTrans("monitorthreadpoolExceptions");
    const [visible, setVisible] = React.useState(false);
    const [visibleConfirmation,setVisibleConfirmation] = React.useState(false);
    const [abortCheckFailed,setAbortCheckFailed] = React.useState(false);
    const [systematic, setSystematic] = React.useState(true);
    const [forceful, setForceful] = React.useState(false);
    const [abortTransactionsEndpointResponse,setAbortTransactionsEndpointResponse] = React.useState(null);
    const [abortFlag,setAbortFlag] = React.useState(true);
    const toggleDialog = () => {
        if(OperationList && OperationList.includes(constants.OPERATIONS.ABORT_THREAD)){
            if(abortThreadIds.length == 0){
                eQULNotify('error',nls("AbortErrorNotifyMessage"));
            }
            else{
                setVisible(!visible);
            }
        }
        else{
            eQULNotify('error',nls("errorMessages.UnauthorizedOperation"));
        }                    
    };

    React.useImperativeHandle(ref, () => ({
        triggerAbort: toggleDialog
    }));

    const toggleDialogConfirmation = () => {
        setVisibleConfirmation(!visibleConfirmation);         
    }
    const abortTransactionsErrorHandler = (error) => {
        setAbortCheckFailed(true);
        return getExceptionHandler(exceptionNLS, nls('errorMessages.abortError'))(error);
    };
    const abortTransactionsHandler = (forceful,abortThreadIds) => {
        abortTransactions(forceful,abortThreadIds,abortTransactionsErrorHandler)
        .then((response)=>{
            var abortedTransactionsStatusArray = [];
            response.data.forEach(element => {
                abortedTransactionsStatusArray.push(
                    {
                        transactionID: element.transactionID,
                        threadName: element.threadName,
                        status: element.status,
                        failCause: element.failCause
                    }
                )
            });
            setAbortTransactionsEndpointResponse(abortedTransactionsStatusArray);
            emptyThreadIdsCallback();
            setVisibleConfirmation(true);
        })
    }

    const buttonArray = [
        {
            uiStyle:"primary",
            label:nls('AbortTransactions.ModalButtonArrayOk'),
            onClick: () => {
                abortTransactionsHandler(forceful,abortThreadIds);
                toggleDialog();
            }
        },
        {
            label:nls('AbortTransactions.ModalButtonArrayCancel'),
            onClick:toggleDialog
        }
    ];
    const confirmationButtonArray = [
        {
            uiStyle:"tertiary",
            label:nls('AbortTransactions.ConfirmationButtonArrayClose'),
            onClick: () => {
                toggleDialogConfirmation();
                setAbortFlag(!abortFlag);
                abortFlagCallback(abortFlag);
            }
        }
    ];
    const columns = [
        {
            field: constants.AbortTransactionsColumns.Field.transactionID,
            title: nls('AbortTransactionsColumns.Title.transactionID'),
        },
        {
            field: constants.AbortTransactionsColumns.Field.threadName,
            title: nls('AbortTransactionsColumns.Title.threadName')
        },
        {
            field: constants.AbortTransactionsColumns.Field.status,
            title: nls('AbortTransactionsColumns.Title.status')
        },
        {
            field: constants.AbortTransactionsColumns.Field.failCause,
            title: nls('AbortTransactionsColumns.Title.failCause')
        },
    ];
    const tooltipIconProps={
        position:"right"
    }
    return (
        <div className={hideIcon ? '' : 'ul-pad-1x-x'}>
            {!hideIcon && <EQULTooltipOnIcon iconClass='eQ-icon eQ-fonts-abort-without-border' type="action" size="xs" onClick={toggleDialog} title={nls("AbortTransactions_Title")} tooltipProps={tooltipIconProps}/>}
            {visible &&
                <EQULWindow 
                    modal={true}
                    buttons={buttonArray}
                    title={nls('AbortTransactions.ModalTitle')}
                    onClose={()=>{toggleDialog()}}
                    minimizeButton={'null'}
                    maximizeButton={'null'}
                    size={'small'}
                >
                    <div className='ul-pad-1x-x ul-pad-2x-y'><EQULTypo type='body' size='large'>{nls('AbortTransactions.ModalBody')}</EQULTypo></div>
                    <div className='ul-pad-1x-x ul-pad-2x-b ul-pad-1x-t ul-row abort-thread-modal-options-width'>
                        <div className='ul-col-sm-2'>
                            <EQULRadioButton checked={systematic} label={nls('AbortTransactions.ModalSystematicLabel')} onChange={(e) => {setSystematic(!systematic);setForceful(!forceful)}}/>
                        </div>
                        <div className='ul-col-sm-2'>
                            <EQULRadioButton checked={forceful} label={nls('AbortTransactions.ModalForcefulLabel')} onChange={(e) => {setSystematic(!systematic);setForceful(!forceful)}}/>
                        </div>
                    </div>
                </EQULWindow>}
            {!abortCheckFailed&& visibleConfirmation &&
                <EQULWindow 
                    modal={true}
                    buttons={confirmationButtonArray}
                    onClose={()=>{toggleDialogConfirmation();setAbortFlag(!abortFlag);abortFlagCallback(abortFlag);}}
                    minimizeButton={'null'}
                    title={systematic?nls('SystematicAbortConfirmation'):nls('ForcefulAbortConfirmation')}
                    size={'xlarge'}
                >
                    <div className='ul-pad-2x-y'>
                        <EQULGrid
                            columns={columns}
                            data={ abortTransactionsEndpointResponse? abortTransactionsEndpointResponse : [] }
                        />
                    </div>                   
                </EQULWindow>}
        </div>
    )
});

AbortTransactions.propTypes = {
    abortThreadIds: PropTypes.array.isRequired,
    OperationList: PropTypes.array,
    abortFlagCallback: PropTypes.func,
    emptyThreadIdsCallback: PropTypes.func,
    hideIcon: PropTypes.bool,
};

export default AbortTransactions;
