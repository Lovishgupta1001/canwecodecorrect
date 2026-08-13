import React from "react";
import { EQULTypo } from "@uilayer/typography";
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
                    {nls("JobExecutorDetails.Title")}
                </EQULTypo>
            </div>
            <div className="ul-pad-2x-y">
                <div className="ul-row ul-pad-1x-b">
                    <div className="ul-col-sm-2">
                        <EQULTypo type="body" size="medium" bold={true}>
                            {nls("JobExecutorDetails.Status")}
                        </EQULTypo>
                    </div>
                    <div className="ul-col-sm-2">
                        <EQULTypo type="body" size="medium">
                            {status}
                        </EQULTypo>
                    </div>
                </div>

                {status !== "Running" && (
                    <>
                        <div className="ul-row ul-pad-1x-b">
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls("JobExecutorDetails.StoppedSince")}
                                </EQULTypo>
                            </div>
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium">
                                    {stoppedSince || "-"}
                                </EQULTypo>
                            </div>
                        </div>
                        <div className="ul-row ul-pad-1x-b">
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium" bold={true}>
                                    {nls("JobExecutorDetails.StoppedReason")}
                                </EQULTypo>
                            </div>
                            <div className="ul-col-sm-2">
                                <EQULTypo type="body" size="medium">
                                    {stoppedReason || "-"}
                                </EQULTypo>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

JobExecutorDetails.propTypes = {
    jobDetails: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default JobExecutorDetails;
