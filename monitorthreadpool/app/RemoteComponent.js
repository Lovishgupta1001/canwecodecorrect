import React from "react";
import snowflake from "../theme/snowflake.lazy.css";
import midnight from "../theme/midnight.lazy.css";
import layout from "../theme/layout.lazy.css";
import { useTheme } from "@uilayer/commons";
import MonitorThreadPoolTabStrip from "./components/MonitorThreadPoolTabStrip";
import { isValidOperation } from "./utilities/utilities";
import constants from "./constants/constants";
import { useTrans } from "@uilayer/react-i18n";

const RemoteComponent = (props) => {
    const nls = useTrans(["mimonitorthreadpool"]);
    useTheme({
        themes: {
            snowflake: snowflake,
            midnight: midnight,
        },
        layout: layout,
    });
    return isValidOperation(
        constants.OPERATIONS.MONITORTHREADPOOL_OPERATION,
        true,
        nls("errorMessages.UnauthorizedOperation"),
        props.Operations
    ) ? (
        <MonitorThreadPoolTabStrip externalProps={props} surface={props.surface} />
    ) : (
        <div></div>
    );
};

export default RemoteComponent;
