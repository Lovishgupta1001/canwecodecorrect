import React from "react";
import { EQULGrid, EQULGridFilterColumnMenu } from "@uilayer/grid";
import { EQULTypo } from "@uilayer/typography";
import { EQULIndicator } from "@uilayer/indicators";
import { useTrans } from "@uilayer/react-i18n";
import constants from "../constants/constants";
import PropTypes from "prop-types";

/**
 * AllNodesSummary component renders the "All Nodes" view:
 * 1. Summary section with 2 side-by-side columns (Job orchestrator node & Ready to run transactions on left, Available threads per node & Max threads per transaction on right)
 * 2. Node wise details grid mapping nodeExecutionStatusBeans from API response
 */
const statusMap = {
    [constants.SERVER_STATE.RUNNING]: "success",
    [constants.SERVER_STATE.FAILED]: "error",
    [constants.SERVER_STATE.PAUSED]: "inactive",
    [constants.SERVER_STATE.PAUSED_INITIATED]: "inactive",
    [constants.SERVER_STATE.SUSPENDED]: "suspended",
};

const getNodeStatus = (state) => {
    const stateStr = String(state).toLowerCase();
    if (statusMap[state]) return statusMap[state];
    return stateStr === "running" ? "success" : "error";
};

const NodeStatusCell = (props) => {
    const { dataItem } = props;
    const state = dataItem?.serverState || dataItem?.nodeStatus || "Running";
    const status = getNodeStatus(state);
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

NodeStatusCell.propTypes = {
    dataItem: PropTypes.shape({
        serverState: PropTypes.string,
        nodeStatus: PropTypes.string,
    }),
};

/**
 * AllNodesSummary component renders the "All Nodes" view:
 * 1. Summary section with 2 side-by-side columns (Job orchestrator node & Ready to run transactions on left, Available threads per node & Max threads per transaction on right)
 * 2. Node wise details grid mapping nodeExecutionStatusBeans from API response
 */
const AllNodesSummary = function ({ allNodesData, summaryData, surface }) {
    const nls = useTrans(["mimonitorthreadpool"]);

    // Extract summary values safely from summaryData, allNodesData, or fallback defaults
    let combinedData = {};
    if (summaryData && typeof summaryData === "object") {
        combinedData = summaryData;
    } else if (allNodesData && typeof allNodesData === "object" && !Array.isArray(allNodesData)) {
        combinedData = allNodesData;
    }

    const nodesArray = Array.isArray(allNodesData) ? allNodesData : [];

    const orchestratorNode = combinedData?.jobOrchestratorNodes || combinedData?.jobOrchestratorNode || combinedData?.orchestratorNode || combinedData?.jobOrchestrator || nodesArray[0]?.serverName || nodesArray[0]?.nodeName || "-";
    const orchestratorStatus = combinedData?.jobOrchestratorNodesStatus || "Running";
    const readyToRunTxns = combinedData?.readyToRunTransaction ?? combinedData?.readyToRunTransactions ?? combinedData?.readyToRunCount ?? combinedData?.readyToRunTxns ?? 20;
    const availableThreadsPerNode = combinedData?.availableThreadsPerNode ?? combinedData?.availableThreads ?? nodesArray[0]?.currentPoolSize ?? nodesArray[0]?.availableThreads ?? 50;
    const maxThreadsPerTxn = combinedData?.maxThreadsPerTransaction ?? combinedData?.maxThreadCountPerTransaction ?? combinedData?.maxThreadsPerTxn ?? nodesArray[0]?.maxThreadCountPerTransaction ?? nodesArray[0]?.maxThreadsPerTransaction ?? 50;

    // Green icon for Running / Active; Red icon for Failed status
    const isOrchestratorRunning = String(orchestratorStatus).toLowerCase() === "running" || String(orchestratorStatus).toLowerCase() === "active";
    const orchestratorIndicatorStatus = isOrchestratorRunning ? "success" : "error";

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
            cell: NodeStatusCell,
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: "activeThreadsCount",
            title: nls("NodeWiseDetailsColumns.Title.activeThreads"),
        },
        {
            field: "runningJobsCount",
            title: nls("NodeWiseDetailsColumns.Title.currentRunningThreads"),
        },
        {
            field: "schedulingState",
            title: nls("NodeWiseDetailsColumns.Title.jobExecutorStatus"),
        },
        {
            field: "schedulingStateReason",
            title: nls("NodeWiseDetailsColumns.Title.stoppedReason"),
            hidden: true,
        },
        {
            field: "stoppedSince",
            title: nls("NodeWiseDetailsColumns.Title.stoppedSince"),
            hidden: true,
        },
    ];

    const tooltip = React.useMemo(() => {
        const tooltipobject = {};
        for (const col of columns) {
            tooltipobject[col.field] = true;
        }
        return tooltipobject;
    }, []);

    // Safely derive node list array from nodeExecutionStatusBeans or fallbacks
    const nodesList = React.useMemo(() => {
        if (!allNodesData) return [];
        if (Array.isArray(allNodesData)) return allNodesData;
        if (Array.isArray(allNodesData.nodeExecutionStatusBeans)) return allNodesData.nodeExecutionStatusBeans;
        if (Array.isArray(allNodesData.nodeWiseDetails)) return allNodesData.nodeWiseDetails;
        if (Array.isArray(allNodesData.nodes)) return allNodesData.nodes;
        if (Array.isArray(allNodesData.allNodesSummary)) return allNodesData.allNodesSummary;
        if (typeof allNodesData === "object" && allNodesData !== null) {
            return Object.values(allNodesData).filter((v) => v && typeof v === "object" && (v.serverName || v.nodeName || v.name));
        }
        return [];
    }, [allNodesData]);

    const gridData = React.useMemo(() => {
        return nodesList.map((node) => {
            const stateStr = String(node?.serverState).toLowerCase();
            const isNodeRunning = stateStr === "running";
            const schedulingState = node?.schedulingState || node?.jobExecutorStatus || node?.jobStatus || (isNodeRunning ? "Running" : "Stopped");
            const schedulingStateReason = node?.schedulingStateReason || node?.stoppedReason || node?.failCause || (isNodeRunning ? "-" : "Node terminated");
            return {
                ...node,
                serverName: node?.serverName || node?.nodeName || node?.name || "",
                serverState: node?.serverState || node?.nodeStatus || node?.status || "Running",
                activeThreadsCount: node?.activeThreadsCount ?? node?.activeThreadCount ?? node?.activeThreads ?? 0,
                runningJobsCount: node?.runningJobsCount ?? node?.runningTransactionCount ?? node?.currentRunningThreads ?? 0,
                schedulingState,
                schedulingStateReason,
                stoppedSince: node?.stoppedSince || node?.stoppedTime || "-",
            };
        });
    }, [nodesList]);

    return (
        <div className="ul-fluid-container ul-pad-1x-y">
            {/* Top Summary Section */}
            <div className="ul-pad-2x-b">
                <EQULTypo type="head" className="ul-header-xxxs-b">
                    {nls("Summary")}
                </EQULTypo>
                <div className="ul-pad-2x-y" style={{ display: "flex", flexWrap: "wrap" }}>
                    {/* Left Column */}
                    <div style={{ flex: "0 0 45%", maxWidth: "45%", paddingRight: "30px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <EQULTypo type="body" size="medium" bold={true}>
                                {nls("JobOrchestratorNode")}
                            </EQULTypo>
                            <div style={{ display: "inline-flex", alignItems: "center" }}>
                                <EQULIndicator
                                    status={orchestratorIndicatorStatus}
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <EQULTypo type="body" size="medium" bold={true}>
                                {nls("ReadyToRunTransactions")}
                            </EQULTypo>
                            <EQULTypo type="body" size="medium">
                                {readyToRunTxns}
                            </EQULTypo>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ flex: "0 0 45%", maxWidth: "45%", paddingLeft: "30px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <EQULTypo type="body" size="medium" bold={true}>
                                {nls("AvailableThreadsPerNode")}
                            </EQULTypo>
                            <EQULTypo type="body" size="medium">
                                {availableThreadsPerNode}
                            </EQULTypo>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <EQULTypo type="body" size="medium" bold={true}>
                                {nls("MaxThreadsPerTransaction")}
                            </EQULTypo>
                            <EQULTypo type="body" size="medium">
                                {maxThreadsPerTxn}
                            </EQULTypo>
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
                        showHideColumns={true}
                        persistentColumns={["serverName", "serverState", "activeThreadsCount", "runningJobsCount", "schedulingState"]}
                        tooltip={tooltip}
                        resizable={true}
                        searchByColumn={"all"}
                        searchPlaceholder={"Search"}
                        searchByColumnPlaceholder={"Search"}
                        placeholder={"Search"}
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

const nodeStatusCellPropTypes = {
    dataItem: PropTypes.shape({
        serverState: PropTypes.string,
        nodeStatus: PropTypes.string,
    }),
};


export default AllNodesSummary;
