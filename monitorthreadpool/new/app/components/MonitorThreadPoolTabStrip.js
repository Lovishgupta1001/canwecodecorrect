import React from "react";
import { EQULTypo } from "@uilayer/typography";
import { EQULTooltipOnIcon, EQULIcon } from "@uilayer/icons";
import { useTrans } from "@uilayer/react-i18n";
import { EQULNumericTextBox } from "@uilayer/inputs";
import { EQULDropDownList } from "@uilayer/dropdowns";
import {
    getThreadDetails,
    downloadThreadDump,
    getExecutionServerNames,
    getAllOperations,
    getDSURL,
    getAllNodesThreadDetails,
    getJobExecutorDetails,
} from "../service/MonitorThreadpoolService";
import { getExceptionHandler } from "../utilities/exceptionHandler";
import PriorityWiseActiveThreadDistribution from "./PriorityWiseActiveThreadDistribution";
import TransactionThreadPool from "./TransactionThreadPool";
import ThreadDetailsTable from "./ThreadDetailsTable";
import AbortTransactions from "./AbortTransactions";
import AllNodesSummary from "./AllNodesSummary";
import AllNodeThreadDetailsTable from "./AllNodeThreadDetailsTable";
import JobExecutorDetails from "./JobExecutorDetails";
import { eQULNotify } from "@uilayer/notification";
import { useEQULURLHashUpdator } from "@uilayer/utils";
import { EQULNoData } from "@uilayer/nodata";
import { EQULIndicator } from "@uilayer/indicators";
import PropTypes from "prop-types";
import constants from "../constants/constants";

function MonitorThreadPoolTabStrip(props) {
    const nls = useTrans("mimonitorthreadpool");
    const exceptionNLS = useTrans("monitorthreadpoolExceptions");
    const [time, setTime] = React.useState(30);
    const [data, setData] = React.useState(null);
    const [date, setDate] = React.useState(new Date().toLocaleString());
    const [threadIds, setThreadIds] = React.useState([]);
    const [abortFlag, setAbortFlag] = React.useState(false);
    const [dropdownData, setDropdownData] = React.useState([]);
    const [selectedNode, setSelectedNode] = React.useState(null);
    const [defaultItem, setDefaultItem] = React.useState(null);
    const [operationList, setOperationList] = React.useState([]);
    const [isCurrentNodeDown, setIsCurrentNodeDown] = React.useState(false);
    const [activeNodesCount, setActiveNodesCount] = React.useState(0);
    const [failedNodesCount, setFailedNodesCount] = React.useState(0);
    const [allNodesData, setAllNodesData] = React.useState(null);
    const [jobDetails, setJobDetails] = React.useState(null);
    const urlUpdator = useEQULURLHashUpdator();

    const statusMap = {
        [constants.SERVER_STATE.RUNNING]: "success",
        [constants.SERVER_STATE.FAILED]: "error",
        [constants.SERVER_STATE.PAUSED]: "inactive",
        [constants.SERVER_STATE.PAUSED_INITIATED]: "inactive",
        [constants.SERVER_STATE.SUSPENDED]: "suspended",
    };

    const [dsURL, setDsURL] = React.useState(null);

    const handleDropdownSelect = (e) => {
        setSelectedNode(e.value);
    };

    const getThreadDetailErrorHandler = (error) => {
        return getExceptionHandler(
            exceptionNLS,
            nls("errorMessages.dataFetchError")
        )(error);
    };

    const getThreadDetailsHandler = () => {
        getThreadDetails(
            selectedNode ? selectedNode.name : selectedNode,
            getThreadDetailErrorHandler
        ).then((response) => {
            setData(response.data);
            if (response.data?.[0]?.usageInfo) {
                setIsCurrentNodeDown(false);
            } else {
                setIsCurrentNodeDown(true);
                getExecutionServerNamesHandler();
            }
        });
        setDate(new Date().toLocaleString());
    };

    const getAllNodesThreadDetailsErrorHandler = (error) => {
        return getExceptionHandler(
            exceptionNLS,
            nls("errorMessages.dataFetchError")
        )(error);
    };

    const getAllNodesThreadDetailsHandler = () => {
        getAllNodesThreadDetails(getAllNodesThreadDetailsErrorHandler).then(
            (response) => {
                setAllNodesData(response.data);
            }
        );
    };

    const getJobExecutorDetailsErrorHandler = (error) => {
        return getExceptionHandler(
            exceptionNLS,
            nls("errorMessages.dataFetchError")
        )(error);
    };

    const getJobExecutorDetailsHandler = () => {
        getJobExecutorDetails(
            selectedNode ? selectedNode.name : selectedNode,
            getJobExecutorDetailsErrorHandler
        ).then((response) => {
            setJobDetails(response.data);
        });
    };

    const getExecutionServerNamesErrorHandler = (error) => {
        return getExceptionHandler(
            exceptionNLS,
            nls("errorMessages.downloadError")
        )(error);
    };

    const getExecutionServerNamesHandler = () => {
        return getExecutionServerNames(
            getExecutionServerNamesErrorHandler
        ).then((response) => {
            const serverNames = response.data.map((server) => ({
                name: server.serverName,
                id: server.sequenceNbr,
                status: server.serverState,
            }));
            if (defaultItem == null) {
                const defaultServer = {
                    name: response.data[0].serverName,
                    id: response.data[0].sequenceNbr,
                    status: response.data[0].serverState,
                };
                setDefaultItem(defaultServer);
                setSelectedNode(defaultServer);
            }
            setDropdownData(serverNames);
            const activeCount = serverNames.filter(
                (server) => server.status === constants.SERVER_STATE.RUNNING
            ).length;
            const pausedAndSuspended = serverNames.filter(
                (server) =>
                    server.status === constants.SERVER_STATE.PAUSED ||
                    server.status === constants.SERVER_STATE.PAUSED_INITIATED ||
                    server.status === constants.SERVER_STATE.SUSPENDED
            ).length;
            const failedCount =
                serverNames.length - activeCount - pausedAndSuspended;
            setActiveNodesCount(String(activeCount));
            setFailedNodesCount(String(failedCount));
            if (selectedNode) {
                setDropdownData(serverNames);
                const currentNode = serverNames.find(
                    (server) => server.name === selectedNode?.name
                );
                const isRunning =
                    currentNode?.status != constants.SERVER_STATE.FAILED;
                setIsCurrentNodeDown(!isRunning);
                return isRunning;
            }
        });
    };

    const itemRender = (li, itemProps) => {
        const { dataItem } = itemProps;
        const status = statusMap[dataItem.status];
        const content = (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                }}
            >
                <EQULIndicator
                    uiSurface={props.surface}
                    status={status}
                    text=""
                    statusTitle={dataItem.status}
                    typoSize="small"
                    indicatorSize="sm"
                />
                <span className={"ul-pad-sm-x"}>{dataItem.name}</span>
            </span>
        );
        return React.cloneElement(li, li.props, content);
    };

    const valueRender = (element, value) => {
        if (!value) {
            return element;
        }
        const content = (
            <span>
                <EQULIndicator
                    uiSurface={props.surface}
                    status={null}
                    text=""
                    statusTitle={null}
                    typoSize="small"
                    indicatorSize="sm"
                />
                <span className={"ul-pad-sm-x"}>{value.name}</span>
            </span>
        );
        return React.cloneElement(element, element.props, content);
    };

    React.useEffect(() => {
        getAllOperations((error) => {
            eQULNotify("error", error, { position: "top" });
            setOperationList([]);
        }).then((response) => {
            setOperationList(response.data.operations["eQube-MI"]);
        });
        getDSURL((error) => {
            eQULNotify("error", error, { position: "top" });
        }).then((response) => {
            setDsURL(response.data);
        });
        urlUpdator("monitorthreadpool");
    }, []);

    const downloadThreadDumpErrorHandler = (error) => {
        return getExceptionHandler(
            exceptionNLS,
            nls("errorMessages.fetchExceutionServerError")
        )(error);
    };

    const downloadThreadDumpHandler = () => {
        const serverId = selectedNode?.id;
        downloadThreadDump(downloadThreadDumpErrorHandler, serverId).then(
            (response) => {
                const generatedText = response.data;
                const decoder = new TextDecoder("utf-8");
                const decodedText = decoder.decode(generatedText);
                const decodedBase64Text = atob(
                    JSON.parse(decodedText)[serverId]
                );
                var blob = new Blob([decodedBase64Text], {
                    type: "text/plain",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                const contentDisposition =
                    response.headers["content-disposition"];
                let filename = `${data[2]} ThreadDump.txt`;

                if (contentDisposition) {
                    const regexGroups =
                        /filename="?([^";]+)"?/.exec(contentDisposition);
                    if (regexGroups && regexGroups[1]) {
                        filename = regexGroups[1];
                    }
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
            }
        );
    };

    const handleBlur = (event) => {
        const value = event.syntheticEvent.target.value;
        if (value === null || value === "" || parseInt(value) < 0) {
            eQULNotify(
                "error",
                nls("errorMessages.onlyPositiveNumbersAllowedError")
            );
            return;
        }
        setTime(parseInt(value));
    };

    React.useEffect(() => {
        getExecutionServerNamesHandler();
        getAllNodesThreadDetailsHandler();
        if (time > 0 && selectedNode != null) {
            getThreadDetailsHandler();
            getJobExecutorDetailsHandler();
            const intervalId = setInterval(() => {
                getExecutionServerNamesHandler().then((isRunning) => {
                    if (isRunning) {
                        getThreadDetailsHandler();
                        getJobExecutorDetailsHandler();
                    }
                });
                getAllNodesThreadDetailsHandler();
            }, time * 1000);
            return () => clearInterval(intervalId);
        } else {
            getThreadDetailsHandler();
        }
    }, [time, abortFlag, selectedNode]);

    const setThreadIdsCallback = (childData) => {
        setThreadIds(childData);
    };

    const setThreadIdsEmptyCallback = () => {
        setThreadIds([]);
    };

    const setAbortFlagCallback = (childData) => {
        setAbortFlag(childData);
    };

    const tooltipIconProps = {
        position: "bottom",
    };

    return (
        <div className="monitorthreadPool ul-pad-2x-t">
            <div className="ul-flex-col-container">
                <div className="ul-flex-col-container">
                    <EQULTypo
                        className="selectNode-label"
                        type="body"
                        size="m"
                    >
                        {nls("SelectNode")}
                    </EQULTypo>
                    <div className="ul-pad-1x-x">
                        <EQULDropDownList
                            id="dropdownlist"
                            data={dropdownData}
                            textField="name"
                            dataItemKey="id"
                            onChange={handleDropdownSelect}
                            defaultItem={defaultItem}
                            itemRender={itemRender}
                            valueRender={valueRender}
                        />
                    </div>
                    <div className="selectNode-label">
                        <EQULIndicator
                            status="error"
                            statusTitle={nls("failed")}
                            text={failedNodesCount}
                            indicatorSize="md"
                            className="ul-pad-sm-x"
                        />
                        <EQULIndicator
                            status="success"
                            statusTitle={nls("running")}
                            text={activeNodesCount}
                            indicatorSize="md"
                            className="ul-pad-sm-x"
                        />
                    </div>
                </div>

                <div id="toolbarRefresh" className="ul-flex-col-container">
                    <div>
                        <div className="ul-flex-col-container">
                            <EQULTypo
                                className="refresh-labels"
                                type="body"
                                size="m"
                            >
                                {nls("Last_Refresh")} {date}
                            </EQULTypo>
                            <div className="ul-pad-1x-x icons-padding">
                                <EQULTooltipOnIcon
                                    iconClass="eQ-icon eQ-fonts-refresh"
                                    onClick={() => {
                                        getExecutionServerNamesHandler().then(
                                            (isRunning) => {
                                                if (isRunning) {
                                                    getThreadDetailsHandler();
                                                    getJobExecutorDetailsHandler();
                                                }
                                            }
                                        );
                                        getAllNodesThreadDetailsHandler();
                                    }}
                                    type="action"
                                    size="xs"
                                    tooltipProps={tooltipIconProps}
                                    title={nls("Refresh_Title")}
                                />
                            </div>
                            <EQULTypo
                                className="refresh-labels"
                                type="body"
                                size="m"
                            >
                                {nls("Refresh_Time")}
                            </EQULTypo>
                            <div
                                className="dls-compact-component ul-pad-1x-x"
                                id="inputwidth"
                            >
                                <EQULNumericTextBox
                                    value={time}
                                    size="x-small"
                                    type="number"
                                    min="0"
                                    onBlur={(event) => {
                                        handleBlur(event);
                                    }}
                                    defaultValue="30"
                                />
                            </div>
                            <EQULTypo
                                className="refresh-labels"
                                type="body"
                                size="m"
                            >
                                {nls("Seconds")}
                            </EQULTypo>
                        </div>
                    </div>
                </div>
            </div>

            {isCurrentNodeDown ? (
                <div style={{ height: "90%" }}>
                    <EQULNoData
                        icon={"eQ-icon eQ-fonts-no-data"}
                        description={nls("NodeDown")}
                    />
                </div>
            ) : (
                <div className="fullheight">
                    <div className="ul-row ul-pad-2x-t">
                        <div className="ul-col-sm-2 fullheight">
                            <div>
                                <TransactionThreadPool stats={data} />
                            </div>
                        </div>
                        <div className="ul-col-sm-2 fullheight">
                            <div>
                                <PriorityWiseActiveThreadDistribution
                                    stats={data?.[0]?.priorityStats ?? null}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="fullheight ul-pad-2x-t">
                        <div className="ul-flex-col-container">
                            <EQULTypo
                                type="head"
                                className="ul-header-xxxs-b"
                            >
                                {nls("ThreadDetailsTabTitle")}
                            </EQULTypo>
                            <div
                                id="toolbarRefresh"
                                className="ul-flex-col-container"
                            >
                                <AbortTransactions
                                    abortThreadIds={threadIds}
                                    abortFlagCallback={setAbortFlagCallback}
                                    threadDetails={
                                        data?.[0]?.usageInfo ?? null
                                    }
                                    emptyThreadIdsCallback={
                                        setThreadIdsEmptyCallback
                                    }
                                    OperationList={operationList}
                                />
                                <div className="ul-pad-1x-x">
                                    <EQULTooltipOnIcon
                                        iconClass="eQ-icon eQ-fonts-download"
                                        type="action"
                                        size="xs"
                                        title={nls(
                                            "DownloadThreaddump_Title"
                                        )}
                                        onClick={downloadThreadDumpHandler}
                                        tooltipProps={tooltipIconProps}
                                    />
                                </div>
                            </div>
                        </div>
                        <ThreadDetailsTable
                            detailsList={data?.[0]?.usageInfo ?? null}
                            setParentCallback={setThreadIdsCallback}
                            abortFlagforCheckbox={abortFlag}
                            dsURL={dsURL}
                        />
                    </div>

                    <div className="fullheight ul-pad-2x-t">
                        <JobExecutorDetails jobDetails={jobDetails} />
                    </div>

                    <div className="fullheight ul-pad-2x-t">
                        <AllNodesSummary
                            allNodesData={allNodesData}
                            surface={props.surface}
                        />
                    </div>

                    <div className="fullheight ul-pad-2x-t">
                        <AllNodeThreadDetailsTable
                            allNodesThreadDetails={allNodesData}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

MonitorThreadPoolTabStrip.propTypes = {
    surface: PropTypes.string,
};

export default MonitorThreadPoolTabStrip;
