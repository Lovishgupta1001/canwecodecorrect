import React from "react";
import { EQULGrid, EQULGridFilterColumnMenu } from "@uilayer/grid";
import { EQULTypo } from "@uilayer/typography";
import { EQULIndicator } from "@uilayer/indicators";
import { useTrans } from "@uilayer/react-i18n";
import constants from "../constants/constants";
import PropTypes from "prop-types";

/**
 * AllNodesSummary component renders the "All Nodes" view:
 * 1. Summary section (Job orchestrator node, Ready to run transactions, Available threads per node, Max threads per transaction)
 * 2. Node wise details grid (Node Name, Node Status, Active threads, Current running threads, Job Executor status, Stopped reason)
 */
const AllNodesSummary = function ({ allNodesData, summaryData, surface }) {
    const nls = useTrans(["mimonitorthreadpool"]);

    const statusMap = {
        [constants.SERVER_STATE.RUNNING]: "success",
        [constants.SERVER_STATE.FAILED]: "error",
        [constants.SERVER_STATE.PAUSED]: "inactive",
        [constants.SERVER_STATE.PAUSED_INITIATED]: "inactive",
        [constants.SERVER_STATE.SUSPENDED]: "suspended",
    };

    const orchestratorNode = summaryData?.jobOrchestratorNode || summaryData?.orchestratorNode || summaryData?.jobOrchestrator || allNodesData?.[0]?.serverName || allNodesData?.[0]?.nodeName || "-";
    const readyToRunTxns = summaryData?.readyToRunTransactions ?? summaryData?.readyToRunCount ?? summaryData?.readyToRunTxns ?? 20;
    const availableThreadsPerNode = summaryData?.availableThreadsPerNode ?? summaryData?.availableThreads ?? allNodesData?.[0]?.currentPoolSize ?? allNodesData?.[0]?.availableThreads ?? 50;
    const maxThreadsPerTxn = summaryData?.maxThreadsPerTransaction ?? summaryData?.maxThreadsPerTxn ?? allNodesData?.[0]?.maxThreadCountPerTransaction ?? allNodesData?.[0]?.maxThreadsPerTransaction ?? 50;

    const nodeStatusCell = (props) => {
        const state = props.dataItem.serverState || props.dataItem.nodeStatus || "Running";
        const status = statusMap[state] || (state === "Running" ? "success" : "error");
        return (
            <td>
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <EQULIndicator
                        uiSurface={surface}
                        status={status}
                        text=""
                        statusTitle={state}
                        typoSize="small"
                        indicatorSize="sm"
                    />
                    <span className="ul-pad-sm-x">{state}</span>
                </span>
            </td>
        );
    };

    const columns = [
        {
            field: "serverName",
            title: nls("NodeWiseDetailsColumns.Title.nodeName"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: "serverState",
            title: nls("NodeWiseDetailsColumns.Title.nodeStatus"),
            cell: nodeStatusCell,
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: "activeThreadCount",
            title: nls("NodeWiseDetailsColumns.Title.activeThreads"),
        },
        {
            field: "runningTransactionCount",
            title: nls("NodeWiseDetailsColumns.Title.currentRunningThreads"),
        },
        {
            field: "jobExecutorStatus",
            title: nls("NodeWiseDetailsColumns.Title.jobExecutorStatus"),
        },
        {
            field: "stoppedReason",
            title: nls("NodeWiseDetailsColumns.Title.stoppedReason"),
        },
    ];

    const tooltip = React.useMemo(() => {
        const tooltipobject = {};
        for (const col of columns) {
            tooltipobject[col.field] = true;
        }
        return tooltipobject;
    }, []);

    const gridData = React.useMemo(() => {
        if (!allNodesData) return [];
        return allNodesData.map((node) => ({
            ...node,
            serverName: node.serverName || node.nodeName || node.name || "",
            serverState: node.serverState || node.nodeStatus || node.status || "Running",
            activeThreadCount: node.activeThreadCount ?? node.activeThreads ?? 0,
            runningTransactionCount: node.runningTransactionCount ?? node.currentRunningThreads ?? node.runningTransactions ?? 0,
            jobExecutorStatus: node.jobExecutorStatus || node.jobStatus || node.executorStatus || (node.serverState === "Running" ? "Running" : "Stopped"),
            stoppedReason: node.stoppedReason || node.failCause || node.reason || (node.serverState === "Running" ? "-" : "Node terminated"),
        }));
    }, [allNodesData]);

    return (
        <div className="ul-fluid-container ul-pad-1x-y">
            {/* Top Summary Section */}
            <div className="ul-pad-2x-b">
                <EQULTypo type="head" className="ul-header-xxxs-b">
                    {nls("Summary")}
                </EQULTypo>
                <div className="ul-row ul-pad-2x-y">
                    <div className="ul-col-sm-3">
                        <div className="ul-row ul-pad-1x-b">
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls("JobOrchestratorNode")}
                                </EQULTypo>
                            </div>
                            <div className="ul-col-sm-2" style={{ display: "inline-flex", alignItems: "center" }}>
                                <EQULIndicator
                                    uiSurface={surface}
                                    status="success"
                                    text=""
                                    indicatorSize="sm"
                                />
                                <span className="ul-pad-sm-x">
                                    <EQULTypo type="body" size="medium">
                                        {orchestratorNode}
                                    </EQULTypo>
                                </span>
                            </div>
                        </div>
                        <div className="ul-row">
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls("ReadyToRunTransactions")}
                                </EQULTypo>
                            </div>
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium">
                                    {readyToRunTxns}
                                </EQULTypo>
                            </div>
                        </div>
                    </div>

                    <div className="ul-col-sm-3">
                        <div className="ul-row ul-pad-1x-b">
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls("AvailableThreadsPerNode")}
                                </EQULTypo>
                            </div>
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium">
                                    {availableThreadsPerNode}
                                </EQULTypo>
                            </div>
                        </div>
                        <div className="ul-row">
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls("MaxThreadsPerTransaction")}
                                </EQULTypo>
                            </div>
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium">
                                    {maxThreadsPerTxn}
                                </EQULTypo>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Node wise details Section */}
            <div className="ul-pad-2x-t">
                <div className="ul-pad-1x-b">
                    <EQULTypo type="head" className="ul-header-xxxs-b">
                        {nls("NodeWiseDetailsTitle")}
                    </EQULTypo>
                </div>
                <div id="nodeWiseDetailsTable">
                    <EQULGrid
                        id="nodeWiseDetails"
                        columns={columns}
                        data={gridData}
                        sortable={true}
                        tooltip={tooltip}
                        resizable={true}
                        searchByColumn={"all"}
                    />
                </div>
            </div>
        </div>
    );
};

AllNodesSummary.propTypes = {
    allNodesData: PropTypes.array,
    summaryData: PropTypes.object,
    surface: PropTypes.string,
};

export default AllNodesSummary;
