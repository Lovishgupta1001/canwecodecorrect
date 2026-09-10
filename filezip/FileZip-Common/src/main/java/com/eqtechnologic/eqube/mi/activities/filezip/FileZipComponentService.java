package com.eqtechnologic.eqube.mi.activities.filezip;

import com.eqtechnologic.eqube.mi.activities.filezip.bean.FileZipInitialData;
import com.eqtechnologic.eqube.mi.activities.filezip.helper.FileZipActivityHelper;
import com.eqtechnologic.eqube.mi.activitymanagement.ActivityService;
import com.eqtechnologic.eqube.mi.activitymanagement.handlers.OutputHintHandler;
import com.eqtechnologic.eqube.mi.component.service.ComponentValidator;
import java.util.Map;
import com.eqtechnologic.eqube.soa.servicemanagement.annotations.Exported;
import org.springframework.stereotype.Service;
import com.google.auto.service.AutoService;
import com.eqtechnologic.eqube.mi.activities.filezip.bean.FileZipConfigBean;

@Exported
@Service("FileZip")
@AutoService(ActivityService.class)
public class FileZipComponentService implements ActivityService<FileZipInitialData, Map, FileZipConfigBean>, OutputHintHandler<Map> {

    @Override
    public Class<FileZipConfigBean> getComponentUIClass() {
        return FileZipConfigBean.class;
    }

    @Override
    public void destroy() {
        // no implementation
    }

    @Override
    public void initialize() {
        // no implementation
    }

    @Override
    public boolean isRunning() {
        return false;
    }

    @Override
    public void resume() {
        // no implementation
    }

    @Override
    public void suspend() {
        // no implementation
    }

    @Override
    public Class<Map> getComponentDataClass() {
        return Map.class;
    }

    @Override
    public String getComponentType() {
        return "FileZip";
    }

    @Override
    public FileZipInitialData getInitialInput() {
        FileZipInitialData fileZipInitialData = new FileZipInitialData();
        fileZipInitialData.setFileSystemConnCompInitialInput(FileZipActivityHelper.getInstance().getFileSystemConnService().getInitialInput());
        return fileZipInitialData;
    }

    @Override
    public ComponentValidator<Map, Map> getValidator() {
        return new FileZipValidator();
    }

    @Override
    public Object getOutputHints(Map configData, String outputID, Map keyDetails) {
        return FileZipActivityHelper.getInstance().getOutPutDetails(outputID);
    }
}
