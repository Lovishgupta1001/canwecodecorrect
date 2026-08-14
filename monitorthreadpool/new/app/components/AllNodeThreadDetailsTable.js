import React from "react";
import { EQULGrid, EQULGridFilterColumnMenu } from "@uilayer/grid";
import { EQULTypo } from "@uilayer/typography";
import { useTrans } from "@uilayer/react-i18n";
import constants from "../constants/constants";
import PropTypes from "prop-types";

const AllNodeThreadDetailsTable = function ({ allNodesThreadDetails }) {
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
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: constants.ThreaddetailsTableColumns.Field.priority,
            title: nls("ThreaddetailsTableColumns.Title.priority"),
        },
        {
            field: constants.ThreaddetailsTableColumns.Field.txnStartTime,
            title: nls("ThreaddetailsTableColumns.Title.txnStartTime"),
        },
        {
            field: constants.ThreaddetailsTableColumns.Field.fromTime,
            title: nls("ThreaddetailsTableColumns.Title.fromTime"),
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
        },
    ];

    const tooltip = React.useMemo(() => {
        const tooltipobject = {};
        for (const col of columns) {
            tooltipobject[col.field] = true;
        }
        return tooltipobject;
    }, []);

    return (
        <div className="ul-pad-1x-x ul-pad-1x-y">
            <div className="ul-pad-1x-b">
                <EQULTypo type="head" className="ul-header-xxxs-b">
                    {nls("AllNodeThreadDetailsTitle")}
                </EQULTypo>
            </div>
            <div id="allNodeThreadDetailsContainer" className="ul-fluid-container">
                <div id="allNodeThreadDetailsTable" className="ul-row ul-pad-1x-y">
                    <EQULGrid
                        id="allNodeThreadDetails"
                        columns={columns}
                        data={allNodesThreadDetails ?? []}

                        sortable={true}
                        className="fullheight-fullwidth"
                        spanColumnWidth={true}
                        tooltip={tooltip}
                        resizable={true}
                        searchByColumn={"all"}
                    />
                </div>
            </div>
        </div>
    );
};

AllNodeThreadDetailsTable.propTypes = {
    allNodesThreadDetails: PropTypes.array,
};

export default AllNodeThreadDetailsTable;
