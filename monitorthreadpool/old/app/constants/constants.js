export default Object.freeze({
ThreaddetailsTableColumns:{
        Field:{
            threadName : "threadName",
            convId : "convId",
            txnId : "txnId",
            priority : "priority",
            txnStartTime : "txnStartTime",
            fromTime : "fromTime",
            formattedDuration : "formattedDuration",
            txnStatus : "txnStatus",
            oprStatus : "oprStatus",
            processName : "processName",
            stepName : "stepName",
            subStepName : "subStepName"
        },
    },
    PriorityColumns:{
        Field:{
            priority : "priority",
            activeThreads : "activeThreads",
            allocatedThreads : "allocatedThreads",
            waitingJobs : "waitingJobs"

        },
    },
    AbortTransactionsColumns:{
        Field:{
            transactionID : "transactionID",
            threadName : "threadName",
            status : "status",
            failCause : "failCause"

        }
    },
ERROR_CODE_NOT_FOUND: "ERROR_CODE_NOT_FOUND",
    EVENTS: {
        THREAD_POOL_USAGE:
            {
                TRANSACTION_THREAD_POOL: "TRANSACTION_THREAD_POOL",
                THREAD_DETAILS: "THREAD_DETAILS"
            },
    },
    THREAD_POOL_USAGE:
        {
            PAGE : {
                THREAD_DETAILS : "threadDetails"
            }
        }
    ,
    OPERATIONS: {
    MONITORTHREADPOOL_OPERATION: "Monitor Thread Pool",
        ABORT_THREAD: "Abort Transaction"
    },
    SERVER_STATE:{
        RUNNING:"Running",
        PAUSED:"Paused",
        PAUSED_INITIATED:"Paused Initiated",
        SUSPENDED:"Suspended",
        FAILED:"Failed"
    } 
});
