import { Channel, Reminder } from "./model";
export declare class ReminderManager {
    reminders: Reminder[];
    private static instance;
    static shared(): ReminderManager;
    private constructor();
    sync(): Promise<void>;
    done(ids: number[]): Promise<void>;
    private getChannelWithReminders;
    updateConversations(channels: Channel[]): void;
    getWaitDoneReminders(channel: Channel): Reminder[];
    getRemindersWithIDs(ids: number[]): Reminder[];
    maxReminderVersion(): number;
}
