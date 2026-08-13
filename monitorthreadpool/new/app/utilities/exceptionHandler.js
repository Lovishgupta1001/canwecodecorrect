import { eQULNotify } from "@uilayer/notification";
import constants from "../constants/constants";

function getExceptionHandler(exceptionNLS, defaultMessage) {
    return (error) => {
        const errorCode = error.response && error.response.data.errorCode;
        let errorMessage;

        if (errorCode) {
            errorMessage = exceptionNLS([
                `exceptions.${errorCode}`,
                constants.ERROR_CODE_NOT_FOUND,
            ]);
            if (errorMessage === constants.ERROR_CODE_NOT_FOUND) {
                return false;
            }
        } else {
            errorMessage = defaultMessage
                ? defaultMessage
                : exceptionNLS("defaultMessage");
        }
        eQULNotify("error", errorMessage);
        return true;
    };
}

export { getExceptionHandler };
