package com.eqtechnologic.eqube.mi.activities.filezip;

import com.eqtechnologic.eqube.soa.servicemanagement.annotationhandlers.exported.configuration.ExportedConfig;
import com.eqtechnologic.eqube.soa.servicemanagement.config.ServiceConfig;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import com.eqtechnologic.eqube.soa.servicemanagement.util.DispatcherServletConfiguration;
import java.util.List;

@ComponentScan
@Configuration
@Import({ExportedConfig.class})
public class FileZipConfiguration implements ServiceConfig {

    @Override
    public List<Class<? extends ServiceConfig>> declareDependentModules() {
        return null;
    }

    @Override
    public String owningApplication() {
        return "MI";
    }
}
