import React from "react";
import { EQULTypo } from "@uilayer/typography";
import { useTrans } from "@uilayer/react-i18n";
import PropTypes from "prop-types";

/**
 * JobExecutorDetails displays key-value details for the Job Executor on a specific node without borders:
 * - Status: Running / Stopped
 * - Stopped Since (only shown when status is NOT Running)
 * - Stopped Reason (only shown when status is NOT Running)
 */
const JobExecutorDetails = function ({ jobDetails }) {
    const nls = useTrans(["mimonitorthreadpool"]);
    const rawStatus = jobDetails?.status || jobDetails?.jobExecutorStatus || jobDetails?.[0]?.status || jobDetails?.[0]?.jobStatus || "Running";
    const isRunning = String(rawStatus).toLowerCase() === "running";
    const status = isRunning ? "Running" : (rawStatus || "Stopped");

    const rawStoppedSince = jobDetails?.jobExecutorSince || jobDetails?.stoppedSince || jobDetails?.[0]?.stoppedSince || null;
    let stoppedSince = null;
    if (Array.isArray(rawStoppedSince) && rawStoppedSince.length >= 6) {
        stoppedSince = `${rawStoppedSince[0]}-${String(rawStoppedSince[1]).padStart(2, '0')}-${String(rawStoppedSince[2]).padStart(2, '0')} ${String(rawStoppedSince[3]).padStart(2, '0')}:${String(rawStoppedSince[4]).padStart(2, '0')}:${String(rawStoppedSince[5]).padStart(2, '0')}`;
    } else if (typeof rawStoppedSince === "string") {
        stoppedSince = rawStoppedSince;
    }

    const stoppedReason = jobDetails?.jobExecutorStopped || jobDetails?.stoppedReason || jobDetails?.failCause || jobDetails?.[0]?.stoppedReason || null;

    const labelPadClass = isRunning ? "" : "ul-pad-2x-b";

    return (
        <div>
            <div className="ul-pad-1x-y">
                <EQULTypo type="head" className="ul-header-xxxs-b">
                    {nls(["JobExecutorDetails.Title", "JobExecutorDetailsTitle", "JobExecutorDetails_Title"])}
                </EQULTypo>
            </div>
            <div className="ul-row ul-pad-2x-y">
                <div className="ul-col-sm-2">
                    <div className={labelPadClass}>
                        <EQULTypo type="body" size="medium" bold={true}>
                            {nls(["JobExecutorDetails.Status", "JobExecutorDetails_Status"])}
                        </EQULTypo>
                    </div>
                    {isRunning ? null : (
                        <>
                            <div className="ul-pad-2x-b">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls(["JobExecutorDetails.StoppedSince", "JobExecutorDetails_StoppedSince"])}
                                </EQULTypo>
                            </div>
                            <div>
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls(["JobExecutorDetails.StoppedReason", "JobExecutorDetails_StoppedReason"])}
                                </EQULTypo>
                            </div>
                        </>
                    )}
                </div>
                <div className="ul-col-sm-2">
                    <div className={labelPadClass}>
                        <EQULTypo type="body" size="medium">
                            {status}
                        </EQULTypo>
                    </div>
                    {isRunning ? null : (
                        <>
                            <div className="ul-pad-2x-b">
                                <EQULTypo type="body" size="medium">
                                    {stoppedSince || "-"}
                                </EQULTypo>
                            </div>
                            <div>
                                <EQULTypo type="body" size="medium">
                                    {stoppedReason || "-"}
                                </EQULTypo>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

JobExecutorDetails.propTypes = {
    jobDetails: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default JobExecutorDetails;
