import React from "react";

import {EQULGrid} from '@uilayer/grid';
import {EQULTypo} from '@uilayer/typography';
import {useTrans} from '@uilayer/react-i18n';
import constants from '../constants/constants';
const PriorityWiseActiveThreadDistribution = function({stats}){
    const nls = useTrans(["mimonitorthreadpool"]);
    const columns = [
        {
          field: constants.PriorityColumns.Field.priority,
          title: nls("PriorityColumns.Title.priority"),
        },
        {
          field: constants.PriorityColumns.Field.activeThreads,
          title: nls("PriorityColumns.Title.activeThreads"),
        },
        {
          field: constants.PriorityColumns.Field.allocatedThreads,
          title: nls("PriorityColumns.Title.allocatedThreads"),
        },
      ];
    const Footer = () => {
        return(
        <div className="ul-fluid-container">
        <div className='ul-row priority-footer-total-container'>
            <div className="ul-col-sm-1 priority-footer-cell">
                {nls('PriorityFooterTotal')}
            </div>
            <div className="ul-col-sm-1 priority-footer-cell"> 
                {stats?stats[0].activeThreads+stats[1].activeThreads+stats[2].activeThreads:null}    
            </div>
            <div className="ul-col-sm-1 priority-footer-cell">
                {stats?stats[0].allocatedThreads+stats[1].allocatedThreads+stats[2].allocatedThreads:null}
            </div>
        </div>
        </div>
    );
    }
    const tooltip = React.useMemo(()=>{
        const tooltipobject = {};
        for (const col of columns) {
            tooltipobject[col.field] = true;
        }
        return tooltipobject;
   
      },[])

     
    const transformedStats = React.useMemo(() => {
        if (!stats) return [];
        return stats.map(s => ({
            ...s,
            priority: nls(`Priority${s.priority}`)
        }));
    }, [stats]);

    return(
        <div className="ul-pad-1x-x ul-pad-1x-y">
            <div className="ul-pad-1x-b">
            <EQULTypo type="head" className='ul-header-xxxs-b'>
                    {nls('PriorityTitle')}
            </EQULTypo>
            </div>
                <div id = "priority-table">
                    <EQULGrid
                        id="priority"
                        columns={columns}
                        data={transformedStats}
                        footer={true}
                        customFooter={<Footer />}
                        tooltip={tooltip}

                    />
                </div>           
        </div>
    );

};
export default PriorityWiseActiveThreadDistribution;
