import React from "react";
import { GRID_COL_INDEX_ATTRIBUTE } from "@uilayer/grid";
import constants from "../constants/constants";
import { EQULTooltipOnIcon } from "@uilayer/icons";
import { useTrans } from "@uilayer/react-i18n";
import { useDsURL } from "../context/DsURLContext";

/**
 * @param props - Props passed to the GridCell
 * @param customCell - Custom cell jsx element
 * @returns {JSX.Element} - Returns the custom cell wrapped in <td> element with required props
 */
const getCustomCell = function (props, customCell) {
    return (
        <td
            colSpan={props.colSpan}
            role={"gridcell"}
            aria-colindex={props.ariaColumnIndex}
            aria-selected={props.isSelected}
            {...{
                [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
            }}
        >
            {customCell}
        </td>
    );
};

export const customSubStepCell = (props) => {
    const nls = useTrans("mimonitorthreadpool");
    const tooltipIconProps = {
        position: "bottom",
    };
    const redirectHandler = (poolInfo) => {
        window.poolInfo = poolInfo;
        window.location.hash = "monitorConnectionPool/PoolInfo";
    };
    const poolInfo = props.dataItem.poolInfo;
    const condition =
        (poolInfo.openConnectionsList &&
            poolInfo.openConnectionsList.length > 0) ||
        (poolInfo.pendingRequest && poolInfo.pendingRequest.trim() !== "");
    const subStepCell = (
        <div
            className="ul-flex-col-container overflowing-cell-content"
            title={
                props.dataItem[
                    constants.ThreaddetailsTableColumns.Field.subStepName
                ]
            }
        >
            <span className="overflowing-cell-content">
                {
                    props.dataItem[
                        constants.ThreaddetailsTableColumns.Field.subStepName
                    ]
                }
            </span>
            <span className="ul-pad-1x-x">
                {condition ? (
                    <EQULTooltipOnIcon
                        iconClass="eQ-icon eQ-fonts-goto redirect-to-Mon-Con-Pool"
                        onClick={() => redirectHandler(props.dataItem.poolInfo)}
                        type="action"
                        size="xs"
                        tooltipProps={tooltipIconProps}
                        title={nls("Go_to_Monitor_Connection_Pool")}
                    />
                ) : (
                    ""
                )}
            </span>
        </div>
    );
    return getCustomCell(props, subStepCell);
};

export const customTxnIdCell = (props) => {
    var dsURL = useDsURL();
    var txnId =
        props.dataItem[constants.ThreaddetailsTableColumns.Field.txnId];
    const pathName = `${dsURL}/DESIGNER#IDE/${txnId}`;

    const txnIdCell = (
        <div className="ul-flex-col-container overflowing-cell-content cell-link">
            <a
                className="overflowing-cell-content"
                href={pathName}
                target="_blank"
                rel="noopener noreferrer"
            >
                {" "}
                {txnId}{" "}
            </a>
        </div>
    );
    return getCustomCell(props, txnIdCell);
};
