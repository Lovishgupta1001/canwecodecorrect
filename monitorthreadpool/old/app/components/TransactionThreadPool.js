import React from "react";

import {EQULTypo} from '@uilayer/typography';
import { EQULContainer } from '@uilayer/layout';
import {useTrans} from '@uilayer/react-i18n';
import PropTypes from "prop-types";
const TransactionThreadPool = function({stats}){
    const nls = useTrans(["mimonitorthreadpool"]);
    return(
        <div>
            <div className="ul-pad-1x-y">
                <EQULTypo type="head" className='ul-header-xxxs-b'>
                    {nls('TransactionsTabTitle')}
                </EQULTypo>
            </div>
            <EQULContainer type="primary" borderRadius={true}>
                <div className='ul-row ul-pad-2x'>
                    <div className="ul-col-sm-2">
                        <div className='ul-pad-3x-b'><EQULTypo type="body" size="medium" bold={true}>{nls("TransactionThreadPool.AvailableThreads")}</EQULTypo></div>
                        <div className='ul-pad-3x-b'><EQULTypo type="body" size="medium" bold={true}>{nls("TransactionThreadPool.ActiveThreads")}</EQULTypo></div>
                        <div className='ul-pad-3x-b'><EQULTypo type="body" size="medium" bold={true}>{nls("TransactionThreadPool.CurrentRunningTransactions")}</EQULTypo></div>
                        <div><EQULTypo type="body" size="medium" bold={true}>{nls("TransactionThreadPool.MaximumThreadsperTransaction")}</EQULTypo></div>
                    </div>
                    <div className="ul-col-sm-2">
                        <div className='ul-pad-3x-b'><EQULTypo type="body" size="medium" bold={true}>{stats?.[0]?.currentPoolSize ?? null}</EQULTypo></div>
                        <div className='ul-pad-3x-b'><EQULTypo type="body" size="medium" bold={true}>{stats?.[0]?.activeThreadCount ?? null}</EQULTypo></div>
                        <div className='ul-pad-3x-b'><EQULTypo type="body" size="medium" bold={true}>{stats?.[0]?.runningTransactionCount ?? null}</EQULTypo></div>
                        <div><EQULTypo type="body" size="medium" bold={true}>{stats?.[0]?.maxThreadCountPerTransaction ?? null}</EQULTypo></div>
                    </div>
                </div>
            </EQULContainer>
        </div>
    );
};

TransactionThreadPool.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      currentPoolSize: PropTypes.number,
      activeThreadCount: PropTypes.number,
      runningTransactionCount: PropTypes.number,
      maxThreadCountPerTransaction: PropTypes.number,
    })
  ),
};

export default TransactionThreadPool;
