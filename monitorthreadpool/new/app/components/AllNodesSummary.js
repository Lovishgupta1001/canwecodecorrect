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

    // Extract summary values safely from summaryData, allNodesData, or fallback defaults
    const combinedData = summaryData || (typeof allNodesData === "object" && !Array.isArray(allNodesData) ? allNodesData : {});
    const nodesArray = Array.isArray(allNodesData) ? allNodesData : [];

    const orchestratorNode = combinedData.jobOrchestratorNode || combinedData.orchestratorNode || combinedData.jobOrchestrator || nodesArray[0]?.serverName || nodesArray[0]?.nodeName || "-";
    const readyToRunTxns = combinedData.readyToRunTransactions ?? combinedData.readyToRunCount ?? combinedData.readyToRunTxns ?? 20;
    const availableThreadsPerNode = combinedData.availableThreadsPerNode ?? combinedData.availableThreads ?? nodesArray[0]?.currentPoolSize ?? nodesArray[0]?.availableThreads ?? 50;
    const maxThreadsPerTxn = combinedData.maxThreadsPerTransaction ?? combinedData.maxThreadsPerTxn ?? nodesArray[0]?.maxThreadCountPerTransaction ?? nodesArray[0]?.maxThreadsPerTransaction ?? 50;

    const nodeStatusCell = (props) => {
        const state = props.dataItem.serverState || props.dataItem.nodeStatus || "Running";
        const status = statusMap[state] || (state === "Running" ? "success" : "error");
        return (
            <td>
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <EQULIndicator
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

    // Safely derive node list array regardless of whether allNodesData is an Array, Object, or nested property
    const nodesList = React.useMemo(() => {
        if (!allNodesData) return [];
        if (Array.isArray(allNodesData)) return allNodesData;
        if (Array.isArray(allNodesData.nodeWiseDetails)) return allNodesData.nodeWiseDetails;
        if (Array.isArray(allNodesData.nodes)) return allNodesData.nodes;
        if (Array.isArray(allNodesData.allNodesSummary)) return allNodesData.allNodesSummary;
        if (Array.isArray(allNodesData.allNodesData)) return allNodesData.allNodesData;
        if (typeof allNodesData === "object") {
            return Object.values(allNodesData).filter((v) => v && typeof v === "object" && (v.serverName || v.nodeName || v.name));
        }
        return [];
    }, [allNodesData]);

    const gridData = React.useMemo(() => {
        return nodesList.map((node) => ({
            ...node,
            serverName: node.serverName || node.nodeName || node.name || "",
            serverState: node.serverState || node.nodeStatus || node.status || "Running",
            activeThreadCount: node.activeThreadCount ?? node.activeThreads ?? 0,
            runningTransactionCount: node.runningTransactionCount ?? node.currentRunningThreads ?? node.runningTransactions ?? 0,
            jobExecutorStatus: node.jobExecutorStatus || node.jobStatus || node.executorStatus || (node.serverState === "Running" ? "Running" : "Stopped"),
            stoppedReason: node.stoppedReason || node.failCause || node.reason || (node.serverState === "Running" ? "-" : "Node terminated"),
        }));
    }, [nodesList]);

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
    allNodesData: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    summaryData: PropTypes.object,
    surface: PropTypes.string,
};

export default AllNodesSummary;
