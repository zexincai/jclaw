import { Channel, ChannelInfo, Conversation, ConversationExtra, Message, MessageExtra, Reminder, SignalKey, Subscriber, SyncOptions } from "./model";
import { MessageTask } from './task';
export declare type ConnectAddrCallback = (addr: string) => void;
export declare type ChannelInfoCallback = (channel: Channel) => Promise<ChannelInfo>;
export declare type SyncSubscribersCallback = (channel: Channel, version: number) => Promise<Subscriber[]>;
export declare type SyncConversationsCallback = (filter?: any) => Promise<Conversation[]>;
export declare type SyncConversationExtrasCallback = (versation: number) => Promise<ConversationExtra[] | undefined>;
export declare type SignalSessionKeyCallback = (channel: Channel) => Promise<SignalKey | null>;
export declare type SyncRemindersCallback = (version: number) => Promise<Reminder[]>;
export declare type ReminderDoneCallback = (ids: number[]) => Promise<void>;
export declare type MessageUploadTaskCallback = (message: Message) => MessageTask;
export declare type SyncMessageCallback = (channel: Channel, opts: SyncOptions) => Promise<Message[]>;
export declare type SyncMessageExtraCallback = (channel: Channel, extraVersion: number, limit: number) => Promise<MessageExtra[]>;
export declare type MessageReadedCallback = (channel: Channel, messages: Message[]) => Promise<void>;
export declare class Provider {
    connectAddrCallback: (callback: ConnectAddrCallback) => void;
    channelInfoCallback: ChannelInfoCallback;
    syncSubscribersCallback: SyncSubscribersCallback;
    syncMessagesCallback?: SyncMessageCallback;
    syncConversationsCallback: SyncConversationsCallback;
    syncConversationExtrasCallback?: SyncConversationExtrasCallback;
    syncMessageExtraCallback?: SyncMessageExtraCallback;
    messageUploadTaskCallback?: MessageUploadTaskCallback;
    signalSessionKeyCallback?: SignalSessionKeyCallback;
    syncRemindersCallback?: SyncRemindersCallback;
    reminderDoneCallback?: ReminderDoneCallback;
    messageReadedCallback?: MessageReadedCallback;
    messageUploadTask(message: Message): MessageTask | undefined;
}
