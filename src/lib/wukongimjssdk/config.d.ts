import { IProto } from "./proto";
import { Provider } from "./provider";
export declare class WKConfig {
    constructor();
    debug: boolean;
    addr: string;
    uid?: string;
    token?: string;
    protoVersion: number;
    deviceFlag: number;
    proto: IProto;
    heartbeatInterval: number;
    provider: Provider;
    receiptFlushInterval: number;
    sdkVersion: string;
    platform?: any;
    sendFrequency: number;
    sendCountOfEach: number;
    clientMsgDeviceId: number;
}
