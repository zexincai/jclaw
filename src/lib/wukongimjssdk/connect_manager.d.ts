import { ConnackPacket, IProto, Packet, RecvPacket, SendPacket } from "./proto";
import { WKWebsocket } from "./websocket";
export declare enum ConnectStatus {
    Disconnect = 0,
    Connected = 1,
    Connecting = 2,
    ConnectFail = 3,
    ConnectKick = 4
}
export declare class ConnectionInfo {
    nodeId: number;
}
export declare type ConnectStatusListener = (status: ConnectStatus, reasonCode?: number, connectionInfo?: ConnectionInfo) => void;
export declare type ConnectDelayListener = (delay: number) => void;
export declare class ConnectManager {
    ws?: WKWebsocket;
    status: ConnectStatus;
    connectStatusListeners: ConnectStatusListener[];
    connectDelayListeners: ConnectDelayListener[];
    lockReconnect: boolean;
    pongRespTimeoutInterval: number;
    pongRespTimer: any;
    needReconnect: boolean;
    pingRetryCount: number;
    pingMaxRetryCount: number;
    reConnectTimeout: any;
    heartTimer: any;
    dhPrivateKey: Uint8Array;
    tempBufferData: number[];
    sendPacketQueue: Packet[];
    sendTimer: any;
    pingTime: number;
    private constructor();
    private static instance;
    static shared(): ConnectManager;
    stopHeart(): void;
    stopReconnectTimer(): void;
    restHeart(): void;
    connect(): void;
    onlyConnect(): void;
    connectWithAddr(addr: string): void;
    stringToUint(str: string): any[];
    connected(): boolean;
    disconnect(): void;
    onlyDisconnect(): void;
    reConnect(): void;
    wssend(message: SendPacket): void;
    unpacket(data: Uint8Array, callback: (data: Array<Array<number>>) => void): void;
    unpackOne(data: Array<number>, dataCallback: (data: Array<number>) => void): number[];
    onPacket(data: Uint8Array): void;
    sendPing(): void;
    sendPacket(p: Packet): void;
    send(data: Uint8Array): void;
    getProto(): IProto;
    addConnectStatusListener(listener: ConnectStatusListener): void;
    removeConnectStatusListener(listener: ConnectStatusListener): void;
    addConnectDelayListener(listener: ConnectDelayListener): void;
    removeConnectDelayListener(listener: ConnectDelayListener): void;
    notifyConnectStatusListeners(reasonCode: number, connectackPacket?: ConnackPacket): void;
    notifyConnectDelayListeners(delay: number): void;
    sendRecvackPacket(recvPacket: RecvPacket): void;
    close(): void;
}
