import { Message } from "./model";
declare type TaskListener = () => void;
declare type TaskManagerListener = (task: Task) => void;
export declare enum TaskStatus {
    wait = 0,
    success = 1,
    processing = 2,
    fail = 3,
    suspend = 4,
    cancel = 5
}
export declare class TaskManager {
    private taskMap;
    private listeners;
    addTask(task: Task): void;
    removeTask(id: string): void;
    addListener(listener: TaskManagerListener): void;
    removeListener(listener: TaskManagerListener): void;
    notifyListeners(task: Task): void;
}
export interface Task {
    id: string;
    status: TaskStatus;
    start(): void;
    suspend(): void;
    resume(): void;
    cancel(): void;
    update(): void;
    progress(): number;
    addListener(listener: TaskListener): void;
    removeListener(listener: TaskListener): void;
}
export declare class BaseTask implements Task {
    id: string;
    status: TaskStatus;
    private _listeners;
    start(): void;
    suspend(): void;
    resume(): void;
    cancel(): void;
    update(): void;
    progress(): number;
    addListener(listener: TaskListener): void;
    removeListener(listener: TaskListener): void;
    get listeners(): TaskListener[];
}
export declare class MessageTask extends BaseTask {
    message: Message;
    constructor(message: Message);
}
export {};
