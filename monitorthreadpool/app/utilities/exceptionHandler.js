import { eQULNotify } from "@uilayer/notification";
import constants from "../constants/constants";

/**
 * Returns a default callback function to execute in case of exceptions.
 * Displays a UILayer notification with the error message based on error code.
 * @param {function} exceptionNLS - i18n translation function for exception codes
 * @param {string} defaultMessage - The default fallback message if exception from error code is not found
 * @returns {(function(*): (boolean))|*} - Error handler function which returns true if error is handled
 */
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
