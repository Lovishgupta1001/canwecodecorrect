package com.eqtechnologic.eqube.mi.activities.filezip.exception;

import com.eqtechnologic.eqube.exception.ExceptionType;

public enum FileZipExceptionType implements ExceptionType {
    FILE_FETCH_EXCEPTION;

    @Override
    public String getType() {
        return name();
    }
}
