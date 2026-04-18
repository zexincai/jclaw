export declare class WKWebsocket {
    addr: string;
    ws: WebSocket | any;
    destory: boolean;
    platform: any;
    constructor(addr: string, platform?: any);
    onopen(callback: () => void): void;
    onmessage(callback: ((ev: MessageEvent) => any) | null): void;
    onclose(callback: (e: CloseEvent) => void): void;
    onerror(callback: (e: Event) => void): void;
    send(data: any): void;
    close(): void;
}
