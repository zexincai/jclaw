export declare class SecurityManager {
    aesKey: string;
    aesIV: string;
    registrationID: number;
    deviceID: number;
    private static instance;
    static shared(): SecurityManager;
    private constructor();
    signalEncrypt(recipientID: string, contentData: Uint8Array): Promise<Uint8Array>;
    stringToUint(str: string): number[];
    encryption(message: string): string;
    decryption(message: Uint8Array): Uint8Array;
    encryption2(message: Uint8Array): string;
    uintToString(array: any[]): string;
}
export declare function arrayBufferToString(b: ArrayBuffer): string;
export declare function uint8ArrayToString(arr: Uint8Array): string;
