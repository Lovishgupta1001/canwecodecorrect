package com.eqtechnologic.eqube.mi.activities.filezip.bean;

import com.eqtechnologic.eqube.helperinterface.apis.util.beans.PluginSuccessBean;

public class DeleteFileErrorBean {
    private String filePath;
    private String fileStatus;

    public DeleteFileErrorBean(String filePath, String fileStatus) {
        this.filePath = filePath;
        this.fileStatus = fileStatus;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFileStatus() {
        return fileStatus;
    }

    public void setFileStatus(String fileStatus) {
        this.fileStatus = fileStatus;
    }

    public String toString() {
        return "DeleteFileErrorBean [filePath=" + this.filePath + ", fileStatus=" + this.fileStatus + "]";
    }

    public int hashCode() {
        byte var2 = 1;
        int var3 = 31 * var2 + (this.filePath == null ? 0 : this.filePath.hashCode());
        var3 = 31 * var3 + (this.fileStatus == null ? 0 : this.fileStatus.hashCode());
        return var3;
    }

    public boolean equals(Object var1) {
        if (this == var1) {
            return true;
        } else if (var1 == null) {
            return false;
        } else if (this.getClass() != var1.getClass()) {
            return false;
        } else {
            DeleteFileErrorBean var2 = (DeleteFileErrorBean) var1;
            if (this.filePath == null) {
                if (var2.filePath != null) {
                    return false;
                }
            } else if (!this.filePath.equals(var2.filePath)) {
                return false;
            }
            if (this.fileStatus == null) {
                if (var2.fileStatus != null) {
                    return false;
                }
            } else if (!this.fileStatus.equals(var2.fileStatus)) {
                return false;
            }
            return true;
        }
    }
}
