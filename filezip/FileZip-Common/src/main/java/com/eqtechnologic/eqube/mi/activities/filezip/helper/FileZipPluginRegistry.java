/**
@(#)eQubeMI version 2025.02
Copyright (c) eQ Technologic (India) Pvt. Ltd.
All Rights Reserved.
This software is the confidential and proprietary information of eQTechnologic
("Confidential Information"). You shall not
disclose such Confidential Information and shall use it only in
accordance with the terms of the license agreement you entered into.
*/
package com.eqtechnologic.eqube.mi.activities.filezip.helper;

import java.util.Arrays;
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination;
import java.util.List;

/**
Registry for managing FileZip plugin definitions.
Author: Lovish
*/
public class FileZipPluginRegistry {
    // Private constructor to hide the implicit public one
    private FileZipPluginRegistry() {
        // Prevent instantiation
    }

    protected static final List<FileSystemPluginDefination> PLUGIN_TYPES = Arrays.asList(
        new FileSystemPluginDefination(
            "FileSystemPlugin",
            Arrays.asList(
                "com.eqtechnologic.eqube.filesystemplugin.FileSystemPlugin"
            ),
            Arrays.asList("File")
        ),
        new FileSystemPluginDefination(
            "TextFilePlugin",
            Arrays.asList(
                "com.eqtechnologic.eqube.textfileplugin.TextFilePlugin"
            ),
            Arrays.asList("File")
        )
    );

    public static List<FileSystemPluginDefination> getPluginTypes() {
        return PLUGIN_TYPES;
    }
}
