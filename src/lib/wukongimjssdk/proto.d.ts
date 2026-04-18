import Decoder from './decoder';
import BigNumber from 'bignumber.js';
export declare enum PacketType {
    Reserved = 0,
    CONNECT = 1,
    CONNACK = 2,
    SEND = 3,
    SENDACK = 4,
    RECV = 5,
    RECVACK = 6,
    PING = 7,
    PONG = 8,
    DISCONNECT = 9,
    SUB = 10,
    SUBACK = 11,
    Event = 12
}
export declare class Setting {
    receiptEnabled: boolean;
    topic: boolean;
    private _streamOn;
    get streamOn(): boolean;
    toUint8(): number;
    static fromUint8(v: number): Setting;
    private boolToInt;
}
export declare class Packet {
    from(f: Packet): void;
    private _packetType;
    remainingLength: number;
    noPersist: boolean;
    reddot: boolean;
    syncOnce: boolean;
    dup: boolean;
    hasServerVersion: boolean;
    end: boolean;
    set packetType(packetType: PacketType);
    get packetType(): PacketType;
}
export declare class ConnectPacket extends Packet {
    version: number;
    clientKey: string;
    deviceID: string;
    deviceFlag: number;
    clientTimestamp: number;
    uid: string;
    token: string;
    get packetType(): PacketType;
}
export declare class ConnackPacket extends Packet {
    serverVersion: number;
    serverKey: string;
    salt: string;
    timeDiff: BigNumber;
    reasonCode: number;
    nodeId: BigNumber;
    get packetType(): PacketType;
}
export declare class DisconnectPacket extends Packet {
    reasonCode: number;
    reason: string;
    get packetType(): PacketType;
}
export declare class SendPacket extends Packet {
    setting: Setting;
    clientSeq: number;
    clientMsgNo: string;
    channelID: string;
    channelType: number;
    expire?: number;
    fromUID: string;
    topic?: string;
    payload: Uint8Array;
    get packetType(): PacketType;
    veritifyString(payload: Uint8Array): string;
    private uint8ArrayToString;
}
export declare enum StreamFlag {
    START = 0,
    ING = 1,
    END = 2
}
export declare class RecvPacket extends Packet {
    setting: Setting;
    msgKey: string;
    messageID: string;
    messageSeq: number;
    clientMsgNo: string;
    timestamp: number;
    channelID: string;
    channelType: number;
    expire?: number;
    topic?: string;
    fromUID: string;
    payload: Uint8Array;
    get packetType(): PacketType;
    get veritifyString(): string;
    private uint8ArrayToString;
}
export declare class PingPacket extends Packet {
    get packetType(): PacketType;
}
export declare class PongPacket extends Packet {
    get packetType(): PacketType;
}
export declare class SendackPacket extends Packet {
    clientSeq: number;
    messageID: BigNumber;
    messageSeq: number;
    reasonCode: number;
    get packetType(): PacketType;
}
export declare class RecvackPacket extends Packet {
    messageID: string;
    messageSeq: number;
    get packetType(): PacketType;
}
export declare class SubPacket extends Packet {
    setting: number;
    clientMsgNo: string;
    channelID: string;
    channelType: number;
    action: number;
    param?: string;
    get packetType(): PacketType;
}
export declare class SubackPacket extends Packet {
    clientMsgNo: string;
    channelID: string;
    channelType: number;
    action: number;
    reasonCode: number;
    get packetType(): PacketType;
}
export declare class EventPacket extends Packet {
    id: string;
    type: string;
    timestamp: number;
    data: Uint8Array;
    get packetType(): PacketType;
}
export interface IProto {
    encode(f: Packet): Uint8Array;
    decode(data: Uint8Array): Packet;
}
export default class Proto implements IProto {
    packetEncodeMap: any;
    packetDecodeMap: any;
    constructor();
    encode(f: Packet): Uint8Array;
    decode(data: Uint8Array): Packet;
    encodeConnect(packet: ConnectPacket): number[];
    encodeSend(packet: SendPacket): number[];
    encodeSub(packet: SubPacket): number[];
    decodeSuback(f: Packet, decode: Decoder): SubackPacket;
    encodeRecvack(packet: RecvackPacket): number[];
    decodeConnect(f: Packet, decode: Decoder): ConnackPacket;
    decodeDisconnect(f: Packet, decode: Decoder): DisconnectPacket;
    decodeRecvPacket(f: Packet, decode: Decoder): RecvPacket;
    decodeSendackPacket(f: Packet, decode: Decoder): SendackPacket;
    decodeEvent(f: Packet, decode: Decoder): EventPacket;
    encodeFramer(f: Packet, remainingLength: number): any[];
    decodeFramer(decode: Decoder): Packet;
    encodeBool(b: boolean): 0 | 1;
    encodeVariableLength(len: number): any[];
}
