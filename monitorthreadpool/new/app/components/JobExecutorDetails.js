import React from "react";
import { EQULTypo } from "@uilayer/typography";
import { EQULContainer } from "@uilayer/layout";
import { useTrans } from "@uilayer/react-i18n";
import PropTypes from "prop-types";

/**
 * JobExecutorDetails displays key-value details for the Job Executor on a specific node:
 * - Status: Running / Stopped
 * - Stopped Since (if stopped)
 * - Stopped Reason (if stopped)
 */
const JobExecutorDetails = function ({ jobDetails }) {
    const nls = useTrans(["mimonitorthreadpool"]);
    const status = jobDetails?.status || jobDetails?.[0]?.status || jobDetails?.[0]?.jobStatus || "Running";
    const stoppedSince = jobDetails?.stoppedSince || jobDetails?.[0]?.stoppedSince || null;
    const stoppedReason = jobDetails?.stoppedReason || jobDetails?.[0]?.stoppedReason || null;

    return (
        <div>
            <div className="ul-pad-1x-y">
                <EQULTypo type="head" className="ul-header-xxxs-b">
                    {nls(["JobExecutorDetails.Title", "JobExecutorDetailsTitle", "JobExecutorDetails_Title"])}
                </EQULTypo>
            </div>
            <EQULContainer type="primary" borderRadius={true}>
                <div className="ul-row ul-pad-2x">
                    <div className="ul-col-sm-2">
                        <div className={status !== "Running" ? "ul-pad-3x-b" : ""}>
                            <EQULTypo type="body" size="medium" bold={true}>
                                {nls(["JobExecutorDetails.Status", "JobExecutorDetails_Status"])}
                            </EQULTypo>
                        </div>
                        {status !== "Running" && (
                            <>
                                <div className="ul-pad-3x-b">
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
                        <div className={status !== "Running" ? "ul-pad-3x-b" : ""}>
                            <EQULTypo type="body" size="medium">
                                {status}
                            </EQULTypo>
                        </div>
                        {status !== "Running" && (
                            <>
                                <div className="ul-pad-3x-b">
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
            </EQULContainer>
        </div>
    );
};

JobExecutorDetails.propTypes = {
    jobDetails: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default JobExecutorDetails;
