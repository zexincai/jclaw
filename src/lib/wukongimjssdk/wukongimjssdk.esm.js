import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js';
import * as buffer from 'buffer';
import { Md5 } from 'md5-typescript';
import { generateKeyPair, sharedKey } from 'curve25519-js';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

/** @deprecated */
function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var MessageContentType = /** @class */ (function () {
    function MessageContentType() {
    }
    MessageContentType.unknown = 0; // 未知消息
    MessageContentType.text = 1; // 文本消息
    MessageContentType.image = 2; // 图片
    MessageContentType.stream = 98; // 流式消息
    MessageContentType.cmd = 99; // cmd
    // 20000 - 30000 为本地自定义消息
    MessageContentType.signalMessage = 21000; // signal
    return MessageContentType;
}());
var EventType = /** @class */ (function () {
    function EventType() {
    }
    EventType.TextMessageStart = "___TextMessageStart"; // 文本消息开始
    EventType.TextMessageContent = "___TextMessageContent"; // 追加文本消息
    EventType.TextMessageEnd = "___TextMessageEnd"; // 文本消息结束
    return EventType;
}());

var Encoder = /** @class */ (function () {
    function Encoder() {
        this.w = new Array();
        this.d32 = new BigNumber(4294967296);
    }
    Encoder.prototype.writeByte = function (b) {
        this.w.push(b);
    };
    Encoder.prototype.writeBytes = function (b) {
        var _a;
        (_a = this.w).push.apply(_a, b);
    };
    /* tslint:disable */
    Encoder.prototype.writeInt64 = function (b) {
        var b1 = b.div(this.d32).toNumber();
        var b2 = b.mod(this.d32).toNumber();
        this.w.push((b1 >> 24) & 0xff);
        this.w.push((b1 >> 16) & 0xff);
        this.w.push((b1 >> 8) & 0xff);
        this.w.push(b1 & 0xff);
        this.w.push((b2 >> 24) & 0xff);
        this.w.push((b2 >> 16) & 0xff);
        this.w.push((b2 >> 8) & 0xff);
        this.w.push(b2 & 0xff);
    };
    Encoder.prototype.writeInt32 = function (b) {
        this.w.push(b >> 24);
        this.w.push(b >> 16);
        this.w.push(b >> 8);
        this.w.push(b & 0xff);
    };
    Encoder.prototype.writeUint8 = function (b) {
        this.w.push(b);
    };
    Encoder.prototype.writeInt16 = function (b) {
        this.w.push(b >> 8);
        this.w.push(b & 0xff);
    };
    Encoder.prototype.writeString = function (s) {
        var _a;
        if (s && s.length > 0) {
            var strArray = this.stringToUint(s);
            this.writeInt16(strArray.length);
            (_a = this.w).push.apply(_a, strArray);
        }
        else {
            this.writeInt16(0x00);
        }
    };
    Encoder.prototype.stringToUint = function (str) {
        var string = unescape(encodeURIComponent(str));
        var charList = string.split('');
        var uintArray = new Array();
        for (var i = 0; i < charList.length; i++) {
            uintArray.push(charList[i].charCodeAt(0));
        }
        return uintArray;
    };
    Encoder.prototype.toUint8Array = function () {
        return new Uint8Array(this.w);
    };
    return Encoder;
}());

var Decoder = /** @class */ (function () {
    function Decoder(data) {
        this.offset = 0;
        this.data = data;
    }
    Decoder.prototype.readByte = function () {
        var d = this.data[this.offset];
        this.offset++;
        return d;
    };
    Decoder.prototype.readNum = function (b) {
        var data = this.data.slice(this.offset, this.offset + b);
        this.offset += b;
        var n = new BigNumber(0);
        for (var i = 0; i < data.length; i++) {
            var d = new BigNumber(2).pow(new BigNumber((data.length - i - 1) * 8));
            n = n.plus(new BigNumber(data[i]).multipliedBy(d));
        }
        return n;
    };
    // 读取64bit的int数据（js没有int64的类型，所以这里只能用字符串接受）
    Decoder.prototype.readInt64 = function () {
        return this.readNum(8);
    };
    Decoder.prototype.readInt16 = function () {
        return Number(this.readNum(2));
    };
    Decoder.prototype.readInt32 = function () {
        return Number(this.readNum(4));
    };
    Decoder.prototype.readString = function () {
        var len = this.readInt16();
        if (len <= 0) {
            return "";
        }
        var strUint8Array = this.data.slice(this.offset, this.offset + len);
        this.offset += len;
        return this.uintToString(Array.from(strUint8Array));
    };
    // 读取剩余的字节
    Decoder.prototype.readRemaining = function () {
        var data = this.data.slice(this.offset);
        this.offset = this.data.length;
        return data;
    };
    Decoder.prototype.uintToString = function (array) {
        var encodedString = String.fromCharCode.apply(null, array);
        var decodedString = decodeURIComponent(escape(encodedString));
        return decodedString;
    };
    Decoder.prototype.readVariableLength = function () {
        var multiplier = 0;
        var rLength = Number(0);
        while (multiplier < 27) {
            var b = this.readByte();
            /* tslint:disable */
            rLength = rLength | ((b & 127) << multiplier);
            if ((b & 128) == 0) {
                break;
            }
            multiplier += 7;
        }
        return rLength;
    };
    return Decoder;
}());

var SecurityManager = /** @class */ (function () {
    function SecurityManager() {
        // store!: SignalProtocolStore
        this.deviceID = 2;
    }
    SecurityManager.shared = function () {
        if (!this.instance) {
            this.instance = new SecurityManager();
            // this.instance.store = new SignalProtocolStore()
        }
        return this.instance;
    };
    // public set identityKey(identityKeyPair: KeyPairType<ArrayBuffer> | undefined) {
    //     this.store.put("identityKey", identityKeyPair)
    // }
    // public async initSignal() {
    //     const registrationId = KeyHelper.generateRegistrationId();
    //     this.registrationID = registrationId
    //     this.store.put("registrationId", registrationId)
    //     const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
    //     this.store.put("identityKey", identityKeyPair)
    // }
    // public async generateSignedPreKey() {
    //     const identityKeyPair = await this.store.getIdentityKeyPair()
    //     const signedPreKeyId = Math.floor(10000 * Math.random());
    //     const signedPreKey = await KeyHelper.generateSignedPreKey(
    //         identityKeyPair!,
    //         signedPreKeyId
    //     );
    //     this.store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);
    //     const publicSignedPreKey: SignedPublicPreKeyType = {
    //         keyId: signedPreKeyId,
    //         publicKey: signedPreKey.keyPair.pubKey,
    //         signature: signedPreKey.signature,
    //       };
    //     return publicSignedPreKey
    // }
    // public async generatePreKeys() :Promise<PreKeyType[]> {
    //     const baseKeyId = Math.floor(10000 * Math.random());
    //     const  publicPreKey1  = await this.generatePreKey(baseKeyId)
    //     const  publicPreKey2  = await this.generatePreKey(baseKeyId+1)
    //     return [publicPreKey1,publicPreKey2]
    // }
    // public async generatePreKey(keyID:number) {
    //     const preKey = await KeyHelper.generatePreKey(keyID);
    //     this.store.storePreKey(`${keyID}`, preKey.keyPair);
    //     const publicPreKey: PreKeyType = {
    //         keyId: preKey.keyId,
    //         publicKey: preKey.keyPair.pubKey,
    //       };
    //       return publicPreKey
    // }
    // public async signalDecrypt(recipientID: string, messageData: Uint8Array): Promise<ArrayBuffer> {
    //     // const recipientAddress = new SignalProtocolAddress(recipientID, this.deviceID);
    //     // const cipher = new SessionCipher(this.store, recipientAddress);
    //     // let type = messageData[0]
    //     // let message = messageData.subarray(1)
    //     // const encodedString = uint8ArrayToString(message)
    //     // console.log('type--->',type)
    //     // let messageBuff = Uint8Array.from(Buffer.from(encodedString, "base64")).buffer
    //     // if (type === 3) {
    //     //     return cipher.decryptPreKeyWhisperMessage(messageBuff)
    //     // }
    //     // return cipher.decryptWhisperMessage(messageBuff)
    //     return messageData.buffer
    // }
    SecurityManager.prototype.signalEncrypt = function (recipientID, contentData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // const recipientAddress = new SignalProtocolAddress(recipientID, this.deviceID);
                // const cipher = new SessionCipher(this.store, recipientAddress);
                // const message = await cipher.encrypt(contentData.buffer)
                // const messageBase64 = Buffer.from(this.stringToUint(message.body ?? "")).toString("base64")
                // const messageUint8s = this.stringToUint(messageBase64)
                // return Uint8Array.from([message.type, ...messageUint8s])
                return [2 /*return*/, contentData];
            });
        });
    };
    // public async signalProcessSession(recipientID: string, deviceType: DeviceType) {
    //     const recipientAddress = new SignalProtocolAddress(recipientID, this.deviceID);
    //     const sessionBuilder = new SessionBuilder(this.store, recipientAddress);
    //     const session = await sessionBuilder.processPreKey(deviceType)
    //     return session
    // }
    SecurityManager.prototype.stringToUint = function (str) {
        // let string = unescape(encodeURIComponent(str));
        var charList = str.split('');
        var uintArray = new Array();
        for (var _i = 0, charList_1 = charList; _i < charList_1.length; _i++) {
            var v = charList_1[_i];
            uintArray.push(v.charCodeAt(0));
        }
        return uintArray;
    };
    SecurityManager.prototype.encryption = function (message) {
        var actMsgKeyBytes = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(message), CryptoJS.enc.Utf8.parse(this.aesKey), {
            keySize: 128 / 8,
            iv: CryptoJS.enc.Utf8.parse(this.aesIV),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        var actMsgKey = actMsgKeyBytes.toString();
        return actMsgKey;
    };
    SecurityManager.prototype.decryption = function (message) {
        var messageStr = this.uintToString(Array.from(message));
        var messagedecBase64 = CryptoJS.enc.Base64.parse(messageStr);
        var decrypted = CryptoJS.AES.decrypt(CryptoJS.enc.Base64.stringify(messagedecBase64), CryptoJS.enc.Utf8.parse(this.aesKey), {
            keySize: 128 / 8,
            iv: CryptoJS.enc.Utf8.parse(this.aesIV),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return Uint8Array.from(buffer.Buffer.from(decrypted.toString(CryptoJS.enc.Utf8)));
    };
    SecurityManager.prototype.encryption2 = function (message) {
        var encodedString = String.fromCharCode.apply(null, Array.from(message));
        var decodedString = decodeURIComponent(escape(encodedString));
        return this.encryption(decodedString);
    };
    SecurityManager.prototype.uintToString = function (array) {
        var encodedString = String.fromCharCode.apply(null, array);
        // const decodedString = decodeURIComponent(escape(encodedString));
        return encodedString;
    };
    return SecurityManager;
}());

var serverVersion = 0; // 服务端返回的协议版本
/* tslint:disable */
var PacketType;
(function (PacketType) {
    PacketType[PacketType["Reserved"] = 0] = "Reserved";
    PacketType[PacketType["CONNECT"] = 1] = "CONNECT";
    PacketType[PacketType["CONNACK"] = 2] = "CONNACK";
    PacketType[PacketType["SEND"] = 3] = "SEND";
    PacketType[PacketType["SENDACK"] = 4] = "SENDACK";
    PacketType[PacketType["RECV"] = 5] = "RECV";
    PacketType[PacketType["RECVACK"] = 6] = "RECVACK";
    PacketType[PacketType["PING"] = 7] = "PING";
    PacketType[PacketType["PONG"] = 8] = "PONG";
    PacketType[PacketType["DISCONNECT"] = 9] = "DISCONNECT";
    PacketType[PacketType["SUB"] = 10] = "SUB";
    PacketType[PacketType["SUBACK"] = 11] = "SUBACK";
    PacketType[PacketType["Event"] = 12] = "Event";
})(PacketType || (PacketType = {}));
var Setting = /** @class */ (function () {
    function Setting() {
        this.receiptEnabled = false; // 消息回执是否开启
        this.topic = false; // 是否存在话题
        this._streamOn = false;
    }
    Object.defineProperty(Setting.prototype, "streamOn", {
        get: function () {
            return this._streamOn;
        },
        enumerable: true,
        configurable: true
    });
    Setting.prototype.toUint8 = function () {
        return this.boolToInt(this.receiptEnabled) << 7 | this.boolToInt(this.topic) << 3 | this.boolToInt(this.streamOn) << 1;
    };
    Setting.fromUint8 = function (v) {
        var setting = new Setting();
        setting.receiptEnabled = (v >> 7 & 0x01) > 0;
        setting.topic = (v >> 3 & 0x01) > 0;
        setting._streamOn = (v >> 1 & 0x01) > 0;
        return setting;
    };
    Setting.prototype.boolToInt = function (v) {
        return v ? 1 : 0;
    };
    return Setting;
}());
var Packet = /** @class */ (function () {
    function Packet() {
        /* tslint:disable-line */
        this._packetType = PacketType.Reserved; // 包类型
        this.end = false; // 是否是最后一个分片
    }
    Packet.prototype.from = function (f) {
        this.noPersist = f.noPersist;
        this.reddot = f.reddot;
        this.syncOnce = f.syncOnce;
        this.dup = f.dup;
        this.remainingLength = f.remainingLength;
        this.hasServerVersion = f.hasServerVersion;
        this.end = f.end;
        this._packetType = f._packetType;
    };
    Object.defineProperty(Packet.prototype, "packetType", {
        get: function () {
            return this._packetType;
        },
        set: function (packetType) {
            this._packetType = packetType;
        },
        enumerable: true,
        configurable: true
    });
    return Packet;
}());
// 连接包
var ConnectPacket = /** @class */ (function (_super) {
    __extends(ConnectPacket, _super);
    function ConnectPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ConnectPacket.prototype, "packetType", {
        get: function () {
            return PacketType.CONNECT;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectPacket;
}(Packet));
// 连接回执包
var ConnackPacket = /** @class */ (function (_super) {
    __extends(ConnackPacket, _super);
    function ConnackPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.reasonCode = 0; // 原因码
        return _this;
    }
    Object.defineProperty(ConnackPacket.prototype, "packetType", {
        get: function () {
            return PacketType.CONNACK;
        },
        enumerable: true,
        configurable: true
    });
    return ConnackPacket;
}(Packet));
// 断开包
var DisconnectPacket = /** @class */ (function (_super) {
    __extends(DisconnectPacket, _super);
    function DisconnectPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /* tslint:disable-line */
        _this.reasonCode = 0; // 原因码
        return _this;
    }
    Object.defineProperty(DisconnectPacket.prototype, "packetType", {
        get: function () {
            return PacketType.DISCONNECT;
        },
        enumerable: true,
        configurable: true
    });
    return DisconnectPacket;
}(Packet));
// 发送包
var SendPacket = /** @class */ (function (_super) {
    __extends(SendPacket, _super);
    function SendPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SendPacket.prototype, "packetType", {
        get: function () {
            return PacketType.SEND;
        },
        enumerable: true,
        configurable: true
    });
    SendPacket.prototype.veritifyString = function (payload) {
        var _a;
        var payloadStr = this.uint8ArrayToString(payload);
        return "" + this.clientSeq + this.clientMsgNo + ((_a = this.channelID) !== null && _a !== void 0 ? _a : "") + this.channelType + payloadStr;
    };
    SendPacket.prototype.uint8ArrayToString = function (data) {
        var encodedString = String.fromCharCode.apply(null, Array.from(data));
        var decodedString = decodeURIComponent(escape(encodedString));
        return decodedString;
    };
    return SendPacket;
}(Packet));
var StreamFlag;
(function (StreamFlag) {
    StreamFlag[StreamFlag["START"] = 0] = "START";
    StreamFlag[StreamFlag["ING"] = 1] = "ING";
    StreamFlag[StreamFlag["END"] = 2] = "END";
})(StreamFlag || (StreamFlag = {}));
// 收消息包
var RecvPacket = /** @class */ (function (_super) {
    __extends(RecvPacket, _super);
    function RecvPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(RecvPacket.prototype, "packetType", {
        get: function () {
            return PacketType.RECV;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecvPacket.prototype, "veritifyString", {
        get: function () {
            var _a, _b;
            var payloadStr = this.uint8ArrayToString(this.payload);
            return "" + this.messageID + this.messageSeq + this.clientMsgNo + this.timestamp + ((_a = this.fromUID) !== null && _a !== void 0 ? _a : "") + ((_b = this.channelID) !== null && _b !== void 0 ? _b : "") + this.channelType + payloadStr;
        },
        enumerable: true,
        configurable: true
    });
    RecvPacket.prototype.uint8ArrayToString = function (data) {
        var encodedString = String.fromCharCode.apply(null, Array.from(data));
        var decodedString = decodeURIComponent(escape(encodedString));
        return decodedString;
    };
    return RecvPacket;
}(Packet));
// ping
var PingPacket = /** @class */ (function (_super) {
    __extends(PingPacket, _super);
    function PingPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PingPacket.prototype, "packetType", {
        /* tslint:disable-line */
        get: function () {
            return PacketType.PING;
        },
        enumerable: true,
        configurable: true
    });
    return PingPacket;
}(Packet));
// pong
var PongPacket = /** @class */ (function (_super) {
    __extends(PongPacket, _super);
    function PongPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PongPacket.prototype, "packetType", {
        /* tslint:disable-line */
        get: function () {
            return PacketType.PONG;
        },
        enumerable: true,
        configurable: true
    });
    return PongPacket;
}(Packet));
// 消息发送回执
var SendackPacket = /** @class */ (function (_super) {
    __extends(SendackPacket, _super);
    function SendackPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SendackPacket.prototype, "packetType", {
        get: function () {
            return PacketType.SENDACK;
        },
        enumerable: true,
        configurable: true
    });
    return SendackPacket;
}(Packet));
// 收到消息回执给服务端的包
var RecvackPacket = /** @class */ (function (_super) {
    __extends(RecvackPacket, _super);
    function RecvackPacket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(RecvackPacket.prototype, "packetType", {
        get: function () {
            return PacketType.RECVACK;
        },
        enumerable: true,
        configurable: true
    });
    return RecvackPacket;
}(Packet));
var SubPacket = /** @class */ (function (_super) {
    __extends(SubPacket, _super);
    function SubPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.action = 0; // 0:订阅 1:取消订阅
        return _this;
    }
    Object.defineProperty(SubPacket.prototype, "packetType", {
        get: function () {
            return PacketType.SUB;
        },
        enumerable: true,
        configurable: true
    });
    return SubPacket;
}(Packet));
var SubackPacket = /** @class */ (function (_super) {
    __extends(SubackPacket, _super);
    function SubackPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.action = 0; // 0:订阅 1:取消订阅
        return _this;
    }
    Object.defineProperty(SubackPacket.prototype, "packetType", {
        get: function () {
            return PacketType.SUBACK;
        },
        enumerable: true,
        configurable: true
    });
    return SubackPacket;
}(Packet));
var EventPacket = /** @class */ (function (_super) {
    __extends(EventPacket, _super);
    function EventPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /* tslint:disable-line */
        _this.id = "";
        _this.timestamp = 0;
        _this.data = new Uint8Array(0);
        return _this;
    }
    Object.defineProperty(EventPacket.prototype, "packetType", {
        get: function () {
            return PacketType.Event;
        },
        enumerable: true,
        configurable: true
    });
    return EventPacket;
}(Packet));
var Proto = /** @class */ (function () {
    function Proto() {
        /* tslint:disable-line */
        this.packetEncodeMap = {};
        this.packetDecodeMap = {};
        // 编码
        this.packetEncodeMap[PacketType.CONNECT] = this.encodeConnect;
        this.packetEncodeMap[PacketType.SEND] = this.encodeSend;
        this.packetEncodeMap[PacketType.RECVACK] = this.encodeRecvack;
        this.packetEncodeMap[PacketType.SUB] = this.encodeSub;
        // 解码
        this.packetDecodeMap[PacketType.CONNACK] = this.decodeConnect;
        this.packetDecodeMap[PacketType.RECV] = this.decodeRecvPacket;
        this.packetDecodeMap[PacketType.SENDACK] = this.decodeSendackPacket;
        this.packetDecodeMap[PacketType.DISCONNECT] = this.decodeDisconnect;
        this.packetDecodeMap[PacketType.SUBACK] = this.decodeSuback;
        this.packetDecodeMap[PacketType.Event] = this.decodeEvent;
    }
    Proto.prototype.encode = function (f) {
        var enc = new Encoder();
        var body;
        if (f.packetType !== PacketType.PING && f.packetType !== PacketType.PONG) {
            var packetEncodeFunc = this.packetEncodeMap[f.packetType];
            body = packetEncodeFunc(f);
            var header = this.encodeFramer(f, body.length);
            enc.writeBytes(header);
            enc.writeBytes(body);
        }
        else {
            var header = this.encodeFramer(f, 0);
            enc.writeBytes(header);
        }
        return enc.toUint8Array();
    };
    Proto.prototype.decode = function (data) {
        var decode = new Decoder(data);
        var f = this.decodeFramer(decode);
        if (f.packetType === PacketType.PING) {
            return new PingPacket();
        }
        if (f.packetType === PacketType.PONG) {
            return new PongPacket();
        }
        var packetDecodeFunc = this.packetDecodeMap[f.packetType];
        if (packetDecodeFunc == null) {
            console.log('不支持的协议包->', f.packetType);
        }
        return packetDecodeFunc(f, decode);
    };
    // 编码连接
    Proto.prototype.encodeConnect = function (packet) {
        var enc = new Encoder();
        enc.writeUint8(packet.version);
        enc.writeUint8(packet.deviceFlag); // deviceFlag 0x01表示web
        enc.writeString(packet.deviceID);
        enc.writeString(packet.uid);
        enc.writeString(packet.token);
        enc.writeInt64(new BigNumber(packet.clientTimestamp));
        enc.writeString(packet.clientKey);
        return enc.w;
    };
    Proto.prototype.encodeSend = function (packet) {
        var enc = new Encoder();
        // setting
        enc.writeByte(packet.setting.toUint8());
        // messageID
        enc.writeInt32(packet.clientSeq);
        // clientMsgNo
        if (!packet.clientMsgNo || packet.clientMsgNo === '') {
            packet.clientMsgNo = getUUID();
        }
        enc.writeString(packet.clientMsgNo);
        // channel
        enc.writeString(packet.channelID);
        enc.writeByte(packet.channelType);
        if (serverVersion >= 3) {
            enc.writeInt32(packet.expire || 0);
        }
        // msg key
        var payload = Uint8Array.from(enc.stringToUint(SecurityManager.shared().encryption2(packet.payload)));
        var msgKey = SecurityManager.shared().encryption(packet.veritifyString(payload));
        enc.writeString(Md5.init(msgKey));
        // topic
        var setting = packet.setting;
        if (setting.topic) {
            enc.writeString(packet.topic || "");
        }
        // payload
        if (payload) {
            enc.writeBytes(Array.from(payload));
        }
        return enc.w;
    };
    Proto.prototype.encodeSub = function (packet) {
        var enc = new Encoder();
        enc.writeByte(packet.setting);
        enc.writeString(packet.clientMsgNo);
        enc.writeString(packet.channelID);
        enc.writeByte(packet.channelType);
        enc.writeByte(packet.action);
        enc.writeString(packet.param || '');
        return enc.w;
    };
    Proto.prototype.decodeSuback = function (f, decode) {
        var p = new SubackPacket();
        p.from(f);
        p.clientMsgNo = decode.readString();
        p.channelID = decode.readString();
        p.channelType = decode.readByte();
        p.action = decode.readByte();
        p.reasonCode = decode.readByte();
        return p;
    };
    Proto.prototype.encodeRecvack = function (packet) {
        var enc = new Encoder();
        enc.writeInt64(new BigNumber(packet.messageID));
        enc.writeInt32(packet.messageSeq);
        return enc.w;
    };
    Proto.prototype.decodeConnect = function (f, decode) {
        var p = new ConnackPacket();
        p.from(f);
        if (f.hasServerVersion) {
            p.serverVersion = decode.readByte();
            serverVersion = p.serverVersion;
            console.log("服务器协议版本:", serverVersion);
        }
        p.timeDiff = decode.readInt64();
        p.reasonCode = decode.readByte();
        p.serverKey = decode.readString();
        p.salt = decode.readString();
        if (p.serverVersion >= 4) {
            p.nodeId = decode.readInt64();
        }
        return p;
    };
    Proto.prototype.decodeDisconnect = function (f, decode) {
        var p = new DisconnectPacket();
        p.from(f);
        p.reasonCode = decode.readByte();
        p.reason = decode.readString();
        return p;
    };
    Proto.prototype.decodeRecvPacket = function (f, decode) {
        var p = new RecvPacket();
        p.from(f);
        p.setting = Setting.fromUint8(decode.readByte());
        p.msgKey = decode.readString();
        p.fromUID = decode.readString();
        p.channelID = decode.readString();
        p.channelType = decode.readByte();
        if (serverVersion >= 3) {
            p.expire = decode.readInt32();
        }
        p.clientMsgNo = decode.readString();
        p.messageID = decode.readInt64().toString();
        p.messageSeq = decode.readInt32();
        p.timestamp = decode.readInt32();
        var setting = p.setting;
        if (setting.topic) {
            p.topic = decode.readString();
        }
        p.payload = decode.readRemaining();
        return p;
    };
    Proto.prototype.decodeSendackPacket = function (f, decode) {
        var p = new SendackPacket();
        p.from(f);
        p.messageID = decode.readInt64();
        p.clientSeq = decode.readInt32();
        p.messageSeq = decode.readInt32();
        p.reasonCode = decode.readByte();
        return p;
    };
    Proto.prototype.decodeEvent = function (f, decode) {
        var p = new EventPacket();
        p.from(f);
        p.id = decode.readString();
        p.type = decode.readString();
        p.timestamp = decode.readInt64().toNumber();
        p.data = decode.readRemaining();
        return p;
    };
    // 编码头部
    Proto.prototype.encodeFramer = function (f, remainingLength) {
        if (f.packetType === PacketType.PING || f.packetType === PacketType.PONG) {
            return [(f.packetType << 4) | 0];
        }
        var headers = new Array();
        var typeAndFlags = (this.encodeBool(f.dup) << 3) |
            (this.encodeBool(f.syncOnce) << 2) |
            (this.encodeBool(f.reddot) << 1) |
            this.encodeBool(f.noPersist);
        headers.push((f.packetType << 4) | typeAndFlags);
        var vLen = this.encodeVariableLength(remainingLength);
        headers.push.apply(headers, vLen);
        return headers;
    };
    Proto.prototype.decodeFramer = function (decode) {
        var b = decode.readByte();
        var f = new Packet();
        f.noPersist = (b & 0x01) > 0;
        f.reddot = ((b >> 1) & 0x01) > 0;
        f.syncOnce = ((b >> 2) & 0x01) > 0;
        f.dup = ((b >> 3) & 0x01) > 0;
        f.packetType = b >> 4;
        if (f.packetType != PacketType.PING && f.packetType != PacketType.PONG) {
            f.remainingLength = decode.readVariableLength();
        }
        if (f.packetType === PacketType.CONNACK) {
            f.hasServerVersion = (b & 0x01) > 0;
        }
        return f;
    };
    Proto.prototype.encodeBool = function (b) {
        return b ? 1 : 0;
    };
    Proto.prototype.encodeVariableLength = function (len) {
        var ret = new Array();
        while (len > 0) {
            var digit = len % 0x80;
            len = Math.floor(len / 0x80);
            if (len > 0) {
                digit |= 0x80;
            }
            ret.push(digit);
        }
        return ret;
    };
    return Proto;
}());
// 获取uuid
function getUUID() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

var Guid = /** @class */ (function () {
    function Guid(guid) {
        if (!guid) {
            throw new TypeError("Invalid argument; `value` has no value.");
        }
        this.value = Guid.EMPTY;
        if (guid && Guid.isGuid(guid)) {
            this.value = guid;
        }
    }
    Guid.isGuid = function (guid) {
        var value = guid.toString();
        return guid && (guid instanceof Guid || Guid.validator.test(value));
    };
    Guid.create = function () {
        return new Guid([Guid.gen(2), Guid.gen(1), Guid.gen(1), Guid.gen(1), Guid.gen(3)].join("-"));
    };
    Guid.createEmpty = function () {
        return new Guid("emptyguid");
    };
    Guid.parse = function (guid) {
        return new Guid(guid);
    };
    Guid.raw = function () {
        return [Guid.gen(2), Guid.gen(1), Guid.gen(1), Guid.gen(1), Guid.gen(3)].join("-");
    };
    Guid.gen = function (count) {
        var out = "";
        for (var i = 0; i < count; i++) {
            // tslint:disable-next-line:no-bitwise
            out += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return out;
    };
    Guid.prototype.equals = function (other) {
        // Comparing string `value` against provided `guid` will auto-call
        // toString on `guid` for comparison
        return Guid.isGuid(other) && this.value === other.toString();
    };
    Guid.prototype.isEmpty = function () {
        return this.value === Guid.EMPTY;
    };
    Guid.prototype.toString = function () {
        return this.value;
    };
    Guid.prototype.toJSON = function () {
        return {
            value: this.value,
        };
    };
    Guid.validator = new RegExp("^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$", "i");
    Guid.EMPTY = "00000000-0000-0000-0000-000000000000";
    return Guid;
}());

// const platformObj: any = getPlatformObj() // 获取平台全局操作对象
var wkconnectSocket;
function getPlatformObj() {
    if (typeof uni !== 'undefined') {
        console.log('UniApp运行环境');
        wkconnectSocket = uni.connectSocket;
        return uni;
    }
    else if (typeof wx !== 'undefined') {
        console.log('小程序运行环境');
        wkconnectSocket = wx.connectSocket;
        return wx;
    }
    else {
        console.log('web运行环境');
        return undefined;
    }
}
var WKWebsocket = /** @class */ (function () {
    function WKWebsocket(addr, platform) {
        this.destory = false;
        this.addr = addr;
        if (platform) {
            this.platform = platform;
        }
        else {
            this.platform = getPlatformObj();
        }
        if (wkconnectSocket) {
            this.ws = wkconnectSocket({
                url: addr,
                success: function () {
                    console.log('打开websocket成功');
                },
                fail: function () {
                    console.log('打开websocket失败');
                },
                complete: function () {
                    // eslint-disable-next-line no-empty-function
                } // TODO: 这里一定要写，不然会返回一个 Promise对象
            });
        }
        else {
            console.log('使用原生websocket');
            this.ws = new WebSocket(this.addr);
            this.ws.binaryType = 'arraybuffer';
        }
        console.log('websocket', this.ws);
    }
    WKWebsocket.prototype.onopen = function (callback) {
        var _this = this;
        if (this.platform) {
            this.ws.onOpen(function () {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback();
                }
            });
        }
        else {
            this.ws.onopen = function () {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback();
                }
            };
        }
    };
    WKWebsocket.prototype.onmessage = function (callback) {
        var _this = this;
        if (this.platform) {
            this.ws.onMessage(function (e) {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback(e.data);
                }
            });
        }
        else {
            this.ws.onmessage = function (e) {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback(e.data);
                }
            };
        }
    };
    WKWebsocket.prototype.onclose = function (callback) {
        var _this = this;
        if (this.platform) {
            this.ws.onClose(function (params) {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback(params);
                }
            });
        }
        else {
            this.ws.onclose = function (e) {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback(e);
                }
            };
        }
    };
    WKWebsocket.prototype.onerror = function (callback) {
        var _this = this;
        if (this.platform) {
            this.ws.onError(function (e) {
                if (callback) {
                    callback(e);
                }
            });
        }
        else {
            this.ws.onerror = function (e) {
                if (_this.destory) {
                    return;
                }
                if (callback) {
                    callback(e);
                }
            };
        }
    };
    WKWebsocket.prototype.send = function (data) {
        if (this.platform) {
            if (data instanceof Uint8Array) {
                this.ws.send({ data: data.buffer });
            }
            else {
                this.ws.send({ data: data });
            }
        }
        else {
            if (this.ws.readyState !== WebSocket.OPEN) {
                console.log('ws尚未连接，无法发送消息: ', this.ws.readyState);
                return;
            }
            this.ws.send(data);
        }
    };
    WKWebsocket.prototype.close = function () {
        this.destory = true;
        this.ws.close();
    };
    return WKWebsocket;
}());

// import * as SignalClient from '@signalapp/signal-client';
var ConnectStatus;
(function (ConnectStatus) {
    ConnectStatus[ConnectStatus["Disconnect"] = 0] = "Disconnect";
    ConnectStatus[ConnectStatus["Connected"] = 1] = "Connected";
    ConnectStatus[ConnectStatus["Connecting"] = 2] = "Connecting";
    ConnectStatus[ConnectStatus["ConnectFail"] = 3] = "ConnectFail";
    ConnectStatus[ConnectStatus["ConnectKick"] = 4] = "ConnectKick";
})(ConnectStatus || (ConnectStatus = {}));
var ConnectionInfo = /** @class */ (function () {
    function ConnectionInfo() {
        this.nodeId = 0;
    }
    return ConnectionInfo;
}());
var ConnectManager = /** @class */ (function () {
    function ConnectManager() {
        this.status = ConnectStatus.Disconnect; // 连接状态
        this.connectStatusListeners = new Array(); // 连接状态监听
        this.connectDelayListeners = new Array(); // 连接延时监听
        // reConnect 重连标记
        this.lockReconnect = false;
        this.pongRespTimeoutInterval = 3000; // pong返回超时间隔 单位毫秒
        this.needReconnect = true; // 是否需要重连
        this.pingRetryCount = 0; // ping重试次数
        this.pingMaxRetryCount = 3; // 最大重试三次ping
        this.tempBufferData = new Array(); // 接受数据临时缓存
        this.sendPacketQueue = []; // 发送队列
        this.pingTime = 0; // ping时间戳
    }
    ConnectManager.shared = function () {
        if (!this.instance) {
            this.instance = new ConnectManager();
        }
        return this.instance;
    };
    ConnectManager.prototype.stopHeart = function () {
        if (this.heartTimer) {
            clearInterval(this.heartTimer);
            this.heartTimer = null;
        }
    };
    ConnectManager.prototype.stopReconnectTimer = function () {
        if (this.reConnectTimeout) {
            clearTimeout(this.reConnectTimeout);
            this.reConnectTimeout = null;
        }
    };
    // 重置心跳
    ConnectManager.prototype.restHeart = function () {
        var _this = this;
        var self = this;
        if (this.heartTimer) {
            clearInterval(this.heartTimer);
        }
        if (this.pongRespTimer) {
            clearTimeout(this.pongRespTimer);
        }
        this.heartTimer = setInterval(function () {
            self.sendPing(); // 发送心跳包
            if (self.pingRetryCount > self.pingMaxRetryCount) {
                _this.notifyConnectDelayListeners(9999); // 连接超时
                console.log('ping没有响应，断开连接。');
                self.onlyDisconnect();
                if (_this.status === ConnectStatus.Disconnect) {
                    self.connect();
                }
            }
            else if (self.pingRetryCount > 1) {
                console.log("\u7B2C" + self.pingRetryCount + "\u6B21\uFF0C\u5C1D\u8BD5ping\u3002");
            }
        }, WKSDK$1.shared().config.heartbeatInterval);
    };
    ConnectManager.prototype.connect = function () {
        this.needReconnect = true;
        this.onlyConnect();
    };
    ConnectManager.prototype.onlyConnect = function () {
        var _this = this;
        if (this.status === ConnectStatus.Connecting) {
            console.log('已在连接中，不再进行连接.');
            return;
        }
        if (WKSDK$1.shared().config.provider.connectAddrCallback != null) {
            var connectAddrCallback = WKSDK$1.shared().config.provider.connectAddrCallback;
            connectAddrCallback(function (addr) {
                _this.connectWithAddr(addr);
            });
        }
        else {
            this.connectWithAddr(WKSDK$1.shared().config.addr);
        }
    };
    ConnectManager.prototype.connectWithAddr = function (addr) {
        var _this = this;
        this.status = ConnectStatus.Connecting;
        this.ws = new WKWebsocket(addr, WKSDK$1.shared().config.platform);
        var self = this;
        this.ws.onopen(function () {
            var _a;
            console.log('onopen...');
            self.tempBufferData = new Array(); // 重置缓存
            var seed = Uint8Array.from(self.stringToUint(Guid.create().toString().replace(/-/g, "")));
            var keyPair = generateKeyPair(seed);
            var pubKey = buffer.Buffer.from(keyPair.public).toString("base64");
            self.dhPrivateKey = keyPair.private;
            var connectPacket = new ConnectPacket();
            connectPacket.clientKey = pubKey;
            connectPacket.version = WKSDK$1.shared().config.protoVersion;
            connectPacket.deviceFlag = WKSDK$1.shared().config.deviceFlag;
            var deviceID = Guid.create().toString().replace(/-/g, "");
            connectPacket.deviceID = deviceID + "W";
            connectPacket.clientTimestamp = new Date().getTime();
            connectPacket.uid = WKSDK$1.shared().config.uid || '';
            connectPacket.token = WKSDK$1.shared().config.token || '';
            var data = self.getProto().encode(connectPacket);
            (_a = self.ws) === null || _a === void 0 ? void 0 : _a.send(data);
        });
        this.ws.onmessage(function (data) {
            self.unpacket(new Uint8Array(data), function (packets) {
                if (packets.length > 0) {
                    for (var _i = 0, packets_1 = packets; _i < packets_1.length; _i++) {
                        var packetData = packets_1[_i];
                        self.onPacket(new Uint8Array(packetData));
                    }
                }
            });
        });
        this.ws.onclose(function (e) {
            console.log('连接关闭！', e);
            if (_this.status !== ConnectStatus.Disconnect) {
                _this.status = ConnectStatus.Disconnect;
                _this.notifyConnectStatusListeners(0);
            }
            if (self.needReconnect) {
                _this.reConnect();
            }
        });
        this.ws.onerror(function (e) {
            console.log('连接出错！', e);
            if (_this.status !== ConnectStatus.Disconnect) {
                _this.status = ConnectStatus.Disconnect;
                _this.notifyConnectStatusListeners(0);
            }
            if (self.needReconnect) {
                _this.reConnect();
            }
        });
    };
    /* tslint:disable */
    ConnectManager.prototype.stringToUint = function (str) {
        var string = unescape(encodeURIComponent(str));
        var charList = string.split('');
        var uintArray = new Array();
        for (var i = 0; i < charList.length; i++) {
            uintArray.push(charList[i].charCodeAt(0));
        }
        return uintArray;
    };
    ConnectManager.prototype.connected = function () {
        return this.status == ConnectStatus.Connected;
    };
    ConnectManager.prototype.disconnect = function () {
        this.needReconnect = false;
        console.log("断开不再重连");
        this.onlyDisconnect();
    };
    ConnectManager.prototype.onlyDisconnect = function () {
        this.stopHeart();
        this.stopReconnectTimer();
        if (this.ws) {
            this.ws.close();
        }
        this.status = ConnectStatus.Disconnect;
    };
    // 重连
    ConnectManager.prototype.reConnect = function () {
        var _this = this;
        if (this.lockReconnect) {
            return;
        }
        console.log('开始重连');
        this.lockReconnect = true;
        if (this.reConnectTimeout) {
            clearTimeout(this.reConnectTimeout);
        }
        var self = this;
        this.reConnectTimeout = setTimeout(function () {
            if (_this.ws) {
                _this.ws.close();
                _this.ws = undefined;
            }
            self.onlyConnect();
            _this.lockReconnect = false;
        }, 3000);
    };
    ConnectManager.prototype.wssend = function (message) {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(this.getProto().encode(message));
    };
    ConnectManager.prototype.unpacket = function (data, callback) {
        var _a;
        try {
            (_a = this.tempBufferData).push.apply(_a, Array.from(data));
            var lenBefore = void 0, lenAfter = void 0;
            var dataList_1 = new Array();
            do {
                lenBefore = this.tempBufferData.length;
                this.tempBufferData = this.unpackOne(this.tempBufferData, function (packetData) {
                    dataList_1.push(packetData);
                });
                lenAfter = this.tempBufferData.length;
                if (lenAfter > 0) {
                    console.log("有粘包！-->", this.tempBufferData);
                }
            } while (lenBefore != lenAfter && lenAfter >= 1);
            if (dataList_1.length > 0) {
                callback(dataList_1);
            }
        }
        catch (error) {
            console.log("解码数据异常---->", error);
            this.reConnect();
        }
    };
    ConnectManager.prototype.unpackOne = function (data, dataCallback) {
        var header = data[0];
        var packetType = header >> 4;
        if (packetType == PacketType.PONG) {
            dataCallback([header]);
            return data.slice(1);
        }
        var length = data.length;
        var fixedHeaderLength = 1;
        var pos = fixedHeaderLength;
        var digit = 0;
        var remLength = 0;
        var multiplier = 1;
        var hasLength = false; //  是否还有长度数据没读完
        var remLengthFull = true; // 剩余长度的字节是否完整
        do {
            if (pos > length - 1) {
                // 这种情况出现了分包，并且分包的位置是长度部分的某个位置。这种情况不处理
                remLengthFull = false;
                break;
            }
            digit = data[pos++];
            remLength += ((digit & 127) * multiplier);
            multiplier *= 128;
            hasLength = (digit & 0x80) != 0;
        } while (hasLength);
        if (!remLengthFull) {
            console.log("包的剩余长度的长度不够完整！");
            return data;
        }
        var remLengthLength = pos - fixedHeaderLength; // 剩余长度的长度
        if (fixedHeaderLength + remLengthLength + remLength > length) {
            // 固定头的长度 + 剩余长度的长度 + 剩余长度 如果大于 总长度说明分包了
            console.log("还有包未到，存入缓存！！！");
            return data;
        }
        else {
            if (fixedHeaderLength + remLengthLength + remLength == length) {
                // 刚好一个包
                dataCallback(data);
                return [];
            }
            else {
                // 粘包  大于1个包
                var packetLength = fixedHeaderLength + remLengthLength + remLength;
                console.log("粘包  大于1个包", "，packetLength:", packetLength, "length:", length);
                dataCallback(data.slice(0, packetLength));
                return data.slice(packetLength);
            }
        }
    };
    ConnectManager.prototype.onPacket = function (data) {
        var p = this.getProto().decode(data);
        if (p.packetType === PacketType.CONNACK) {
            var connackPacket = p;
            if (connackPacket.reasonCode === 1) {
                console.log("\u6210\u529F\u8FDE\u63A5\u5230\u8282\u70B9[" + connackPacket.nodeId + "]");
                WKSDK$1.shared().channelManager.reSubscribe(); // 重置订阅状态
                this.status = ConnectStatus.Connected;
                this.pingRetryCount = 0;
                // 连接成功
                this.restHeart(); // 开启心跳
                var serverPubKey = Uint8Array.from(buffer.Buffer.from(connackPacket.serverKey, "base64"));
                var secret = sharedKey(this.dhPrivateKey, serverPubKey);
                var secretBase64 = buffer.Buffer.from(secret).toString("base64");
                var aesKeyFull = Md5.init(secretBase64);
                SecurityManager.shared().aesKey = aesKeyFull.substring(0, 16);
                if (connackPacket.salt && connackPacket.salt.length > 16) {
                    SecurityManager.shared().aesIV = connackPacket.salt.substring(0, 16);
                }
                else {
                    SecurityManager.shared().aesIV = connackPacket.salt;
                }
                WKSDK$1.shared().chatManager.flushSendingQueue(); // 将发送队列里的消息flush出去
            }
            else {
                console.log('连接失败！错误->', connackPacket.reasonCode);
                this.status = ConnectStatus.ConnectFail;
                this.needReconnect = false; // IM端返回连接失败就不再进行重连。
            }
            this.notifyConnectStatusListeners(connackPacket.reasonCode, connackPacket);
        }
        else if (p.packetType === PacketType.PONG) {
            this.pingRetryCount = 0;
            this.notifyConnectDelayListeners(Date.now() - this.pingTime);
        }
        else if (p.packetType === PacketType.DISCONNECT) { // 服务器要求客户端断开（一般是账号在其他地方登录，被踢）
            var disconnectPacket = p;
            console.log('连接被踢->', disconnectPacket);
            this.status = ConnectStatus.ConnectKick;
            this.needReconnect = false; // IM端返回连接失败就不再进行重连。
            this.notifyConnectStatusListeners(disconnectPacket.reasonCode);
        }
        else if (p.packetType === PacketType.SUBACK) { // 订阅回执
            var subackPacket = p;
            console.log("订阅回执-->", subackPacket.action);
            WKSDK$1.shared().channelManager.handleSuback(subackPacket);
        }
        WKSDK$1.shared().chatManager.onPacket(p);
    };
    ConnectManager.prototype.sendPing = function () {
        this.pingRetryCount++;
        this.pingTime = Date.now();
        this.sendPacket(new PingPacket());
    };
    ConnectManager.prototype.sendPacket = function (p) {
        this.send(this.getProto().encode(p));
    };
    ConnectManager.prototype.send = function (data) {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(data);
    };
    ConnectManager.prototype.getProto = function () {
        return WKSDK$1.shared().config.proto;
    };
    // 添加连接状态监听
    ConnectManager.prototype.addConnectStatusListener = function (listener) {
        this.connectStatusListeners.push(listener);
    };
    ConnectManager.prototype.removeConnectStatusListener = function (listener) {
        var len = this.connectStatusListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.connectStatusListeners[i]) {
                this.connectStatusListeners.splice(i, 1);
                return;
            }
        }
    };
    // 添加连接延时监听
    ConnectManager.prototype.addConnectDelayListener = function (listener) {
        this.connectDelayListeners.push(listener);
    };
    ConnectManager.prototype.removeConnectDelayListener = function (listener) {
        var len = this.connectDelayListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.connectDelayListeners[i]) {
                this.connectDelayListeners.splice(i, 1);
                return;
            }
        }
    };
    ConnectManager.prototype.notifyConnectStatusListeners = function (reasonCode, connectackPacket) {
        var _this = this;
        if (this.connectStatusListeners) {
            this.connectStatusListeners.forEach(function (listener) {
                if (listener) {
                    var connectionInfo = new ConnectionInfo();
                    if (connectackPacket && connectackPacket.nodeId) {
                        connectionInfo.nodeId = connectackPacket.nodeId.toNumber();
                    }
                    listener(_this.status, reasonCode, connectionInfo);
                }
            });
        }
    };
    ConnectManager.prototype.notifyConnectDelayListeners = function (delay) {
        if (this.connectDelayListeners) {
            this.connectDelayListeners.forEach(function (listener) {
                if (listener) {
                    listener(delay);
                }
            });
        }
    };
    ConnectManager.prototype.sendRecvackPacket = function (recvPacket) {
        var _a;
        var packet = new RecvackPacket();
        packet.messageID = recvPacket.messageID;
        packet.messageSeq = recvPacket.messageSeq;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(this.getProto().encode(packet));
    };
    ConnectManager.prototype.close = function () {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
    };
    return ConnectManager;
}());

// ---------- 频道类型 ----------
// 个人频道
var ChannelTypePerson = 1;
// 群聊频道
var ChannelTypeGroup = 2;
// 数据频道
var ChannelTypeData = 7;
var Channel = /** @class */ (function () {
    function Channel(channelID, channelType) {
        this.channelID = channelID;
        this.channelType = channelType;
    }
    Channel.prototype.getChannelKey = function () {
        return this.channelID + "-" + this.channelType;
    };
    Channel.fromChannelKey = function (channelKey) {
        var channelProps = channelKey.split("-");
        if (channelProps.length >= 2) {
            var channelType = parseInt(channelProps[1], 0);
            return new Channel(channelProps[0], channelType);
        }
        return undefined;
    };
    Channel.prototype.isEqual = function (c) {
        if (this.channelID === c.channelID && this.channelType === c.channelType) {
            return true;
        }
        return false;
    };
    return Channel;
}());
// 回应
var Reaction = /** @class */ (function () {
    function Reaction() {
    }
    return Reaction;
}());
function decodePayload(payload) {
    var contentType = 0;
    if (payload && payload.length > 0) {
        var encodedString = String.fromCharCode.apply(null, Array.from(payload));
        var decodedString = decodeURIComponent(escape(encodedString));
        var contentObj = JSON.parse(decodedString);
        if (contentObj) {
            contentType = contentObj.type;
        }
    }
    var messageContent = MessageContentManager.shared().getMessageContent(contentType);
    if (payload && payload.length > 0) {
        messageContent.decode(payload);
    }
    return messageContent;
}
var MessageHeader = /** @class */ (function () {
    function MessageHeader() {
    }
    return MessageHeader;
}());
var MessageStatus;
(function (MessageStatus) {
    MessageStatus[MessageStatus["Wait"] = 0] = "Wait";
    MessageStatus[MessageStatus["Normal"] = 1] = "Normal";
    MessageStatus[MessageStatus["Fail"] = 2] = "Fail";
})(MessageStatus || (MessageStatus = {}));
var Message = /** @class */ (function () {
    function Message(recvPacket) {
        this.header = new MessageHeader();
        this.setting = new Setting(); // 设置
        this.voicePlaying = false; // 语音是否在播放中 （语音消息特有）
        this.voiceReaded = false; // 语音消息是否已读
        this.isDeleted = false; // 是否已删除
        this.remoteExtra = new MessageExtra();
        if (recvPacket) {
            this.header.reddot = recvPacket.reddot;
            this.header.dup = recvPacket.dup;
            this.header.noPersist = recvPacket.noPersist;
            this.header.syncOnce = recvPacket.syncOnce;
            this.setting = recvPacket.setting;
            this.messageID = recvPacket.messageID;
            this.messageSeq = recvPacket.messageSeq;
            this.clientMsgNo = recvPacket.clientMsgNo;
            this.fromUID = recvPacket.fromUID;
            this.channel = new Channel(recvPacket.channelID, recvPacket.channelType);
            this.timestamp = recvPacket.timestamp;
            this.content = decodePayload(recvPacket.payload);
            this.status = MessageStatus.Normal;
        }
    }
    Message.fromSendPacket = function (sendPacket, content) {
        var m = new Message();
        m.header.reddot = true;
        m.setting = sendPacket.setting;
        m.clientMsgNo = sendPacket.clientMsgNo;
        m.clientSeq = sendPacket.clientSeq;
        m.fromUID = sendPacket.fromUID;
        m.channel = new Channel(sendPacket.channelID, sendPacket.channelType);
        if (content) {
            m.content = content;
        }
        else {
            m.content = decodePayload(sendPacket.payload);
        }
        m.timestamp = parseInt((new Date().getTime() / 1000).toString()); /* tslint:disable-line */
        m.status = MessageStatus.Wait;
        return m;
    };
    Object.defineProperty(Message.prototype, "send", {
        // 是否是发送的消息
        get: function () {
            return this.fromUID === WKSDK$1.shared().config.uid;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Message.prototype, "contentType", {
        get: function () {
            return this.content.contentType;
        },
        enumerable: true,
        configurable: true
    });
    return Message;
}());
var MessageExtra = /** @class */ (function () {
    function MessageExtra() {
        this.readedCount = 0;
        this.unreadCount = 0; // 未读数量
        this.revoke = false; // 是否已撤回
        this.editedAt = 0; // 消息编辑时间 （0表示消息未被编辑）
        this.isEdit = false; // 是否编辑
        this.extra = {}; // 扩展数据
        this.extraVersion = 0; // 扩展数据版本 
    }
    return MessageExtra;
}());
var Mention = /** @class */ (function () {
    function Mention() {
    }
    return Mention;
}());
var MessageContent = /** @class */ (function () {
    function MessageContent() {
    }
    Object.defineProperty(MessageContent.prototype, "contentType", {
        get: function () {
            return this._contentType;
        },
        set: function (value) {
            this._contentType = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MessageContent.prototype, "conversationDigest", {
        get: function () {
            return this._conversationDigest;
        },
        set: function (value) {
            this._conversationDigest = value;
        },
        enumerable: true,
        configurable: true
    });
    MessageContent.prototype.encode = function () {
        var contentObj = this.encodeJSON();
        contentObj.type = this.contentType;
        if (this.mention) {
            var mentionObj = {};
            if (this.mention.all) {
                mentionObj["all"] = 1;
            }
            if (this.mention.uids) {
                mentionObj["uids"] = this.mention.uids;
            }
            contentObj["mention"] = mentionObj;
        }
        if (this.reply) {
            contentObj["reply"] = this.reply.encode();
        }
        var contentStr = JSON.stringify(contentObj);
        return stringToUint8Array(contentStr);
    };
    MessageContent.prototype.decode = function (data) {
        var decodedString = uint8ArrayToString(data);
        var contentObj = JSON.parse(decodedString);
        this.contentObj = contentObj;
        if (contentObj) {
            this._contentType = contentObj.type;
        }
        var mentionObj = contentObj["mention"];
        if (mentionObj) {
            var mention = new Mention();
            mention.all = mentionObj["all"] === 1;
            if (mentionObj["uids"]) {
                mention.uids = mentionObj["uids"];
            }
            this.mention = mention;
        }
        var replyObj = contentObj["reply"];
        if (replyObj) {
            var reply = new Reply();
            reply.decode(replyObj);
            this.reply = reply;
        }
        this.visibles = contentObj["visibles"];
        this.invisibles = contentObj["invisibles"];
        this.decodeJSON(contentObj);
    };
    // 是否可见
    MessageContent.prototype.isVisiable = function (uid) {
        if (this.visibles && this.visibles.length > 0) {
            var v = this.visibles.includes(uid);
            if (!v) {
                return false;
            }
        }
        if (this.invisibles && this.invisibles.length > 0) {
            var v = this.invisibles.includes(uid);
            if (v) {
                return false;
            }
        }
        return true;
    };
    // 子类重写
    // tslint:disable-next-line:no-empty
    MessageContent.prototype.decodeJSON = function (content) { };
    // 子类重写
    // tslint:disable-next-line:no-empty
    MessageContent.prototype.encodeJSON = function () {
        return {};
    };
    return MessageContent;
}());
function stringToUint8Array(str) {
    var newStr = unescape(encodeURIComponent(str));
    var arr = new Array();
    for (var i = 0, j = newStr.length; i < j; ++i) {
        arr.push(newStr.charCodeAt(i));
    }
    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array;
}
function uint8ArrayToString(fileData) {
    var encodedString = String.fromCharCode.apply(null, Array.from(fileData));
    var decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}
var MediaMessageContent = /** @class */ (function (_super) {
    __extends(MediaMessageContent, _super);
    function MediaMessageContent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // 处理data
    // tslint:disable-next-line:no-empty
    MediaMessageContent.prototype.dealFile = function () {
    };
    return MediaMessageContent;
}(MessageContent));
// 订阅者
var Subscriber = /** @class */ (function () {
    function Subscriber() {
    }
    return Subscriber;
}());
var ChannelInfo = /** @class */ (function () {
    function ChannelInfo() {
        this.online = false; // 是否在线
        this.lastOffline = 0; // 最后一次离线时间
    }
    return ChannelInfo;
}());
var Conversation = /** @class */ (function () {
    function Conversation() {
        this._logicUnread = 0; // 逻辑未读
        this.timestamp = 0;
        this._reminders = new Array(); // 提醒项
        this.simpleReminders = new Array(); // 除去重复的type了的reminder
    }
    Object.defineProperty(Conversation.prototype, "channelInfo", {
        get: function () {
            return WKSDK$1.shared().channelManager.getChannelInfo(this.channel);
        },
        enumerable: true,
        configurable: true
    });
    Conversation.prototype.isEqual = function (c) {
        if (!c) {
            return false;
        }
        return c.channel.getChannelKey() === this.channel.getChannelKey();
    };
    Object.defineProperty(Conversation.prototype, "isMentionMe", {
        get: function () {
            if (this._isMentionMe === undefined) {
                this.reloadIsMentionMe();
            }
            return this._isMentionMe;
        },
        set: function (isMentionMe) {
            this._isMentionMe = isMentionMe;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Conversation.prototype, "remoteExtra", {
        get: function () {
            if (this._remoteExtra) {
                return this._remoteExtra;
            }
            this._remoteExtra = new ConversationExtra();
            this._remoteExtra.channel = this.channel;
            return this._remoteExtra;
        },
        set: function (remoteExtra) {
            this._remoteExtra = remoteExtra;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Conversation.prototype, "logicUnread", {
        get: function () {
            if (this.remoteExtra.browseTo > 0 && this.lastMessage && this.remoteExtra.browseTo <= this.lastMessage.messageSeq) {
                return this.lastMessage.messageSeq - this.remoteExtra.browseTo;
            }
            return this.unread;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Conversation.prototype, "reminders", {
        get: function () {
            return this._reminders;
        },
        set: function (reminders) {
            this._reminders = reminders;
            var simpleReminders = new Array();
            if (reminders && reminders.length > 0) {
                for (var _i = 0, reminders_1 = reminders; _i < reminders_1.length; _i++) {
                    var reminder = reminders_1[_i];
                    if (reminder.done) {
                        continue;
                    }
                    var exist = false;
                    var i = 0;
                    for (var _a = 0, simpleReminders_1 = simpleReminders; _a < simpleReminders_1.length; _a++) {
                        var simpleReminder = simpleReminders_1[_a];
                        if (reminder.reminderType === simpleReminder.reminderType) {
                            exist = true;
                            break;
                        }
                        i++;
                    }
                    if (!exist) {
                        simpleReminders.push(reminder);
                    }
                    else {
                        simpleReminders[i] = reminder;
                    }
                }
            }
            this.simpleReminders = simpleReminders;
        },
        enumerable: true,
        configurable: true
    });
    // 重新计算 isMentionMe
    Conversation.prototype.reloadIsMentionMe = function () {
        if (this.lastMessage && this.lastMessage.content) {
            var mention = this.lastMessage.content.mention;
            if (mention) {
                if (mention.all) {
                    this._isMentionMe = true;
                }
                if (mention.uids && mention.uids.includes(WKSDK$1.shared().config.uid || "")) {
                    this._isMentionMe = true;
                }
            }
        }
        if (!this._isMentionMe) {
            this._isMentionMe = false;
        }
    };
    return Conversation;
}());
var ConversationExtra = /** @class */ (function () {
    function ConversationExtra() {
    }
    return ConversationExtra;
}());
// export class ConversationHistory {
//     conversation!:Conversation
//     recents:Array<Message> = new Array() // 会话的最新消息集合
//     version!:number // 数据版本
// }
var SignalKey = /** @class */ (function () {
    function SignalKey() {
    }
    return SignalKey;
}());
var Reply = /** @class */ (function () {
    function Reply() {
    }
    Reply.prototype.encode = function () {
        var rep = {
            "message_id": this.messageID,
            "message_seq": this.messageSeq,
            "from_uid": this.fromUID,
            "from_name": this.fromName
        };
        if (this.rootMessageID) {
            rep["root_message_id"] = this.rootMessageID;
        }
        if (this.content) {
            try {
                rep["payload"] = JSON.parse(uint8ArrayToString(this.content.encode()));
            }
            catch (e) {
                console.error(e);
            }
        }
        return rep;
    };
    Reply.prototype.decode = function (data) {
        this.messageID = data["message_id"];
        this.messageSeq = data["message_seq"];
        this.fromUID = data["from_uid"];
        this.fromName = data["from_name"];
        this.rootMessageID = data["root_message_id"];
        if (data["payload"]) {
            var contentType = data["payload"]["type"];
            var messageContent = WKSDK$1.shared().getMessageContent(contentType);
            var payload = stringToUint8Array(JSON.stringify(data["payload"]));
            messageContent.decode(payload);
            this.content = messageContent;
        }
    };
    return Reply;
}());
var ReminderType;
(function (ReminderType) {
    ReminderType[ReminderType["ReminderTypeMentionMe"] = 1] = "ReminderTypeMentionMe";
    ReminderType[ReminderType["ReminderTypeApplyJoinGroup"] = 2] = "ReminderTypeApplyJoinGroup"; // 申请加群
})(ReminderType || (ReminderType = {}));
var Reminder = /** @class */ (function () {
    function Reminder() {
        this.isLocate = false; // 是否需要进行消息定位
        this.version = 0;
        this.done = false; // 用户是否完成提醒
    }
    Reminder.prototype.isEqual = function (c) {
        if (this.reminderID === c.reminderID) {
            return true;
        }
        return false;
    };
    return Reminder;
}());
var PullMode;
(function (PullMode) {
    PullMode[PullMode["Down"] = 0] = "Down";
    PullMode[PullMode["Up"] = 1] = "Up"; // 向上拉取
})(PullMode || (PullMode = {}));
// 详细参考文档说明：https://githubim.com/api/message#%E8%8E%B7%E5%8F%96%E6%9F%90%E9%A2%91%E9%81%93%E6%B6%88%E6%81%AF
var SyncOptions = /** @class */ (function () {
    function SyncOptions() {
        this.startMessageSeq = 0; // 开始消息列号（结果包含start_message_seq的消息）
        this.endMessageSeq = 0; //  结束消息列号（结果不包含end_message_seq的消息）0表示不限制
        this.limit = 30; // 每次限制数量
        this.pullMode = PullMode.Down; // 拉取模式 0:向下拉取 1:向上拉取
    }
    return SyncOptions;
}());
var MessageContentManager = /** @class */ (function () {
    function MessageContentManager() {
        this.contentMap = new Map();
    }
    MessageContentManager.shared = function () {
        if (!this.instance) {
            this.instance = new MessageContentManager();
        }
        return this.instance;
    };
    MessageContentManager.prototype.register = function (contentType, handler) {
        this.contentMap.set(contentType, handler);
    };
    MessageContentManager.prototype.registerFactor = function (factor) {
        this.factor = factor;
    };
    MessageContentManager.prototype.getMessageContent = function (contentType) {
        var handler = this.contentMap.get(contentType);
        if (handler) {
            // tslint:disable-next-line:no-shadowed-variable
            var content_1 = handler(contentType);
            if (content_1) {
                return content_1;
            }
        }
        var content = this.factor(contentType);
        if (content) {
            return content;
        }
        return new UnknownContent();
    };
    return MessageContentManager;
}());
/**
 * 文本
 */
var MessageText = /** @class */ (function (_super) {
    __extends(MessageText, _super);
    function MessageText(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    Object.defineProperty(MessageText.prototype, "conversationDigest", {
        get: function () {
            return this.text || "";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MessageText.prototype, "contentType", {
        get: function () {
            return MessageContentType.text;
        },
        enumerable: true,
        configurable: true
    });
    MessageText.prototype.decodeJSON = function (content) {
        this.text = content["content"];
    };
    MessageText.prototype.encodeJSON = function () {
        return { content: this.text || '' };
    };
    return MessageText;
}(MessageContent));
var MessageImage = /** @class */ (function (_super) {
    __extends(MessageImage, _super);
    function MessageImage(file, width, height) {
        var _this = _super.call(this) || this;
        _this.file = file;
        _this.width = width || 0;
        _this.height = height || 0;
        return _this;
    }
    Object.defineProperty(MessageImage.prototype, "url", {
        get: function () {
            return this._url;
        },
        set: function (ul) {
            this._url = ul;
            this.remoteUrl = ul;
        },
        enumerable: true,
        configurable: true
    });
    MessageImage.prototype.decodeJSON = function (content) {
        this.width = content["width"] || 0;
        this.height = content["height"] || 0;
        this.url = content["url"] || '';
        this.remoteUrl = this.url;
    };
    MessageImage.prototype.encodeJSON = function () {
        var ul = this.remoteUrl;
        if (!ul || ul.length === 0) {
            ul = this.url;
        }
        return { "width": this.width || 0, "height": this.height || 0, "url": ul || "" };
    };
    Object.defineProperty(MessageImage.prototype, "contentType", {
        get: function () {
            return MessageContentType.image;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MessageImage.prototype, "conversationDigest", {
        get: function () {
            return "[图片]";
        },
        enumerable: true,
        configurable: true
    });
    return MessageImage;
}(MediaMessageContent));
var MessageStream = /** @class */ (function (_super) {
    __extends(MessageStream, _super);
    function MessageStream(data) {
        var _this = _super.call(this) || this;
        _this.data = data;
        return _this;
    }
    Object.defineProperty(MessageStream.prototype, "contentType", {
        get: function () {
            return MessageContentType.stream;
        },
        enumerable: true,
        configurable: true
    });
    MessageStream.prototype.decodeJSON = function (content) {
        var dataBase64 = content["data"];
        if (dataBase64 && dataBase64.length > 0) {
            this.data = Uint8Array.from(Buffer.from(dataBase64, 'base64')).buffer;
        }
    };
    MessageStream.prototype.encodeJSON = function () {
        var dataBase64 = Buffer.from(this.data).toString('base64');
        return { data: dataBase64 };
    };
    return MessageStream;
}(MessageContent));
var MessageSignalContent = /** @class */ (function (_super) {
    __extends(MessageSignalContent, _super);
    function MessageSignalContent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(MessageSignalContent.prototype, "contentType", {
        get: function () {
            return MessageContentType.signalMessage;
        },
        enumerable: true,
        configurable: true
    });
    return MessageSignalContent;
}(MessageContent));
/**
 * 未知
 */
var UnknownContent = /** @class */ (function (_super) {
    __extends(UnknownContent, _super);
    function UnknownContent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(UnknownContent.prototype, "contentType", {
        get: function () {
            return MessageContentType.unknown;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UnknownContent.prototype, "conversationDigest", {
        get: function () {
            return "[未知消息]";
        },
        enumerable: true,
        configurable: true
    });
    UnknownContent.prototype.decodeJSON = function (content) {
        this.realContentType = content["type"];
    };
    return UnknownContent;
}(MessageContent));
/**
 * 系统消息
 */
var SystemContent = /** @class */ (function (_super) {
    __extends(SystemContent, _super);
    function SystemContent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SystemContent.prototype.decodeJSON = function (content) {
        this.content = content;
    };
    Object.defineProperty(SystemContent.prototype, "conversationDigest", {
        get: function () {
            return this.displayText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SystemContent.prototype, "displayText", {
        get: function () {
            var extra = this.content["extra"];
            var content = this.content["content"];
            if (extra) {
                var extraArray = extra;
                if (extraArray && extraArray.length > 0) {
                    for (var i = 0; i <= extraArray.length - 1; i++) {
                        var extrMap = extraArray[i];
                        var name_1 = extrMap["name"] || "";
                        // if(WKSDK.shared().config.uid === extrMap["uid"] ) {
                        //     name = "你"
                        // }
                        content = content.replace("{" + i + "}", name_1);
                    }
                }
            }
            return content;
        },
        enumerable: true,
        configurable: true
    });
    return SystemContent;
}(MessageContent));
var CMDContent = /** @class */ (function (_super) {
    __extends(CMDContent, _super);
    function CMDContent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CMDContent.prototype.decodeJSON = function (content) {
        this.cmd = content["cmd"];
        this.param = content["param"];
    };
    Object.defineProperty(CMDContent.prototype, "contentType", {
        get: function () {
            return MessageContentType.cmd;
        },
        enumerable: true,
        configurable: true
    });
    return CMDContent;
}(MessageContent));
var SubscribeOptions = /** @class */ (function () {
    function SubscribeOptions() {
    }
    return SubscribeOptions;
}());
var SubscribeAction;
(function (SubscribeAction) {
    SubscribeAction[SubscribeAction["subscribe"] = 0] = "subscribe";
    SubscribeAction[SubscribeAction["unsubscribe"] = 1] = "unsubscribe"; // 取消订阅
})(SubscribeAction || (SubscribeAction = {}));
var ReasonCode;
(function (ReasonCode) {
    ReasonCode[ReasonCode["unknown"] = 0] = "unknown";
    ReasonCode[ReasonCode["success"] = 1] = "success";
    ReasonCode[ReasonCode["authFail"] = 2] = "authFail";
    ReasonCode[ReasonCode["subscriberNotExist"] = 3] = "subscriberNotExist";
    ReasonCode[ReasonCode["reasonInBlacklist"] = 4] = "reasonInBlacklist";
    ReasonCode[ReasonCode["reasonChannelNotExist"] = 5] = "reasonChannelNotExist";
    ReasonCode[ReasonCode["reasonUserNotOnNode"] = 6] = "reasonUserNotOnNode";
    ReasonCode[ReasonCode["reasonSenderOffline"] = 7] = "reasonSenderOffline";
    ReasonCode[ReasonCode["msgKeyError"] = 8] = "msgKeyError";
    ReasonCode[ReasonCode["payloadDecodeError"] = 9] = "payloadDecodeError";
    ReasonCode[ReasonCode["forwardSendPacketError"] = 10] = "forwardSendPacketError";
    ReasonCode[ReasonCode["notAllowSend"] = 11] = "notAllowSend";
    ReasonCode[ReasonCode["connectKick"] = 12] = "connectKick";
    ReasonCode[ReasonCode["notInWhitelist"] = 13] = "notInWhitelist";
    ReasonCode[ReasonCode["queryTokenError"] = 14] = "queryTokenError";
    ReasonCode[ReasonCode["systemError"] = 15] = "systemError";
    ReasonCode[ReasonCode["channelIDError"] = 16] = "channelIDError";
    ReasonCode[ReasonCode["nodeMatchError"] = 17] = "nodeMatchError";
    ReasonCode[ReasonCode["nodeNotMatch"] = 18] = "nodeNotMatch";
    ReasonCode[ReasonCode["ban"] = 19] = "ban";
    ReasonCode[ReasonCode["notSupportHeader"] = 20] = "notSupportHeader";
    ReasonCode[ReasonCode["clientKeyIsEmpty"] = 21] = "clientKeyIsEmpty";
    ReasonCode[ReasonCode["rateLimit"] = 22] = "rateLimit";
    ReasonCode[ReasonCode["notSupportChannelType"] = 23] = "notSupportChannelType";
})(ReasonCode || (ReasonCode = {}));
var ListenerState = /** @class */ (function () {
    function ListenerState(action, listener, options) {
        this.sending = false; // 是否将要发送
        this.handleOk = false; // 是否已处理
        this.listener = listener;
        this.options = options;
        this.action = action;
    }
    return ListenerState;
}());
var SubscribeContext = /** @class */ (function () {
    function SubscribeContext(channel) {
        this.listenerStates = new Array();
        this.channel = channel;
    }
    return SubscribeContext;
}());
var SubscribeConfig = /** @class */ (function () {
    function SubscribeConfig() {
    }
    SubscribeConfig.prototype.withParam = function (param) {
        return function (opts) {
            opts.param = param;
        };
    };
    return SubscribeConfig;
}());
var subscribeConfig = new SubscribeConfig();

var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["wait"] = 0] = "wait";
    TaskStatus[TaskStatus["success"] = 1] = "success";
    TaskStatus[TaskStatus["processing"] = 2] = "processing";
    TaskStatus[TaskStatus["fail"] = 3] = "fail";
    TaskStatus[TaskStatus["suspend"] = 4] = "suspend";
    TaskStatus[TaskStatus["cancel"] = 5] = "cancel";
})(TaskStatus || (TaskStatus = {}));
var TaskManager = /** @class */ (function () {
    function TaskManager() {
        this.taskMap = new Map();
        this.listeners = new Array();
    }
    TaskManager.prototype.addTask = function (task) {
        var _this = this;
        this.taskMap.set(task.id, task);
        task.addListener(function () {
            _this.notifyListeners(task);
        });
        task.start();
    };
    TaskManager.prototype.removeTask = function (id) {
        var task = this.taskMap.get(id);
        if (task) {
            task.cancel();
            this.taskMap.delete(id);
        }
    };
    TaskManager.prototype.addListener = function (listener) {
        this.listeners.push(listener);
    };
    TaskManager.prototype.removeListener = function (listener) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.listeners[i]) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };
    TaskManager.prototype.notifyListeners = function (task) {
        if (this.listeners) {
            this.listeners.forEach(function (callback) {
                callback(task);
            });
        }
    };
    return TaskManager;
}());
var BaseTask = /** @class */ (function () {
    function BaseTask() {
    }
    // tslint:disable-next-line:no-empty
    BaseTask.prototype.start = function () {
    };
    // tslint:disable-next-line:no-empty
    BaseTask.prototype.suspend = function () {
    };
    // tslint:disable-next-line:no-empty
    BaseTask.prototype.resume = function () {
    };
    // tslint:disable-next-line:no-empty
    BaseTask.prototype.cancel = function () {
    };
    BaseTask.prototype.update = function () {
        if (this.listeners) {
            this.listeners.forEach(function (callback) {
                callback();
            });
        }
    };
    BaseTask.prototype.progress = function () {
        return 0;
    };
    BaseTask.prototype.addListener = function (listener) {
        this.listeners.push(listener);
    };
    BaseTask.prototype.removeListener = function (listener) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.listeners[i]) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };
    Object.defineProperty(BaseTask.prototype, "listeners", {
        get: function () {
            if (!this._listeners) {
                this._listeners = new Array();
            }
            return this._listeners;
        },
        enumerable: true,
        configurable: true
    });
    return BaseTask;
}());
var MessageTask = /** @class */ (function (_super) {
    __extends(MessageTask, _super);
    function MessageTask(message) {
        var _this = _super.call(this) || this;
        _this.id = message.clientMsgNo;
        _this.message = message;
        return _this;
    }
    return MessageTask;
}(BaseTask));

var WKEventManager = /** @class */ (function () {
    function WKEventManager() {
        // 事件监听
        this.eventListeners = new Array();
    }
    WKEventManager.shared = function () {
        if (!this.instance) {
            this.instance = new WKEventManager();
        }
        return this.instance;
    };
    // 添加事件监听
    WKEventManager.prototype.addEventListener = function (listener) {
        this.eventListeners.push(listener);
    };
    // 移除事件监听
    WKEventManager.prototype.removeEventListener = function (listener) {
        var len = this.eventListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.eventListeners[i]) {
                this.eventListeners.splice(i, 1);
                return;
            }
        }
    };
    // 通知event监听者
    WKEventManager.prototype.notifyEventListeners = function (event) {
        if (this.eventListeners) {
            this.eventListeners.forEach(function (listener) {
                if (listener) {
                    listener(event);
                }
            });
        }
    };
    return WKEventManager;
}());
var WKEvent = /** @class */ (function (_super) {
    __extends(WKEvent, _super);
    function WKEvent(packet) {
        var _this = _super.call(this) || this;
        _this.id = packet.id;
        _this.type = packet.type;
        _this.timestamp = packet.timestamp;
        _this.data = packet.data;
        var text = String.fromCharCode.apply(null, Array.from(packet.data));
        _this.dataJson = JSON.parse(decodeURIComponent(escape(text)));
        return _this;
    }
    return WKEvent;
}(EventPacket));

var ChatManager = /** @class */ (function () {
    function ChatManager() {
        var _this = this;
        this.cmdListeners = new Array(); // 命令类消息监听
        this.listeners = new Array(); // 收取消息监听
        this.sendingQueues = new Map(); // 发送中的消息
        this.sendPacketQueue = []; // 发送队列
        this.sendStatusListeners = new Array(); // 消息状态监听
        this.clientSeq = 0;
        if (WKSDK$1.shared().taskManager) {
            WKSDK$1.shared().taskManager.addListener(function (task) {
                if (task.status === TaskStatus.success) {
                    if (task instanceof MessageTask) {
                        var messageTask = task;
                        var sendPacket = _this.sendingQueues.get(messageTask.message.clientSeq);
                        if (sendPacket) {
                            sendPacket.payload = messageTask.message.content.encode(); // content需要重新编码
                            WKSDK$1.shared().connectManager.sendPacket(sendPacket);
                        }
                    }
                }
            });
        }
    }
    ChatManager.shared = function () {
        if (!this.instance) {
            this.instance = new ChatManager();
        }
        return this.instance;
    };
    ChatManager.prototype.onPacket = function (packet) {
        return __awaiter(this, void 0, void 0, function () {
            var recvPacket, actMsgKey, actMsgKeyMD5, message, sendack, event_1;
            return __generator(this, function (_a) {
                if (packet instanceof RecvPacket) {
                    recvPacket = packet;
                    actMsgKey = SecurityManager.shared().encryption(recvPacket.veritifyString);
                    actMsgKeyMD5 = Md5.init(actMsgKey);
                    if (actMsgKeyMD5 !== recvPacket.msgKey) {
                        console.log("\u975E\u6CD5\u7684\u6D88\u606F\uFF0C\u671F\u671BmsgKey:" + recvPacket.msgKey + " \u5B9E\u9645msgKey:" + actMsgKeyMD5 + " \u5FFD\u7565\u6B64\u6D88\u606F\uFF01\uFF01");
                        return [2 /*return*/];
                    }
                    recvPacket.payload = SecurityManager.shared().decryption(recvPacket.payload);
                    console.log("消息内容-->", recvPacket);
                    message = new Message(recvPacket);
                    this.sendRecvackPacket(recvPacket);
                    if (message.contentType === MessageContentType.cmd) { // 命令类消息分流处理
                        this.notifyCMDListeners(message);
                        return [2 /*return*/];
                    }
                    // 通知消息监听者
                    this.notifyMessageListeners(message);
                    WKSDK$1.shared().channelManager.notifySubscribeIfNeed(message); // 通知指定的订阅者
                }
                else if (packet instanceof SendackPacket) {
                    sendack = packet;
                    this.sendingQueues.delete(sendack.clientSeq);
                    // 发送消息回执
                    this.notifyMessageStatusListeners(sendack);
                }
                else if (packet instanceof EventPacket) { // 事件消息
                    event_1 = new WKEvent(packet);
                    WKEventManager.shared().notifyEventListeners(event_1);
                }
                return [2 /*return*/];
            });
        });
    };
    ChatManager.prototype.syncMessages = function (channel, opts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!WKSDK$1.shared().config.provider.syncMessagesCallback) {
                    throw new Error("没有设置WKSDK.shared().config.provider.syncMessagesCallback");
                }
                return [2 /*return*/, WKSDK$1.shared().config.provider.syncMessagesCallback(channel, opts)];
            });
        });
    };
    ChatManager.prototype.syncMessageExtras = function (channel, extraVersion) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!WKSDK$1.shared().config.provider.syncMessageExtraCallback) {
                    throw new Error("没有设置WKSDK.shared().config.provider.syncMessageExtraCallback");
                }
                return [2 /*return*/, WKSDK$1.shared().config.provider.syncMessageExtraCallback(channel, extraVersion, 100)];
            });
        });
    };
    ChatManager.prototype.sendRecvackPacket = function (recvPacket) {
        var packet = new RecvackPacket();
        packet.noPersist = recvPacket.noPersist;
        packet.syncOnce = recvPacket.syncOnce;
        packet.reddot = recvPacket.reddot;
        packet.messageID = recvPacket.messageID;
        packet.messageSeq = recvPacket.messageSeq;
        WKSDK$1.shared().connectManager.sendPacket(packet);
    };
    /**
     *  发送消息
     * @param content  消息内容
     * @param channel 频道对象
     * @param setting  发送设置
     * @returns 完整消息对象
     */
    ChatManager.prototype.send = function (content, channel, setting) {
        return __awaiter(this, void 0, void 0, function () {
            var opts;
            return __generator(this, function (_a) {
                opts = new SendOptions();
                opts.setting = setting || new Setting();
                return [2 /*return*/, this.sendWithOptions(content, channel, opts)];
            });
        });
    };
    ChatManager.prototype.sendWithOptions = function (content, channel, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var packet, message, task;
            return __generator(this, function (_a) {
                packet = this.getSendPacketWithOptions(content, channel, opts);
                this.sendingQueues.set(packet.clientSeq, packet);
                message = Message.fromSendPacket(packet, content);
                if (content instanceof MediaMessageContent) {
                    if (!content.file) { // 没有文件，直接上传
                        console.log("不需要上传", content.remoteUrl);
                        this.sendSendPacket(packet);
                    }
                    else {
                        console.log("开始上传");
                        task = WKSDK$1.shared().config.provider.messageUploadTask(message);
                        if (task) {
                            console.log("上传任务添加成功");
                            WKSDK$1.shared().taskManager.addTask(task);
                        }
                        else {
                            console.log("没有实现上传数据源");
                        }
                    }
                }
                else {
                    this.sendSendPacket(packet);
                }
                this.notifyMessageListeners(message);
                return [2 /*return*/, message];
            });
        });
    };
    ChatManager.prototype.sendSendPacket = function (p) {
        var _this = this;
        this.sendPacketQueue.push(p);
        if (!this.sendTimer) {
            this.sendTimer = setInterval(function () {
                var sendData = new Array();
                var sendCount = 0;
                while (_this.sendPacketQueue.length > 0) {
                    var packet = _this.sendPacketQueue.shift();
                    if (packet) {
                        var packetData = Array.from(WKSDK$1.shared().config.proto.encode(packet));
                        sendData.push.apply(sendData, packetData);
                    }
                    sendCount++;
                    if (sendCount >= WKSDK$1.shared().config.sendCountOfEach) {
                        break;
                    }
                }
                if (sendData.length > 0) {
                    WKSDK$1.shared().connectManager.send(new Uint8Array(sendData));
                }
            }, WKSDK$1.shared().config.sendFrequency);
        }
    };
    ChatManager.prototype.getSendPacket = function (content, channel, setting) {
        if (setting === void 0) { setting = new Setting(); }
        var packet = new SendPacket();
        packet.setting = setting;
        packet.reddot = true;
        packet.clientMsgNo = Guid.create().toString().replace(/-/gi, "") + "3";
        packet.clientSeq = this.getClientSeq();
        packet.fromUID = WKSDK$1.shared().config.uid || '';
        packet.channelID = channel.channelID;
        packet.channelType = channel.channelType;
        packet.payload = content.encode();
        return packet;
    };
    ChatManager.prototype.getSendPacketWithOptions = function (content, channel, opts) {
        if (opts === void 0) { opts = new SendOptions(); }
        var setting = opts.setting || new Setting();
        var packet = new SendPacket();
        packet.reddot = opts.reddot;
        packet.noPersist = opts.noPersist;
        packet.setting = setting;
        packet.reddot = true;
        packet.clientMsgNo = Guid.create().toString().replace(/-/gi, "") + "_" + WKSDK$1.shared().config.clientMsgDeviceId + "_3";
        packet.clientSeq = this.getClientSeq();
        packet.fromUID = WKSDK$1.shared().config.uid || '';
        packet.channelID = channel.channelID;
        packet.channelType = channel.channelType;
        packet.payload = content.encode();
        return packet;
    };
    ChatManager.prototype.getClientSeq = function () {
        return ++this.clientSeq;
    };
    // 通知命令消息监听者
    ChatManager.prototype.notifyCMDListeners = function (message) {
        if (this.cmdListeners) {
            this.cmdListeners.forEach(function (listener) {
                if (listener) {
                    listener(message);
                }
            });
        }
    };
    // 添加命令类消息监听
    ChatManager.prototype.addCMDListener = function (listener) {
        this.cmdListeners.push(listener);
    };
    ChatManager.prototype.removeCMDListener = function (listener) {
        var len = this.cmdListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.cmdListeners[i]) {
                this.cmdListeners.splice(i, 1);
                return;
            }
        }
    };
    // 添加消息监听
    ChatManager.prototype.addMessageListener = function (listener) {
        this.listeners.push(listener);
    };
    // 移除消息监听
    ChatManager.prototype.removeMessageListener = function (listener) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.listeners[i]) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };
    // 通知消息监听者
    ChatManager.prototype.notifyMessageListeners = function (message) {
        if (this.listeners) {
            this.listeners.forEach(function (listener) {
                if (listener) {
                    listener(message);
                }
            });
        }
    };
    // 通知消息状态改变监听者
    ChatManager.prototype.notifyMessageStatusListeners = function (sendackPacket) {
        if (this.sendStatusListeners) {
            this.sendStatusListeners.forEach(function (listener) {
                if (listener) {
                    listener(sendackPacket);
                }
            });
        }
    };
    // 消息状态改变监听
    ChatManager.prototype.addMessageStatusListener = function (listener) {
        this.sendStatusListeners.push(listener);
    };
    ChatManager.prototype.removeMessageStatusListener = function (listener) {
        var len = this.sendStatusListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.sendStatusListeners[i]) {
                this.sendStatusListeners.splice(i, 1);
                return;
            }
        }
    };
    // 将发送消息队列里的消息flush出去
    ChatManager.prototype.flushSendingQueue = function () {
        if (this.sendingQueues.size <= 0) {
            return;
        }
        console.log("flush \u53D1\u9001\u961F\u5217\u5185\u7684\u6D88\u606F\u3002\u6570\u91CF" + this.sendingQueues.size);
        var clientSeqArray = new Array();
        this.sendingQueues.forEach(function (value, key) {
            clientSeqArray.push(key);
        });
        clientSeqArray = clientSeqArray.sort();
        for (var _i = 0, clientSeqArray_1 = clientSeqArray; _i < clientSeqArray_1.length; _i++) {
            var clientSeq = clientSeqArray_1[_i];
            var sendPacket = this.sendingQueues.get(clientSeq);
            if (sendPacket) {
                console.log("重试消息---->", sendPacket);
                WKSDK$1.shared().connectManager.sendPacket(sendPacket);
            }
        }
    };
    ChatManager.prototype.deleteMessageFromSendingQueue = function (clientSeq) {
        this.sendingQueues.delete(clientSeq);
    };
    return ChatManager;
}());
var SendOptions = /** @class */ (function () {
    function SendOptions() {
        this.setting = new Setting(); // setting
        this.noPersist = false; // 是否不存储
        this.reddot = true; // 是否显示红点
    }
    return SendOptions;
}());

var ChannelManager = /** @class */ (function () {
    function ChannelManager() {
        // 频道基础信息map
        this.channelInfocacheMap = {};
        // 请求队列
        this.requestQueueMap = new Map();
        this.listeners = new Array(); // 监听改变
        // 频道成员缓存信息map
        this.subscribeCacheMap = new Map();
        // 成员请求队列
        this.requestSubscribeQueueMap = new Map();
        // 成员改变监听
        this.subscriberChangeListeners = new Array();
        // 频道删除监听
        this.deleteChannelInfoListeners = new Array();
        this.subscriberContexts = new Array(); // 订阅者上下文集合
        this.subscriberContextTick = 0; // 订阅者上下文tick
    }
    ChannelManager.shared = function () {
        if (!this.instance) {
            this.instance = new ChannelManager();
            // this.instance.subscriberContextTick = window.setInterval(() => {
            //     this.instance.executeSubscribeContext();
            // }, 2000)
        }
        return this.instance;
    };
    // 提取频道信息
    ChannelManager.prototype.fetchChannelInfo = function (channel) {
        return __awaiter(this, void 0, void 0, function () {
            var channelKey, has, channelInfoModel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        channelKey = channel.getChannelKey();
                        has = this.requestQueueMap.get(channelKey);
                        if (has) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 4, 5]);
                        this.requestQueueMap.set(channelKey, true);
                        if (!(WKSDK$1.shared().config.provider.channelInfoCallback != null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, WKSDK$1.shared().config.provider.channelInfoCallback(channel)];
                    case 2:
                        channelInfoModel = _a.sent();
                        this.channelInfocacheMap[channelKey] = channelInfoModel;
                        if (channelInfoModel) {
                            this.notifyListeners(channelInfoModel);
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        // 移除请求任务
                        this.requestQueueMap.delete(channelKey);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // 同步订阅者
    ChannelManager.prototype.syncSubscribes = function (channel) {
        return __awaiter(this, void 0, void 0, function () {
            var channelKey, has, cacheSubscribers, version, lastMember, subscribers, _i, subscribers_1, subscriber, update, j, cacheSubscriber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        channelKey = channel.getChannelKey();
                        has = this.requestSubscribeQueueMap.get(channelKey);
                        if (has) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        this.requestSubscribeQueueMap.set(channelKey, true);
                        cacheSubscribers = this.subscribeCacheMap.get(channelKey);
                        version = 0;
                        if (cacheSubscribers && cacheSubscribers.length > 0) {
                            lastMember = cacheSubscribers[cacheSubscribers.length - 1];
                            version = lastMember.version;
                        }
                        else {
                            cacheSubscribers = new Array();
                        }
                        return [4 /*yield*/, WKSDK$1.shared().config.provider.syncSubscribersCallback(channel, version || 0)];
                    case 2:
                        subscribers = _a.sent();
                        if (subscribers && subscribers.length > 0) {
                            for (_i = 0, subscribers_1 = subscribers; _i < subscribers_1.length; _i++) {
                                subscriber = subscribers_1[_i];
                                update = false;
                                for (j = 0; j < cacheSubscribers.length; j++) {
                                    cacheSubscriber = cacheSubscribers[j];
                                    if (subscriber.uid === cacheSubscriber.uid) {
                                        update = true;
                                        cacheSubscribers[j] = subscriber;
                                        break;
                                    }
                                }
                                if (!update) {
                                    cacheSubscribers.push(subscriber);
                                }
                            }
                        }
                        this.subscribeCacheMap.set(channelKey, cacheSubscribers);
                        // 通知监听器
                        this.notifySubscribeChangeListeners(channel);
                        return [3 /*break*/, 4];
                    case 3:
                        this.requestSubscribeQueueMap.delete(channelKey);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ChannelManager.prototype.getChannelInfo = function (channel) {
        return this.channelInfocacheMap[channel.getChannelKey()];
    };
    // 设置频道缓存
    ChannelManager.prototype.setChannleInfoForCache = function (channelInfo) {
        this.channelInfocacheMap[channelInfo.channel.getChannelKey()] = channelInfo;
    };
    // 删除频道信息
    ChannelManager.prototype.deleteChannelInfo = function (channel) {
        var channelInfo = this.channelInfocacheMap[channel.getChannelKey()];
        delete this.channelInfocacheMap[channel.getChannelKey()];
        return channelInfo;
    };
    ChannelManager.prototype.getSubscribes = function (channel) {
        var subscribers = this.subscribeCacheMap.get(channel.getChannelKey());
        var newSubscribers = new Array();
        if (subscribers) {
            for (var _i = 0, subscribers_2 = subscribers; _i < subscribers_2.length; _i++) {
                var subscriber = subscribers_2[_i];
                if (!subscriber.isDeleted) {
                    newSubscribers.push(subscriber);
                }
            }
        }
        return newSubscribers;
    };
    // 获取我在频道内的信息
    ChannelManager.prototype.getSubscribeOfMe = function (channel) {
        var subscribers = this.subscribeCacheMap.get(channel.getChannelKey());
        if (subscribers) {
            for (var _i = 0, subscribers_3 = subscribers; _i < subscribers_3.length; _i++) {
                var subscriber = subscribers_3[_i];
                if (!subscriber.isDeleted && subscriber.uid === WKSDK$1.shared().config.uid) {
                    return subscriber;
                }
            }
        }
        return null;
    };
    ChannelManager.prototype.addSubscriberChangeListener = function (listener) {
        this.subscriberChangeListeners.push(listener);
    };
    ChannelManager.prototype.removeSubscriberChangeListener = function (listener) {
        var len = this.subscriberChangeListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.subscriberChangeListeners[i]) {
                this.subscriberChangeListeners.splice(i, 1);
                return;
            }
        }
    };
    // 添加删除频道信息监听
    ChannelManager.prototype.addDeleteChannelInfoListener = function (listener) {
        this.deleteChannelInfoListeners.push(listener);
    };
    // 移除删除频道信息监听
    ChannelManager.prototype.removeDeleteChannelInfoListener = function (listener) {
        var len = this.deleteChannelInfoListeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.deleteChannelInfoListeners[i]) {
                this.deleteChannelInfoListeners.splice(i, 1);
                return;
            }
        }
    };
    ChannelManager.prototype.addListener = function (listener) {
        this.listeners.push(listener);
    };
    ChannelManager.prototype.removeListener = function (listener) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.listeners[i]) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };
    // 通知成员监听变化
    ChannelManager.prototype.notifySubscribeChangeListeners = function (channel) {
        if (this.subscriberChangeListeners) {
            this.subscriberChangeListeners.forEach(function (callback) {
                callback(channel);
            });
        }
    };
    ChannelManager.prototype.notifyListeners = function (channelInfoModel) {
        if (this.listeners) {
            this.listeners.forEach(function (callback) {
                callback(channelInfoModel);
            });
        }
    };
    ChannelManager.prototype.notifySubscribeIfNeed = function (msg) {
        var subscribeContext = this.getSubscribeContext(msg.channel);
        if (subscribeContext && subscribeContext.listenerStates) {
            for (var _i = 0, _a = subscribeContext.listenerStates; _i < _a.length; _i++) {
                var listenerState = _a[_i];
                if (listenerState.listener && listenerState.action === SubscribeAction.subscribe) {
                    listenerState.listener(msg);
                }
            }
        }
    };
    ChannelManager.prototype.onSubscribe = function (ch, listener) {
        var opts = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            opts[_i - 2] = arguments[_i];
        }
        // 参数设置
        var subscribeOpts = new SubscribeOptions();
        if (opts && opts.length > 0) {
            for (var _a = 0, opts_1 = opts; _a < opts_1.length; _a++) {
                var opt = opts_1[_a];
                opt(subscribeOpts);
            }
        }
        // 频道
        var channel;
        var channelData;
        var channelType = ChannelTypeData;
        if (ch instanceof Channel) {
            channelType = ch.channelType;
            channelData = this.parseChannelURL(ch.channelID);
        }
        else {
            channelData = this.parseChannelURL(ch);
        }
        channel = new Channel(channelData.channelID, channelType);
        subscribeOpts.param = channelData.paramMap;
        // 设置上下文
        var subscriberContext = this.getSubscribeContext(channel);
        if (!subscriberContext) {
            subscriberContext = new SubscribeContext(channel);
            this.subscriberContexts.push(subscriberContext);
        }
        var exist = false;
        if (subscriberContext.listenerStates.length > 0) {
            for (var _b = 0, _c = subscriberContext.listenerStates; _b < _c.length; _b++) {
                var listenerState = _c[_b];
                if (listenerState.action === SubscribeAction.subscribe) {
                    listenerState.handleOk = false;
                    listenerState.listener = listener;
                    listenerState.options = subscribeOpts;
                    exist = true;
                    break;
                }
            }
        }
        if (!exist) {
            subscriberContext.listenerStates.push(new ListenerState(SubscribeAction.subscribe, listener, subscribeOpts));
        }
        console.log("onSubscribe-->", subscriberContext.listenerStates.length);
        this.executeSubscribeContext();
    };
    ChannelManager.prototype.parseChannelURL = function (channelUrl) {
        var data = channelUrl.split("?");
        if (data.length > 1) {
            var query = data[1];
            var paramMap = new Map();
            var querys = query.split("&");
            for (var _i = 0, querys_1 = querys; _i < querys_1.length; _i++) {
                var q = querys_1[_i];
                var queryData = q.split("=");
                if (queryData.length > 1) {
                    paramMap.set(queryData[0], queryData[1]);
                }
            }
            return { channelID: data[0], paramMap: paramMap };
        }
        else {
            return { channelID: channelUrl, paramMap: new Map() };
        }
    };
    ChannelManager.prototype.onUnsubscribe = function (ch, listener) {
        // 频道
        var channel;
        var channelData;
        var channelType = ChannelTypeData;
        if (ch instanceof Channel) {
            channelType = ch.channelType;
            channelData = this.parseChannelURL(ch.channelID);
        }
        else {
            channelData = this.parseChannelURL(ch);
        }
        channel = new Channel(channelData.channelID, channelType);
        var subscriberContext = this.getSubscribeContext(channel);
        if (!subscriberContext) {
            subscriberContext = new SubscribeContext(channel);
            this.subscriberContexts.push(subscriberContext);
        }
        var exist = false;
        if (subscriberContext.listenerStates.length > 0) {
            for (var _i = 0, _a = subscriberContext.listenerStates; _i < _a.length; _i++) {
                var listenerState = _a[_i];
                if (listenerState.action === SubscribeAction.unsubscribe) {
                    listenerState.handleOk = false;
                    listenerState.listener = listener;
                    exist = true;
                    break;
                }
            }
        }
        if (!exist) {
            subscriberContext.listenerStates.push(new ListenerState(SubscribeAction.unsubscribe, listener));
        }
        this.executeSubscribeContext();
    };
    // 重新订阅
    ChannelManager.prototype.reSubscribe = function () {
        for (var _i = 0, _a = this.subscriberContexts; _i < _a.length; _i++) {
            var subscriberContext = _a[_i];
            for (var _b = 0, _c = subscriberContext.listenerStates; _b < _c.length; _b++) {
                var listenerState = _c[_b];
                listenerState.handleOk = false;
                listenerState.sending = false;
            }
        }
        this.executeSubscribeContext();
    };
    ChannelManager.prototype.handleSuback = function (ack) {
        for (var _i = 0, _a = this.subscriberContexts; _i < _a.length; _i++) {
            var subscriberContext = _a[_i];
            if (ack.channelID === subscriberContext.channel.channelID && ack.channelType === subscriberContext.channel.channelType) {
                if (ack.action === SubscribeAction.subscribe) {
                    if (subscriberContext.listenerStates && subscriberContext.listenerStates.length > 0) {
                        for (var _b = 0, _c = subscriberContext.listenerStates; _b < _c.length; _b++) {
                            var listenerState = _c[_b];
                            if (listenerState.handleOk) {
                                continue;
                            }
                            listenerState.handleOk = true;
                            if (listenerState.listener && listenerState.action === SubscribeAction.subscribe) {
                                var subscribeListener = listenerState.listener;
                                subscribeListener(undefined, ack.reasonCode);
                            }
                        }
                    }
                }
                else {
                    if (subscriberContext.listenerStates && subscriberContext.listenerStates.length > 0) {
                        for (var _d = 0, _e = subscriberContext.listenerStates; _d < _e.length; _d++) {
                            var listenerState = _e[_d];
                            if (listenerState.handleOk) {
                                continue;
                            }
                            listenerState.handleOk = true;
                            if (listenerState.listener && listenerState.action === SubscribeAction.unsubscribe) {
                                var unsubscribeListener = listenerState.listener;
                                unsubscribeListener(ack.reasonCode);
                            }
                        }
                    }
                }
            }
        }
        if (ack.action === SubscribeAction.unsubscribe) {
            for (var i = 0; i < this.subscriberContexts.length; i++) {
                var subscriberContext = this.subscriberContexts[i];
                if (subscriberContext.channel.channelID === ack.channelID && subscriberContext.channel.channelType === ack.channelType) {
                    this.subscriberContexts.splice(i, 1);
                    continue;
                }
            }
        }
    };
    ChannelManager.prototype.getSubscribeContext = function (channel) {
        for (var _i = 0, _a = this.subscriberContexts; _i < _a.length; _i++) {
            var subscriberContext = _a[_i];
            if (subscriberContext.channel.channelID === channel.channelID && subscriberContext.channel.channelType === channel.channelType) {
                return subscriberContext;
            }
        }
        return undefined;
    };
    ChannelManager.prototype.executeSubscribeContext = function () {
        for (var _i = 0, _a = this.subscriberContexts; _i < _a.length; _i++) {
            var subscriberContext = _a[_i];
            if (subscriberContext && subscriberContext.listenerStates.length > 0) {
                for (var _b = 0, _c = subscriberContext.listenerStates; _b < _c.length; _b++) {
                    var listenerState = _c[_b];
                    if (listenerState.handleOk || listenerState.sending) {
                        continue;
                    }
                    listenerState.sending = true;
                    this.sendSubscribe(subscriberContext.channel, listenerState.action, listenerState.options);
                }
            }
        }
    };
    ChannelManager.prototype.sendSubscribe = function (channel, action, opts) {
        console.log("sendSubscribe---->", action);
        var s = new SubPacket();
        s.channelID = channel.channelID;
        s.channelType = channel.channelType;
        s.action = action;
        if (opts === null || opts === void 0 ? void 0 : opts.param) {
            s.param = JSON.stringify(Object.fromEntries(opts === null || opts === void 0 ? void 0 : opts.param));
        }
        WKSDK$1.shared().connectManager.sendPacket(s);
    };
    return ChannelManager;
}());

var ConversationAction;
(function (ConversationAction) {
    ConversationAction[ConversationAction["add"] = 0] = "add";
    ConversationAction[ConversationAction["update"] = 1] = "update";
    ConversationAction[ConversationAction["remove"] = 2] = "remove";
})(ConversationAction || (ConversationAction = {}));
var ConversationManager = /** @class */ (function () {
    function ConversationManager() {
        var _this = this;
        this.listeners = new Array(); // 最近会话通知
        this.conversations = new Array(); // 最近会话列表
        this.maxExtraVersion = 0; // 最大扩展的版本号
        this._noUpdateContentType = []; // 不更新的消息类型
        ChatManager.shared().addMessageListener(function (message) {
            if (_this._noUpdateContentType.indexOf(message.contentType) >= 0) {
                return;
            }
            _this.updateOrAddConversation(message);
        });
    }
    ConversationManager.prototype.addNoUpdateContentType = function (contentType) {
        this._noUpdateContentType.push(contentType);
    };
    ConversationManager.prototype.removeNoUpdateContentType = function (contentType) {
        var index = this._noUpdateContentType.indexOf(contentType);
        if (index >= 0) {
            this._noUpdateContentType.splice(index, 1);
        }
    };
    ConversationManager.shared = function () {
        if (!this.instance) {
            this.instance = new ConversationManager();
        }
        return this.instance;
    };
    // 同步最近会话
    ConversationManager.prototype.sync = function (filter) {
        var _this = this;
        var syncProvide = WKSDK$1.shared().config.provider.syncConversationsCallback(filter);
        if (syncProvide) {
            syncProvide.then(function (conversations) {
                _this.conversations = conversations;
                if (conversations.length > 0) {
                    for (var _i = 0, conversations_1 = conversations; _i < conversations_1.length; _i++) {
                        var conversation = conversations_1[_i];
                        if (conversation.remoteExtra.version > _this.maxExtraVersion) {
                            _this.maxExtraVersion = conversation.remoteExtra.version;
                        }
                    }
                }
                WKSDK$1.shared().reminderManager.sync();
            }).catch(function (err) {
                console.log('同步最近会话失败！', err);
            });
        }
        return syncProvide;
    };
    ConversationManager.prototype.syncExtra = function () {
        return __awaiter(this, void 0, void 0, function () {
            var conversationExtras, _i, conversationExtras_1, conversationExtra, _a, _b, conversation;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!WKSDK$1.shared().config.provider.syncConversationExtrasCallback) {
                            console.log('syncConversationExtrasCallback没有提供');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, WKSDK$1.shared().config.provider.syncConversationExtrasCallback(this.maxExtraVersion)];
                    case 1:
                        conversationExtras = _c.sent();
                        if (conversationExtras) {
                            for (_i = 0, conversationExtras_1 = conversationExtras; _i < conversationExtras_1.length; _i++) {
                                conversationExtra = conversationExtras_1[_i];
                                if (conversationExtra.version > this.maxExtraVersion) {
                                    this.maxExtraVersion = conversationExtra.version;
                                }
                                for (_a = 0, _b = this.conversations; _a < _b.length; _a++) {
                                    conversation = _b[_a];
                                    if (conversation.channel.isEqual(conversationExtra.channel)) {
                                        conversation.remoteExtra = conversationExtra;
                                        this.notifyConversationListeners(conversation, ConversationAction.update);
                                    }
                                }
                            }
                        }
                        return [2 /*return*/, conversationExtras];
                }
            });
        });
    };
    ConversationManager.prototype.findConversation = function (channel) {
        if (this.conversations) {
            for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
                var conversation = _a[_i];
                if (conversation.channel.isEqual(channel)) {
                    return conversation;
                }
            }
        }
    };
    ConversationManager.prototype.findConversations = function (channels) {
        if (this.conversations && this.conversations.length > 0) {
            var conversations = new Array();
            for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
                var conversation = _a[_i];
                for (var _b = 0, channels_1 = channels; _b < channels_1.length; _b++) {
                    var channel = channels_1[_b];
                    if (conversation.channel.isEqual(channel)) {
                        conversations.push(conversation);
                        break;
                    }
                }
            }
            return conversations;
        }
    };
    // 创建一个空会话
    ConversationManager.prototype.createEmptyConversation = function (channel) {
        var conversation = this.findConversation(channel);
        if (conversation) {
            conversation.timestamp = new Date().getTime() / 1000;
            this.notifyConversationListeners(conversation, ConversationAction.update);
            return conversation;
        }
        else {
            var newConversation = new Conversation();
            newConversation.channel = channel;
            newConversation.timestamp = new Date().getTime() / 1000;
            this.conversations = __spreadArrays([newConversation], this.conversations);
            this.notifyConversationListeners(newConversation, ConversationAction.add);
            return newConversation;
        }
    };
    ConversationManager.prototype.updateOrAddConversation = function (message) {
        var conversation = this.findConversation(message.channel);
        var newConversation;
        if (!conversation) {
            newConversation = new Conversation();
            newConversation.unread = 0;
            newConversation.channel = message.channel;
            newConversation.timestamp = message.timestamp;
            if (!message.send && message.header.reddot && (!this.openConversation || !this.openConversation.channel.isEqual(message.channel))) {
                newConversation.unread++;
            }
            newConversation.lastMessage = message;
            this.conversations = __spreadArrays([newConversation], this.conversations);
            this.notifyConversationListeners(newConversation, ConversationAction.add);
        }
        else {
            if (!message.send && message.header.reddot && (!this.openConversation || !this.openConversation.channel.isEqual(message.channel))) {
                conversation.unread++;
            }
            conversation.timestamp = message.timestamp;
            conversation.lastMessage = message;
            newConversation = conversation;
            this.notifyConversationListeners(newConversation, ConversationAction.update);
        }
    };
    ConversationManager.prototype.removeConversation = function (channel) {
        if (!this.conversations || this.conversations.length === 0) {
            return;
        }
        var oldConversation;
        for (var index = 0; index < this.conversations.length; index++) {
            var conversation = this.conversations[index];
            if (conversation.channel.isEqual(channel)) {
                this.conversations.splice(index, 1);
                oldConversation = conversation;
            }
        }
        if (oldConversation) {
            this.notifyConversationListeners(oldConversation, ConversationAction.remove);
        }
    };
    ConversationManager.prototype.getAllUnreadCount = function () {
        var unreadCount = 0;
        if (this.conversations) {
            for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
                var conversation = _a[_i];
                unreadCount += conversation.unread;
            }
        }
        return unreadCount;
    };
    // 添加最近会话监听
    ConversationManager.prototype.addConversationListener = function (listener) {
        this.listeners.push(listener);
    };
    // 移除最近监听
    ConversationManager.prototype.removeConversationListener = function (listener) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.listeners[i]) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };
    // 通知最近会话监听者
    ConversationManager.prototype.notifyConversationListeners = function (conversation, action) {
        if (this.listeners) {
            this.listeners.forEach(function (listener) {
                if (listener) {
                    listener(conversation, action);
                }
            });
        }
    };
    return ConversationManager;
}());

var ReminderManager = /** @class */ (function () {
    function ReminderManager() {
        this.reminders = new Array();
    }
    ReminderManager.shared = function () {
        if (!this.instance) {
            this.instance = new ReminderManager();
        }
        return this.instance;
    };
    ReminderManager.prototype.sync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var version, reminders, channels, _i, reminders_1, newReminder, exist, index, reminder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!WKSDK$1.shared().config.provider.syncRemindersCallback) {
                            console.log("##########syncRemindersCallback##########");
                            return [2 /*return*/];
                        }
                        version = this.maxReminderVersion();
                        return [4 /*yield*/, WKSDK$1.shared().config.provider.syncRemindersCallback(version)];
                    case 1:
                        reminders = _a.sent();
                        if (reminders && reminders.length > 0) {
                            channels = new Set();
                            for (_i = 0, reminders_1 = reminders; _i < reminders_1.length; _i++) {
                                newReminder = reminders_1[_i];
                                channels.add(newReminder.channel);
                                exist = false;
                                for (index = 0; index < this.reminders.length; index++) {
                                    reminder = this.reminders[index];
                                    if (newReminder.reminderID === reminder.reminderID) {
                                        this.reminders[index] = newReminder;
                                        exist = true;
                                        break;
                                    }
                                }
                                if (!exist) {
                                    this.reminders.push(newReminder);
                                }
                            }
                            this.updateConversations(Array.from(channels));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ReminderManager.prototype.done = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var reminders, _i, reminders_2, reminder, channels;
            return __generator(this, function (_a) {
                if (!WKSDK$1.shared().config.provider.reminderDoneCallback) {
                    console.log("##########reminderDoneCallback##########");
                    return [2 /*return*/];
                }
                reminders = this.getRemindersWithIDs(ids);
                if (reminders && reminders.length > 0) {
                    for (_i = 0, reminders_2 = reminders; _i < reminders_2.length; _i++) {
                        reminder = reminders_2[_i];
                        reminder.done = true;
                    }
                    channels = this.getChannelWithReminders(reminders);
                    this.updateConversations(channels);
                }
                return [2 /*return*/, WKSDK$1.shared().config.provider.reminderDoneCallback(ids)];
            });
        });
    };
    ReminderManager.prototype.getChannelWithReminders = function (reminders) {
        if (!reminders || reminders.length === 0) {
            return [];
        }
        var channels = new Set();
        for (var _i = 0, reminders_3 = reminders; _i < reminders_3.length; _i++) {
            var reminder = reminders_3[_i];
            channels.add(reminder.channel);
        }
        return Array.from(channels);
    };
    ReminderManager.prototype.updateConversations = function (channels) {
        var conversations = ConversationManager.shared().findConversations(channels);
        if (conversations && conversations.length > 0) {
            for (var _i = 0, conversations_1 = conversations; _i < conversations_1.length; _i++) {
                var conversation = conversations_1[_i];
                conversation.reminders = this.getWaitDoneReminders(conversation.channel);
                ConversationManager.shared().notifyConversationListeners(conversation, ConversationAction.update);
            }
        }
    };
    ReminderManager.prototype.getWaitDoneReminders = function (channel) {
        var channelReminders = new Array();
        for (var _i = 0, _a = this.reminders; _i < _a.length; _i++) {
            var reminder = _a[_i];
            if (reminder.channel.isEqual(channel)) {
                channelReminders.push(reminder);
            }
        }
        return channelReminders;
    };
    ReminderManager.prototype.getRemindersWithIDs = function (ids) {
        var newReminders = new Array();
        for (var _i = 0, _a = this.reminders; _i < _a.length; _i++) {
            var reminder = _a[_i];
            for (var _b = 0, ids_1 = ids; _b < ids_1.length; _b++) {
                var id = ids_1[_b];
                if (reminder.reminderID === id) {
                    newReminders.push(reminder);
                    break;
                }
            }
        }
        return newReminders;
    };
    ReminderManager.prototype.maxReminderVersion = function () {
        var maxVersion = 0;
        for (var _i = 0, _a = this.reminders; _i < _a.length; _i++) {
            var reminder = _a[_i];
            if (reminder.version > maxVersion) {
                maxVersion = reminder.version;
            }
        }
        return maxVersion;
    };
    return ReminderManager;
}());

var Provider = /** @class */ (function () {
    function Provider() {
    }
    // // 获取IM连接地址
    // public set connectAddrCallback(callback: (callback: ConnectAddrCallback) => void) {
    //     this._connectAddrCallback = callback
    // }
    // public get connectAddrCallback(): (callback: ConnectAddrCallback) => void {
    //     return this._connectAddrCallback
    // }
    // 获取频道信息
    // public set channelInfoCallback(callback: ChannelInfoCallback) {
    //     this._channelInfoCallback = callback
    // }
    // public get channelInfoCallback(): ChannelInfoCallback {
    //     return this._channelInfoCallback
    // }
    // 获取频道订阅者
    // public set syncSubscribersCallback(callback: SyncSubscribersCallback) {
    //     this._syncSubscribersCallback = callback
    // }
    // public get syncSubscribersCallback(): SyncSubscribersCallback {
    //     return this._syncSubscribersCallback
    // }
    // 消息上传任务回调
    // public set messageUploadTaskCallback(callback: MessageUploadTaskCallback) {
    //     this._messageUploadTaskCallback = callback
    // }
    // 获取消息上传任务
    Provider.prototype.messageUploadTask = function (message) {
        if (this.messageUploadTaskCallback) {
            return this.messageUploadTaskCallback(message);
        }
    };
    return Provider;
}());

// This file is auto-generated during build process
var SDK_VERSION = "1.3.5";

var WKConfig = /** @class */ (function () {
    function WKConfig() {
        this.debug = false; // 是否开启debug模式
        this.protoVersion = 5; // 协议版本号
        this.deviceFlag = 1; // 设备标识  0: app 1. web 2. pc
        this.proto = new Proto();
        this.heartbeatInterval = 60000; // 心跳频率 单位毫秒
        this.receiptFlushInterval = 2000; // 回执flush间隔 单位为毫秒ms
        this.sdkVersion = SDK_VERSION; // SDK版本号
        this.sendFrequency = 100; // 发送频率 单位为毫秒ms
        this.sendCountOfEach = 5; // 每次同时发送消息数量
        this.clientMsgDeviceId = 0; // 客户端消息设备id, 如果设置了每条消息的clientMsgNo里将带这个标记
        this.provider = new Provider();
    }
    return WKConfig;
}());

var ReceiptManager = /** @class */ (function () {
    function ReceiptManager() {
        this.listeners = new Array(); // 回执监听
        this.channelMessagesMap = new Map();
    }
    ReceiptManager.shared = function (flushInterval) {
        if (flushInterval === void 0) { flushInterval = 2000; }
        if (!this.instance) {
            this.instance = new ReceiptManager();
            this.instance.setup(flushInterval);
        }
        return this.instance;
    };
    ReceiptManager.prototype.setup = function (flushInterval) {
        this.timer = setInterval(this.flushLoop.bind(this), flushInterval);
    };
    // 添加需要回执的消息
    ReceiptManager.prototype.addReceiptMessages = function (channel, messages) {
        if (!messages || messages.length === 0) {
            return;
        }
        var existMessages = this.channelMessagesMap.get(channel.getChannelKey());
        if (!existMessages) {
            existMessages = [];
        }
        for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
            var message = messages_1[_i];
            if (!message.remoteExtra.readed) {
                existMessages.push(message);
            }
        }
        this.channelMessagesMap.set(channel.getChannelKey(), existMessages);
    };
    ReceiptManager.prototype.flush = function (channelKey) {
        var _this = this;
        if (!WKSDK$1.shared().config.provider.messageReadedCallback) {
            throw new Error("没有设置WKSDK.shared().config.provider.messageReadedCallback");
        }
        var messages = this.channelMessagesMap.get(channelKey);
        var tmpMessages = new Array();
        var flushCachedLen = 0;
        if (messages && messages.length > 0) {
            flushCachedLen = messages.length;
            for (var _i = 0, messages_2 = messages; _i < messages_2.length; _i++) {
                var message = messages_2[_i];
                tmpMessages.push(message);
            }
        }
        if (tmpMessages.length === 0) {
            return;
        }
        var channel = Channel.fromChannelKey(channelKey);
        WKSDK$1.shared().config.provider.messageReadedCallback(channel, tmpMessages).then(function () {
            _this.removeCacheWithLength(channelKey, flushCachedLen);
            _this.notifyListeners(channel, tmpMessages);
        });
    };
    ReceiptManager.prototype.removeCacheWithLength = function (channelKey, len) {
        var cacheMessages = this.channelMessagesMap.get(channelKey);
        var tmpArray = new Array();
        if (!cacheMessages) {
            return;
        }
        for (var _i = 0, cacheMessages_1 = cacheMessages; _i < cacheMessages_1.length; _i++) {
            var message = cacheMessages_1[_i];
            tmpArray.push(message);
        }
        var actLen = len;
        if (tmpArray.length < len) {
            actLen = tmpArray.length;
        }
        for (var index = 0; index < actLen; index++) {
            var message = tmpArray[index];
            for (var k = 0; k < cacheMessages.length; k++) {
                var element = cacheMessages[k];
                if (message.clientMsgNo === element.clientMsgNo) {
                    cacheMessages.splice(k, 1);
                    break;
                }
            }
        }
    };
    ReceiptManager.prototype.flushLoop = function () {
        var _this = this;
        this.channelMessagesMap.forEach(function (value, channelKey) {
            _this.flush(channelKey);
        });
    };
    // 添加命令类消息监听
    ReceiptManager.prototype.addListener = function (listener) {
        this.listeners.push(listener);
    };
    ReceiptManager.prototype.removeListener = function (listener) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (listener === this.listeners[i]) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };
    // 通知监听者
    ReceiptManager.prototype.notifyListeners = function (channel, messages) {
        if (this.listeners) {
            this.listeners.forEach(function (listener) {
                if (listener) {
                    listener(channel, messages);
                }
            });
        }
    };
    return ReceiptManager;
}());

var WKSDK = /** @class */ (function () {
    function WKSDK() {
    }
    WKSDK.shared = function () {
        if (!this.instance) {
            this.instance = new WKSDK();
            this.instance.init();
        }
        return this.instance;
    };
    WKSDK.prototype.init = function () {
        var _this = this;
        this.config = new WKConfig();
        this.taskManager = new TaskManager();
        this.messageContentManager = MessageContentManager.shared();
        this.connectManager = ConnectManager.shared();
        this.chatManager = ChatManager.shared();
        this.channelManager = ChannelManager.shared();
        this.conversationManager = ConversationManager.shared();
        this.securityManager = SecurityManager.shared();
        this.reminderManager = ReminderManager.shared();
        this.receiptManager = ReceiptManager.shared(this.config.receiptFlushInterval);
        this.eventManager = WKEventManager.shared();
        this.registerFactor(function (contentType) {
            if (_this.isSystemMessage(contentType)) {
                return new SystemContent();
            }
            if (contentType === MessageContentType.cmd) {
                return new CMDContent();
            }
            return;
        });
        // 注册文本消息
        this.register(MessageContentType.text, function () { return new MessageText(); });
        // 注册图片消息
        this.register(MessageContentType.image, function () { return new MessageImage(); });
        this.register(MessageContentType.signalMessage, function () { return new MessageSignalContent(); });
    };
    // 注册消息正文
    WKSDK.prototype.register = function (contentType, handler) {
        this.messageContentManager.register(contentType, handler);
    };
    WKSDK.prototype.registerFactor = function (factor) {
        this.messageContentManager.registerFactor(factor);
    };
    WKSDK.prototype.getMessageContent = function (contentType) {
        return this.messageContentManager.getMessageContent(contentType);
    };
    // 是否是系统消息
    WKSDK.prototype.isSystemMessage = function (contentType) {
        return contentType >= 1000 && contentType <= 2000; // 大于等于1000 小于等于2000的为系统消息
    };
    // 连接IM
    WKSDK.prototype.connect = function () {
        this.connectManager.connect();
    };
    // 断开链接
    WKSDK.prototype.disconnect = function () {
        this.connectManager.disconnect();
    };
    // 订阅频道
    WKSDK.prototype.onSubscribe = function (channel, listener) {
        var _a;
        var opts = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            opts[_i - 2] = arguments[_i];
        }
        (_a = this.channelManager).onSubscribe.apply(_a, __spreadArrays([channel, listener], opts));
    };
    // 取消订阅
    WKSDK.prototype.onUnsubscribe = function (channel, listener) {
        this.channelManager.onUnsubscribe(channel, listener);
    };
    WKSDK.prototype.newMessageText = function (text) {
        return new MessageText(text);
    };
    WKSDK.prototype.newChannel = function (channelID, channelType) {
        return new Channel(channelID, channelType);
    };
    WKSDK.prototype.newMessage = function () {
        return new Message();
    };
    WKSDK.prototype.newChannelInfo = function () {
        return new ChannelInfo();
    };
    WKSDK.prototype.newMediaMessageContent = function () {
        return new MediaMessageContent();
    };
    WKSDK.prototype.newMessageContent = function () {
        return new MessageContent();
    };
    return WKSDK;
}());
var WKSDK$1 = WKSDK;
// const self = WKSDK.shared();
// window['wksdk'] = self;  /* tslint:disable-line */ // 这样普通的JS就可以通过window.wksdk获取到app对象
// export default self;

export { BaseTask, CMDContent, Channel, ChannelInfo, ChannelManager, ChannelTypeData, ChannelTypeGroup, ChannelTypePerson, ChatManager, ConnackPacket, ConnectManager, ConnectPacket, ConnectStatus, ConnectionInfo, Conversation, ConversationAction, ConversationExtra, ConversationManager, DisconnectPacket, EventPacket, EventType, ListenerState, MediaMessageContent, Mention, Message, MessageContent, MessageContentManager, MessageContentType, MessageExtra, MessageHeader, MessageImage, MessageSignalContent, MessageStatus, MessageStream, MessageTask, MessageText, Packet, PacketType, PingPacket, PongPacket, Provider, PullMode, Reaction, ReasonCode, RecvPacket, RecvackPacket, Reminder, ReminderType, Reply, SendOptions, SendPacket, SendackPacket, Setting, SignalKey, StreamFlag, SubPacket, SubackPacket, SubscribeAction, SubscribeConfig, SubscribeContext, SubscribeOptions, Subscriber, SyncOptions, SystemContent, TaskManager, TaskStatus, UnknownContent, WKConfig, WKEvent, WKEventManager, WKSDK$1 as WKSDK, WKSDK$1 as default, subscribeConfig };
