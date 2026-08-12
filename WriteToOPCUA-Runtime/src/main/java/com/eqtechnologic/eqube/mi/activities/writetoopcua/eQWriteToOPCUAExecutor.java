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

import java.util.Map;

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.logging.transaction.annotation.LogModuleName;
import com.eqtechnologic.eqube.mi.common.mierror.eQMIException;
import com.eqtechnologic.eqube.mi.process.context.eQActivityState;
import com.eqtechnologic.eqube.mi.process.definition.activity.eQActivityExecutor;

/**
 * Executor for Write To OPC UA activity
 *
 * @author Lovish
 */
@LogModuleName(moduleName = "Activity")
@SuppressWarnings("java:S101")
public class eQWriteToOPCUAExecutor extends eQActivityExecutor {

    private static final Logger LOGGER;

    static {
        LOGGER = Logger.getLogger(eQWriteToOPCUAExecutor.class.getName());
    }

    public eQWriteToOPCUAExecutor() {
        super();
    }

    @Override
    public Object execute(Object configData,
                          eQActivityState activityState,
                          Map<String, String> outPutMap)
            throws eQMIException, BusinessException {

        LOGGER.info("Executing WriteToOPCUA activity");

        return null;
    }
}
