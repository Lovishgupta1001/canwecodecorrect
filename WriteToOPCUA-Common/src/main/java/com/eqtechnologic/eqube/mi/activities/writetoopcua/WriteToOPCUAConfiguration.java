/**
 * Copyright (c) eQ Technologic (India) Pvt. Ltd.
 * All Rights Reserved.
 * <p>
 * This software is the confidential and proprietary information of eQTechnologic
 * ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into.
 */
package com.eqtechnologic.eqube.mi.activities.writetoopcua;

import com.eqtechnologic.eqube.soa.servicemanagement.annotationhandlers.exported.configuration.ExportedConfig;
import com.eqtechnologic.eqube.soa.servicemanagement.config.ServiceConfig;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import java.util.Collections;
import java.util.List;

/**
 * Configuration class for WriteToOPCUA activity.
 *
 * @author Lovish
 */
@ComponentScan
@Configuration
@Import({ExportedConfig.class})
public class WriteToOPCUAConfiguration implements ServiceConfig {

    @Override
    public List<Class<? extends ServiceConfig>> declareDependentModules() {
        return Collections.emptyList();
    }

    @Override
    public String owningApplication() {
        return "MI";
    }
}
