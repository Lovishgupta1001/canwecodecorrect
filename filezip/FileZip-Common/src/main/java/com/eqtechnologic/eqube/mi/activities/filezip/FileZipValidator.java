package com.eqtechnologic.eqube.mi.activities.filezip;

import com.eqtechnologic.eqube.commonui.components.eQError;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import com.eqtechnologic.eqube.mi.component.utility.ComponentUtility;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.eqtechnologic.eqube.mi.activities.filezip.FileZipConstants.*;

/**
 * Validator class for Formatted File Read Activity
 *
 * @author Devang Desale
 */
public class FileZipValidator implements ComponentValidator<Map, Map> {

    @Override
    public List<eQError> validate(Map configMap, Map mapDetail) {
        ComponentUtility componentUtility = ComponentUtility.getInstance();
        List<eQError> errors = new ArrayList<>();
        errors.addAll(componentUtility.prefixComponentToResourcePath(componentUtility.prefixComponentToResourcePath(validateConnectionForEmpty(configMap, FileZipConstants.SRC_CON, "FileZip.connectionNotEmptySrc"), SOURCE_FILE_CONNECTION), SOURCE));
        errors.addAll(componentUtility.prefixComponentToResourcePath(componentUtility.prefixComponentToResourcePath(validateConnectionForEmpty(configMap, FileZipConstants.DEST_CON, "FileZip.connectionNotEmptyDest"), DESTINATION_FILE_CONNECTION), DESTINATION));
        errors.addAll(componentUtility.prefixComponentToResourcePath(componentUtility.prefixComponentToResourcePath(validateArchiveNameNotEmpty(configMap), ACTIVITY), DESTINATION));
        errors.addAll(componentUtility.prefixComponentToResourcePath(componentUtility.prefixComponentToResourcePath(validateArchiveNameNotEmptyString(configMap), ACTIVITY), DESTINATION));
        return componentUtility.prefixComponentToResourcePath(errors, FILE_ZIP_SERVICE);
    }

    private List<eQError> validateConnectionForEmpty(Map<String, Object> map, String conComboId, String errorKey) {
        List<eQError> errors = new ArrayList<>();
        Object connection = map.get(conComboId);
        if (connection == null || ((String) connection).isEmpty()) {
            ComponentUtility componentUtility = ComponentUtility.getInstance();
            errors.add(new eQError(errorKey, "ComponentErr", conComboId, false));
        }
        return errors;
    }

    private List<eQError> validateArchiveNameNotEmpty(Map<String, Object> map) {
        List<eQError> errors = new ArrayList<>();
        String archiveName = (String) map.get(FileZipConstants.ARCHIVE_NAME);
        if (archiveName != null && archiveName.isEmpty()) {
            errors.add(new eQError("FileZip.emptyArchiveName", COMPONENT_ERROR_TYPE, FileZipConstants.ARCHIVE_NAME, false));
        }
        return errors;
    }

    private List<eQError> validateArchiveNameNotEmptyString(Map<String, Object> map) {
        List<eQError> errors = new ArrayList<>();
        String archiveName = (String) map.get(FileZipConstants.ARCHIVE_NAME);
        if (archiveName != null && archiveName.length() <= 11 && archiveName.contains("\"")) {
            errors.add(new eQError("FileZip.emptyStringArchiveName", COMPONENT_ERROR_TYPE, FileZipConstants.ARCHIVE_NAME, false));
        }
        return errors;
    }
}
