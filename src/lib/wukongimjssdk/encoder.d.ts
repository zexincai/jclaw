import BigNumber from "bignumber.js";
export default class Encoder {
    w: number[];
    d32: BigNumber;
    writeByte(b: number): void;
    writeBytes(b: number[]): void;
    writeInt64(b: BigNumber): void;
    writeInt32(b: number): void;
    writeUint8(b: number): void;
    writeInt16(b: number): void;
    writeString(s: string): void;
    stringToUint(str: string): any[];
    toUint8Array(): Uint8Array;
}
