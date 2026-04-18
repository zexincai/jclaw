import { Channel, Conversation, ConversationExtra, Message } from "./model";
export declare enum ConversationAction {
    add = 0,
    update = 1,
    remove = 2
}
export declare type ConversationListener = ((conversation: Conversation, action: ConversationAction) => void);
export declare class ConversationManager {
    listeners: ConversationListener[];
    conversations: Conversation[];
    openConversation?: Conversation;
    maxExtraVersion: number;
    private _noUpdateContentType;
    addNoUpdateContentType(contentType: number): void;
    removeNoUpdateContentType(contentType: number): void;
    private static instance;
    static shared(): ConversationManager;
    private constructor();
    sync(filter?: any): Promise<Conversation[]>;
    syncExtra(): Promise<ConversationExtra[] | undefined>;
    findConversation(channel: Channel): Conversation | undefined;
    findConversations(channels: Channel[]): Conversation[] | undefined;
    createEmptyConversation(channel: Channel): Conversation;
    updateOrAddConversation(message: Message): void;
    removeConversation(channel: Channel): void;
    getAllUnreadCount(): number;
    addConversationListener(listener: ConversationListener): void;
    removeConversationListener(listener: ConversationListener): void;
    notifyConversationListeners(conversation: Conversation, action: ConversationAction): void;
}
