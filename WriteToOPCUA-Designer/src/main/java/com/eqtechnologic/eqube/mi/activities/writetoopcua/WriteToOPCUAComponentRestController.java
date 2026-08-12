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

import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

/**
 * Rest controller for Write To OPC UA activity.
 *
 * @author Lovish
 */
@RestController
@RequestMapping("/writetoopcua")
public class WriteToOPCUAComponentRestController {

    @GetMapping("/fetchOPCUATransportList")
    public List<TransportInfo> fetchOPCUATransportList() {
        return Collections.emptyList();
    }
}
