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

import com.eqtechnologic.eqube.exception.BusinessException;
import com.eqtechnologic.eqube.logging.Logger;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.bean.TransportInfo;
import com.eqtechnologic.eqube.mi.activities.writetoopcua.constants.WriteToOPCUAConstants;
import com.eqtechnologic.eqube.platform.transport.client.beans.TransportClientBean;
import com.eqtechnologic.eqube.platform.transport.client.constants.TransportClientConstants;
import com.eqtechnologic.eqube.platform.transport.client.service.TransportClientService;
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Helper methods required for Write To OPC UA Component
 *
 * @author Lovish
 */
@Component
public class WriteToOPCUAComponentServiceHelper {

    private static final Logger LOGGER = Logger.getLogger(WriteToOPCUAComponentServiceHelper.class.getName());

    public List<TransportInfo> convertTransportClientToTransportInfoBeanList(String transportType, List<TransportClientBean> transportClientBeans) {
        if (transportClientBeans == null) {
            return new ArrayList<>();
        }
        return transportClientBeans.stream()
                .filter(clientBean -> clientBean != null && clientBean.getTransportType() != null && clientBean.getTransportType().equalsIgnoreCase(transportType))
                .map(transportClientBean -> {
                    TransportInfo transportInfo = new TransportInfo();
                    transportInfo.setTransportName(transportClientBean.getName());
                    transportInfo.setTransportId(transportClientBean.getTransportId());

                    if (WriteToOPCUAConstants.OPCUA_TYPE.equalsIgnoreCase(transportType)) {
                        // OPC UA specific transport details mapping
                    }
                    return transportInfo;
                })
                .collect(Collectors.toList());
    }

    public WriteToOPCUAComponentService getWriteToOPCUAService() {
        return ServiceRegistry.getInstance().getService(WriteToOPCUAConstants.WRITE_TO_OPCUA);
    }
}
