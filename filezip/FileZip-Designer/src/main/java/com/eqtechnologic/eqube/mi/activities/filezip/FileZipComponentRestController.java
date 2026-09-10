package com.eqtechnologic.eqube.mi.activities.filezip;

import com.eqtechnologic.eqube.mi.activities.filezip.helper.FileZipActivityHelper;
import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.mi.ui.MIOperation;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.Authorize;
import com.eqtechnologic.eqube.soa.methodauthorization.annotations.OperationNames;
import org.springframework.web.bind.annotation.*;
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.FileSystemPluginDefination;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/FileZip")
public class FileZipComponentRestController {

    @GetMapping(value = "/getFileSelectionColumns")
    public List<String> getFileSelectionColumns(@RequestParam("connId") Long connId) {
        List<String> operations = new ArrayList<>();
        operations.add(MIOperation.Process.LIST_PROCESS);
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS);
        checkMultipleOperations(operations);
        return FileZipActivityHelper.getInstance().getFileSelectionColumnList();
    }

    @GetMapping(value = "/getSupportedPluginType")
    public List<FileSystemPluginDefination> getSupportedPluginType() {
        List<String> operations = new ArrayList<>();
        operations.add(MIOperation.Process.LIST_PROCESS);
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS);
        checkMultipleOperations(operations);
        return FileZipActivityHelper.getInstance().getSupportedPluginType();
    }

    @PostMapping(value = "/getFileNamePattern")
    public String getFileNamePattern(@RequestBody List<String> fileNames, @RequestParam("connId") Long connId) throws BusinessException {
        List<String> operations = new ArrayList<>();
        operations.add(MIOperation.Process.LIST_PROCESS);
        operations.add(MIOperation.Transaction.LIST_TRANSACTIONS);
        checkMultipleOperations(operations);
        return FileZipActivityHelper.getInstance().getFileNamesPattern(fileNames);
    }

    @Authorize
    public void checkMultipleOperations(@OperationNames List<String> operations) {
        //implementation handled by @Authorize annotation
    }
}
