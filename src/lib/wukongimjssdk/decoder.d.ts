import BigNumber from "bignumber.js";
export default class Decoder {
    data: Uint8Array;
    offset: number;
    constructor(data: Uint8Array);
    readByte(): number;
    readNum(b: number): BigNumber;
    readInt64(): BigNumber;
    readInt16(): number;
    readInt32(): number;
    readString(): string;
    readRemaining(): Uint8Array;
    uintToString(array: any[]): string;
    readVariableLength(): number;
}
