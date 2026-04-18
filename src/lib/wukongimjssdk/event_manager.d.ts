import { EventPacket } from "./proto";
export declare type WKEventListener = ((event: WKEvent) => void);
export declare class WKEventManager {
    eventListeners: WKEventListener[];
    private static instance;
    static shared(): WKEventManager;
    addEventListener(listener: WKEventListener): void;
    removeEventListener(listener: WKEventListener): void;
    notifyEventListeners(event: WKEvent): void;
}
export declare class WKEvent extends EventPacket {
    dataJson?: any;
    constructor(packet: EventPacket);
}
