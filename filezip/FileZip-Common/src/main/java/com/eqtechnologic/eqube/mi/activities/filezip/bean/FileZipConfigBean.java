/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.filezip.bean;

import com.eqtechnologic.eqube.commonui.components.filter.eQFilterInfo;
import com.eqtechnologic.eqube.mi.businessobjects.process.ActivityConfigBean;
import com.eqtechnologic.eqube.mi.component.annotations.ComponentData;
import com.eqtechnologic.eqube.mi.componentservices.exprbuilder.constants.ExpressionBuilderConstants;

/**
 * Configuration data bean for File zip activity
 *
 * @author Devang Desale
 */
public class FileZipConfigBean extends ActivityConfigBean {

    private String selectSourceConnection;
    private boolean isRecursive;
    private boolean preserveFolder;
    private boolean preserveParentFolder;
    private boolean deleteInputFiles;

    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, mandatory = false)
    private String relativePathDestEbl;

    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, mandatory = false)
    private String fileNamePattern;

    private String selectDestConnection;

    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, mandatory = false)
    private String relativePathSourceEbl;

    @ComponentData(componentName = ExpressionBuilderConstants.EXPRESSION_BUILDER_SERVICE, mandatory = false)
    private String archiveName;

    private String archiveType;
    private eQFilterInfo fileFilter;

    public FileZipConfigBean() {
        this.isRecursive = true;
        this.preserveFolder = true;
        this.deleteInputFiles = false;
        this.preserveParentFolder = true;
    }

    public String getSelectSourceConnection() {
        return selectSourceConnection;
    }

    public void setSelectSourceConnection(String selectSourceConnection) {
        this.selectSourceConnection = selectSourceConnection;
    }

    public boolean isIsRecursive() {
        return isRecursive;
    }

    public void setIsRecursive(boolean isRecursive) {
        this.isRecursive = isRecursive;
    }

    public boolean isPreserveFolder() {
        return preserveFolder;
    }

    public void setPreserveFolder(boolean preserveFolder) {
        this.preserveFolder = preserveFolder;
    }

    public boolean isPreserveParentFolder() {
        return preserveParentFolder;
    }

    public void setPreserveParentFolder(boolean preserveParentFolder) {
        this.preserveParentFolder = preserveParentFolder;
    }

    public boolean isdeleteInputFiles() {
        return deleteInputFiles;
    }

    public void setDeleteInputFiles(boolean deleteInputFiles) {
        this.deleteInputFiles = deleteInputFiles;
    }

    public String getRelativePathDestEbl() {
        return relativePathDestEbl;
    }

    public void setRelativePathDestEbl(String relativePathDestEbl) {
        this.relativePathDestEbl = relativePathDestEbl;
    }

    public String getArchiveName() {
        return archiveName;
    }

    public void setArchiveName(String archiveName) {
        this.archiveName = archiveName;
    }

    public String getArchiveType() {
        return archiveType;
    }

    public void setArchiveType(String archiveType) {
        this.archiveType = archiveType;
    }

    public String getFileNamePattern() {
        return fileNamePattern;
    }

    public void setFileNamePattern(String fileNamePattern) {
        this.fileNamePattern = fileNamePattern;
    }

    public String getSelectDestConnection() {
        return selectDestConnection;
    }

    public void setSelectDestConnection(String selectDestConnection) {
        this.selectDestConnection = selectDestConnection;
    }

    public String getRelativePathSourceEbl() {
        return relativePathSourceEbl;
    }

    public void setRelativePathSourceEbl(String relativePathSourceEbl) {
        this.relativePathSourceEbl = relativePathSourceEbl;
    }

    public eQFilterInfo getFileFilter() {
        // added for previous versions compatibility in case of filter without validation
        if (fileFilter != null && !fileFilter.isFilterWithoutValidation()) {
            fileFilter.setFilterWithoutValidation(true);
        }
        return fileFilter;
    }

    public void setFileFilter(eQFilterInfo fileFilter) {
        this.fileFilter = fileFilter;
    }

    @Override
    public String getActivityName() {
        return "FileZip";
    }
}
