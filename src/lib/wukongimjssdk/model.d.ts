import { RecvPacket, SendPacket, Setting } from './proto';
export declare const ChannelTypePerson = 1;
export declare const ChannelTypeGroup = 2;
export declare const ChannelTypeData = 7;
export declare class Channel {
    channelID: string;
    channelType: number;
    constructor(channelID: string, channelType: number);
    getChannelKey(): string;
    static fromChannelKey(channelKey: string): Channel | undefined;
    isEqual(c: Channel): boolean;
}
export declare class Reaction {
    seq: string;
    count: number;
    emoji: string;
    users: any[];
}
export declare class MessageHeader {
    reddot: boolean;
    noPersist: boolean;
    syncOnce: boolean;
    dup: boolean;
}
export declare enum MessageStatus {
    Wait = 0,
    Normal = 1,
    Fail = 2
}
export declare class Message {
    constructor(recvPacket?: RecvPacket);
    static fromSendPacket(sendPacket: SendPacket, content?: MessageContent): Message;
    header: MessageHeader;
    setting: Setting;
    clientSeq: number;
    messageID: string;
    messageSeq: number;
    clientMsgNo: string;
    fromUID: string;
    channel: Channel;
    timestamp: number;
    content: MessageContent | any;
    streamText?: string;
    status: MessageStatus;
    voicePlaying: boolean;
    voiceReaded: boolean;
    reactions: Reaction[];
    isDeleted: boolean;
    remoteExtra: MessageExtra;
    get send(): boolean;
    get contentType(): number;
}
export declare class MessageExtra {
    messageID: string;
    channel: Channel;
    messageSeq: number;
    readed: boolean;
    readedAt: Date;
    readedCount: number;
    unreadCount: number;
    revoke: boolean;
    revoker?: string;
    contentEditData?: Uint8Array;
    contentEdit?: MessageContent;
    editedAt: number;
    isEdit: boolean;
    extra: any;
    extraVersion: number;
}
export declare class Mention {
    all?: boolean;
    uids?: string[];
}
export declare class MessageContent {
    private _contentType;
    get contentType(): number;
    set contentType(value: number);
    private _conversationDigest;
    get conversationDigest(): string;
    set conversationDigest(value: string);
    private visibles?;
    private invisibles?;
    reply: Reply;
    mention?: Mention;
    contentObj: any;
    encode(): Uint8Array;
    decode(data: Uint8Array): void;
    isVisiable(uid: string): boolean;
    decodeJSON(content: any): void;
    encodeJSON(): any;
}
export declare class MediaMessageContent extends MessageContent {
    file?: File;
    extension: string;
    remoteUrl: string;
    dealFile(): void;
}
export declare class Subscriber {
    uid: string;
    name: string;
    remark: string;
    avatar: string;
    role: number;
    channel: Channel;
    version: number;
    isDeleted: boolean;
    status: number;
    orgData: any;
}
export declare class ChannelInfo {
    channel: Channel;
    title: string;
    logo: string;
    mute: boolean;
    top: boolean;
    orgData: any;
    online: boolean;
    lastOffline: number;
}
export declare class Conversation {
    channel: Channel;
    unread: number;
    _logicUnread: number;
    timestamp: number;
    lastMessage?: Message;
    extra?: any;
    _remoteExtra: ConversationExtra;
    private _isMentionMe?;
    private _reminders;
    simpleReminders: Reminder[];
    get channelInfo(): ChannelInfo | undefined;
    isEqual(c: Conversation): boolean;
    get isMentionMe(): boolean | undefined;
    set isMentionMe(isMentionMe: boolean | undefined);
    get remoteExtra(): ConversationExtra;
    set remoteExtra(remoteExtra: ConversationExtra);
    get logicUnread(): number;
    set reminders(reminders: Reminder[]);
    get reminders(): Reminder[];
    reloadIsMentionMe(): void;
}
export declare class ConversationExtra {
    channel: Channel;
    browseTo: number;
    keepMessageSeq: number;
    keepOffsetY: number;
    draft?: string;
    version: number;
}
export declare class SignalKey {
    identityKey: ArrayBuffer;
    signedKeyID: number;
    signedPubKey: ArrayBuffer;
    signedSignature: ArrayBuffer;
    preKeyID?: number;
    preKeyPublicKey?: ArrayBuffer;
    registrationId: number;
}
export declare class Reply {
    messageID?: string;
    messageSeq: number;
    fromUID: string;
    fromName: string;
    rootMessageID?: string;
    content: MessageContent;
    encode(): any;
    decode(data: any): void;
}
export declare enum ReminderType {
    ReminderTypeMentionMe = 1,
    ReminderTypeApplyJoinGroup = 2
}
export declare class Reminder {
    channel: Channel;
    reminderID: number;
    messageID: string;
    messageSeq: number;
    reminderType: ReminderType;
    text?: string;
    data?: any;
    isLocate: boolean;
    version: number;
    done: boolean;
    isEqual(c: Reminder): boolean;
}
export declare enum PullMode {
    Down = 0,
    Up = 1
}
export declare class SyncOptions {
    startMessageSeq: number;
    endMessageSeq: number;
    limit: number;
    pullMode: PullMode;
}
export declare class MessageContentManager {
    contentMap: Map<number, (contentType: number) => MessageContent>;
    private factor;
    private static instance;
    static shared(): MessageContentManager;
    private constructor();
    register(contentType: number, handler: (contentType?: number) => MessageContent): void;
    registerFactor(factor: (contentType: number) => MessageContent | undefined): void;
    getMessageContent(contentType: number): MessageContent;
}
/**
 * 文本
 */
export declare class MessageText extends MessageContent {
    text?: string;
    constructor(text?: string);
    get conversationDigest(): string;
    get contentType(): number;
    decodeJSON(content: any): void;
    encodeJSON(): any;
}
export declare class MessageImage extends MediaMessageContent {
    width: number;
    height: number;
    private _url;
    constructor(file?: File, width?: number, height?: number);
    set url(ul: string);
    get url(): string;
    decodeJSON(content: any): void;
    encodeJSON(): {
        width: number;
        height: number;
        url: string;
    };
    get contentType(): number;
    get conversationDigest(): string;
}
export declare class MessageStream extends MessageContent {
    data: ArrayBuffer;
    constructor(data: ArrayBuffer);
    get contentType(): number;
    decodeJSON(content: any): void;
    encodeJSON(): any;
}
export declare class MessageSignalContent extends MessageContent {
    get contentType(): number;
}
/**
 * 未知
 */
export declare class UnknownContent extends MessageContent {
    realContentType: number;
    get contentType(): number;
    get conversationDigest(): string;
    decodeJSON(content: any): void;
}
/**
 * 系统消息
 */
export declare class SystemContent extends MessageContent {
    content: any;
    private _displayText;
    decodeJSON(content: any): void;
    get conversationDigest(): string;
    get displayText(): string;
}
export declare class CMDContent extends MessageContent {
    cmd: string;
    param: any;
    decodeJSON(content: any): void;
    get contentType(): number;
}
export declare class SubscribeOptions {
    param?: any;
}
export declare type SubscribeOption = (opts: SubscribeOptions) => void;
export declare enum SubscribeAction {
    subscribe = 0,
    unsubscribe = 1
}
export declare enum ReasonCode {
    unknown = 0,
    success = 1,
    authFail = 2,
    subscriberNotExist = 3,
    reasonInBlacklist = 4,
    reasonChannelNotExist = 5,
    reasonUserNotOnNode = 6,
    reasonSenderOffline = 7,
    msgKeyError = 8,
    payloadDecodeError = 9,
    forwardSendPacketError = 10,
    notAllowSend = 11,
    connectKick = 12,
    notInWhitelist = 13,
    queryTokenError = 14,
    systemError = 15,
    channelIDError = 16,
    nodeMatchError = 17,
    nodeNotMatch = 18,
    ban = 19,
    notSupportHeader = 20,
    clientKeyIsEmpty = 21,
    rateLimit = 22,
    notSupportChannelType = 23
}
export declare type SubscribeListener = (msg?: Message, reasonCode?: ReasonCode) => void;
export declare type UnsubscribeListener = (reasonCode?: ReasonCode) => void;
export declare class ListenerState {
    action: SubscribeAction;
    listener?: SubscribeListener | UnsubscribeListener;
    options?: SubscribeOptions;
    sending: boolean;
    handleOk: boolean;
    constructor(action: SubscribeAction, listener?: SubscribeListener | UnsubscribeListener, options?: SubscribeOptions);
}
export declare class SubscribeContext {
    channel: Channel;
    listenerStates: ListenerState[];
    constructor(channel: Channel);
}
export declare class SubscribeConfig {
    withParam(param: any): SubscribeOption;
}
export declare const subscribeConfig: SubscribeConfig;
