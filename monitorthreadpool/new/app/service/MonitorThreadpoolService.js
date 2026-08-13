import { NetworkRequest } from "@uilayer/networking";
const networkInstance = NetworkRequest.getInstance("axios");

function getCustomErrorHandler(errorHandler) {
    return (error) => {
        const errorHandled = errorHandler(error);
        error.handled = errorHandled !== false;
    };
}

export async function downloadThreadDump(errorHandler, nodeId) {
    return networkInstance.get(
        "miMonitoring/miHealth/downloadThreadDumpByNode?nodeId=" + nodeId,
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
            responseType: "arraybuffer",
        }
    );
}

export async function getThreadDetails(executionServerName, errorHandler) {
    return networkInstance.get(
        "miMonitoring/miHealth/getThreadsAndQueuesData?executionServerName=" +
            executionServerName,
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}

export async function getAllOperations(errorHandler) {
    return networkInstance.get(
        "cacutility/commonAdminConsole/getAllOperations",
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}

export async function getExecutionServerNames(errorHandler) {
    return networkInstance.get(
        "miMonitoring/miHealth/getExecutionServerNames",
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}

export async function abortTransactions(isForceful, threadIds, errorHandler) {
    return networkInstance.post(
        "miMonitoring/transactionService/abortThread",
        {
            txnIdList: threadIds,
            abortAction: "" + isForceful,
            isForceful: isForceful,
        },
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}

export async function getDSURL(errorHandler) {
    return networkInstance.get(
        "miMonitoring/MiMonitoringService/fetchDSURL",
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}

export async function getAllNodesThreadDetails(errorHandler) {
    return networkInstance.get(
        "miMonitoring/miHealth/getAllNodesThreadsAndQueuesData",
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}

export async function getJobExecutorDetails(executionServerName, errorHandler) {
    return networkInstance.get(
        "miMonitoring/miHealth/getJobExecutorDetails?executionServerName=" +
            executionServerName,
        {
            customErrorHandler: getCustomErrorHandler(errorHandler),
        }
    );
}
