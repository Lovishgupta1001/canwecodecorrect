import constants from '../constants/constants';
import {eQULNotify} from '@uilayer/notification';
import {useTrans} from '@uilayer/react-i18n';
export function updateURL(tab) {
    const event = (tab=='0')?constants.EVENTS.THREAD_POOL_USAGE.TRANSACTION_THREAD_POOL:constants.EVENTS.THREAD_POOL_USAGE.THREAD_DETAILS;

    if(window.EventBus) {
        window.EventBus.publish("UPDATE_URL", "updateUrlId", {
            "eventName": event,
        }, true, "eQube_Routing_Default");
    }
}




export function isValidOperation(opr, showNotifier,errorMsg,ValidOprList){
    if(ValidOprList.length && ValidOprList.includes(opr)){
        return true;
    }
    else if (showNotifier){
        eQULNotify('error', errorMsg);
    }
    return false;
}
