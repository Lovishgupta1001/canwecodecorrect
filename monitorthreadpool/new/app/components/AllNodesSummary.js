import React from "react";
import { EQULGrid, EQULGridFilterColumnMenu } from "@uilayer/grid";
import { EQULTypo } from "@uilayer/typography";
import { EQULIndicator } from "@uilayer/indicators";
import { useTrans } from "@uilayer/react-i18n";
import constants from "../constants/constants";
import PropTypes from "prop-types";

const AllNodesSummary = function ({ allNodesData, surface }) {
    const nls = useTrans(["mimonitorthreadpool"]);

    const statusMap = {
        [constants.SERVER_STATE.RUNNING]: "success",
        [constants.SERVER_STATE.FAILED]: "error",
        [constants.SERVER_STATE.PAUSED]: "inactive",
        [constants.SERVER_STATE.PAUSED_INITIATED]: "inactive",
        [constants.SERVER_STATE.SUSPENDED]: "suspended",
    };

    const serverStateCell = (props) => {
        const state = props.dataItem[constants.AllNodesSummaryColumns.Field.serverState];
        const status = statusMap[state] || null;
        return (
            <td>
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <EQULIndicator
                        uiSurface={surface}
                        status={status}
                        text={state}
                        statusTitle={state}
                        typoSize="small"
                        indicatorSize="sm"
                    />
                </span>
            </td>
        );
    };

    const columns = [
        {
            field: constants.AllNodesSummaryColumns.Field.serverName,
            title: nls("AllNodesSummaryColumns.Title.serverName"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: constants.AllNodesSummaryColumns.Field.serverState,
            title: nls("AllNodesSummaryColumns.Title.serverState"),
            cell: serverStateCell,
        },
        {
            field: constants.AllNodesSummaryColumns.Field.currentPoolSize,
            title: nls("AllNodesSummaryColumns.Title.currentPoolSize"),
        },
        {
            field: constants.AllNodesSummaryColumns.Field.activeThreadCount,
            title: nls("AllNodesSummaryColumns.Title.activeThreadCount"),
        },
        {
            field: constants.AllNodesSummaryColumns.Field.runningTransactionCount,
            title: nls("AllNodesSummaryColumns.Title.runningTransactionCount"),
        },
        {
            field: constants.AllNodesSummaryColumns.Field.maxThreadCountPerTransaction,
            title: nls("AllNodesSummaryColumns.Title.maxThreadCountPerTransaction"),
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
                    {nls("AllNodesSummaryTitle")}
                </EQULTypo>
            </div>
            <div id="allNodesSummaryTable">
                <EQULGrid
                    id="allNodesSummary"
                    columns={columns}
                    data={allNodesData ? allNodesData : []}
                    sortable={true}
                    tooltip={tooltip}
                    resizable={true}
                    searchByColumn={"all"}
                />
            </div>
        </div>
    );
};

AllNodesSummary.propTypes = {
    allNodesData: PropTypes.arrayOf(
        PropTypes.shape({
            serverName: PropTypes.string,
            serverState: PropTypes.string,
            currentPoolSize: PropTypes.number,
            activeThreadCount: PropTypes.number,
            runningTransactionCount: PropTypes.number,
            maxThreadCountPerTransaction: PropTypes.number,
        })
    ),
    surface: PropTypes.string,
};

export default AllNodesSummary;
