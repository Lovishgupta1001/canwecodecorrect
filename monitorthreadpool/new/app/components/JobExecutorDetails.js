import React from "react";
import { EQULGrid, EQULGridFilterColumnMenu } from "@uilayer/grid";
import { EQULTypo } from "@uilayer/typography";
import { useTrans } from "@uilayer/react-i18n";
import constants from "../constants/constants";
import PropTypes from "prop-types";

const JobExecutorDetails = function ({ jobDetails }) {
    const nls = useTrans(["mimonitorthreadpool"]);

    const columns = [
        {
            field: constants.JobExecutorColumns.Field.jobName,
            title: nls("JobExecutorColumns.Title.jobName"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: constants.JobExecutorColumns.Field.jobGroup,
            title: nls("JobExecutorColumns.Title.jobGroup"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: constants.JobExecutorColumns.Field.jobStatus,
            title: nls("JobExecutorColumns.Title.jobStatus"),
        },
        {
            field: constants.JobExecutorColumns.Field.nextFireTime,
            title: nls("JobExecutorColumns.Title.nextFireTime"),
        },
        {
            field: constants.JobExecutorColumns.Field.previousFireTime,
            title: nls("JobExecutorColumns.Title.previousFireTime"),
        },
        {
            field: constants.JobExecutorColumns.Field.triggerName,
            title: nls("JobExecutorColumns.Title.triggerName"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: constants.JobExecutorColumns.Field.triggerGroup,
            title: nls("JobExecutorColumns.Title.triggerGroup"),
            filter: "text",
            columnMenu: EQULGridFilterColumnMenu,
        },
        {
            field: constants.JobExecutorColumns.Field.triggerState,
            title: nls("JobExecutorColumns.Title.triggerState"),
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
                    {nls("JobExecutorDetailsTitle")}
                </EQULTypo>
            </div>
            <div id="jobExecutorDetailsContainer" className="ul-fluid-container">
                <div id="jobExecutorDetailsTable" className="ul-row ul-pad-1x-y">
                    <EQULGrid
                        id="jobExecutorDetails"
                        columns={columns}
                        data={jobDetails ? jobDetails : []}
                        sortable={true}
                        style={{ height: "100%", width: "100%" }}
                        spanColumnWidth={true}
                        tooltip={tooltip}
                        resizable={true}
                        searchByColumn={"all"}
                    />
                </div>
            </div>
        </div>
    );
};

JobExecutorDetails.propTypes = {
    jobDetails: PropTypes.array,
};

export default JobExecutorDetails;
