import { Channel, Message, MessageContent, SyncOptions } from "./model";
import { Packet, RecvPacket, SendackPacket, SendPacket, Setting } from "./proto";
export declare type MessageListener = ((message: Message) => void);
export declare type MessageStatusListener = ((p: SendackPacket) => void);
export declare class ChatManager {
    cmdListeners: ((message: Message) => void)[];
    listeners: MessageListener[];
    sendingQueues: Map<number, SendPacket>;
    sendPacketQueue: Packet[];
    sendTimer: any;
    sendStatusListeners: MessageStatusListener[];
    clientSeq: number;
    private static instance;
    static shared(): ChatManager;
    private constructor();
    onPacket(packet: Packet): Promise<void>;
    syncMessages(channel: Channel, opts: SyncOptions): Promise<Message[]>;
    syncMessageExtras(channel: Channel, extraVersion: number): Promise<import("./model").MessageExtra[]>;
    sendRecvackPacket(recvPacket: RecvPacket): void;
    /**
     *  发送消息
     * @param content  消息内容
     * @param channel 频道对象
     * @param setting  发送设置
     * @returns 完整消息对象
     */
    send(content: MessageContent, channel: Channel, setting?: Setting): Promise<Message>;
    sendWithOptions(content: MessageContent, channel: Channel, opts: SendOptions): Promise<Message>;
    sendSendPacket(p: SendPacket): void;
    getSendPacket(content: MessageContent, channel: Channel, setting?: Setting): SendPacket;
    getSendPacketWithOptions(content: MessageContent, channel: Channel, opts?: SendOptions): SendPacket;
    getClientSeq(): number;
    notifyCMDListeners(message: Message): void;
    addCMDListener(listener: MessageListener): void;
    removeCMDListener(listener: MessageListener): void;
    addMessageListener(listener: MessageListener): void;
    removeMessageListener(listener: MessageListener): void;
    notifyMessageListeners(message: Message): void;
    notifyMessageStatusListeners(sendackPacket: SendackPacket): void;
    addMessageStatusListener(listener: MessageStatusListener): void;
    removeMessageStatusListener(listener: MessageStatusListener): void;
    flushSendingQueue(): void;
    deleteMessageFromSendingQueue(clientSeq: number): void;
}
export declare class SendOptions {
    setting: Setting;
    noPersist: boolean;
    reddot: boolean;
}
