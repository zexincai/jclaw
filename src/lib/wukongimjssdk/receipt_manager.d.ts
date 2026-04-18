import { Channel, Message } from "./model";
export declare type MessageReceiptListener = ((channel: Channel, message: Message[]) => void);
export declare class ReceiptManager {
    private static instance;
    listeners: MessageReceiptListener[];
    private timer;
    static shared(flushInterval?: number): ReceiptManager;
    private channelMessagesMap;
    private setup;
    addReceiptMessages(channel: Channel, messages: Message[]): void;
    private flush;
    private removeCacheWithLength;
    private flushLoop;
    addListener(listener: MessageReceiptListener): void;
    removeListener(listener: MessageReceiptListener): void;
    notifyListeners(channel: Channel, messages: Message[]): void;
}
