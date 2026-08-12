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

import com.eqtechnologic.eqube.mi.ui.activities.ActivitiesErrorCode;

@SuppressWarnings("java:S101")
public class eQWriteToOPCUAErrorCodes {

    private eQWriteToOPCUAErrorCodes() {
        // Private constructor
    }

    public static final ActivitiesErrorCode TRANSPORT_DOES_NOT_EXIST_ERROR =
            new ActivitiesErrorCode(900800,
                    "Transport associated with this WriteToOPCUA step does not exist.");

    public static final String TRANSPORT_DOES_NOT_EXIST =
            "transportDoesNotExist";

    public static final ActivitiesErrorCode ACTIVITY_OUTPUT_ERROR =
            new ActivitiesErrorCode(900801,
                    "Error occurred while generating activity output.");

    public static final String ACTIVITY_OUTPUT_NOT_GENERATED =
            "activityOutputError";
}
