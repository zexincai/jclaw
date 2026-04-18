import { Conversation, MessageContentType, Setting, WKSDK, Message, Stream, Channel, MessageStatus, MessageExtra, MessageContent, MediaMessageContent } from "wukongimjssdk";
import { Buffer } from "buffer";
import BigNumber from "bignumber.js";
class MediaContent extends MediaMessageContent {
  constructor(fileDetail) {
    super();
    console.log("fileDetail", fileDetail);

    this.fileName = fileDetail && fileDetail.fileName ? fileDetail.fileName : ""; // 初始化宽度，默认为 0
    this.fileUrl = fileDetail && fileDetail.fileUrl ? fileDetail.fileUrl : ""; // 初始化高度，默认为 0
    this.size = fileDetail && fileDetail.size ? fileDetail.size : ""; // 初始化高度，默认为 0
  }

  encodeJSON() {
    return {
      fileName: this.fileName,
      size: this.size,
      fileUrl: this.fileUrl // 假设 remoteUrl 来自父类
    };
  }

  decodeJSON(content) {
    // console.log("解码", content);

    this.size = content.size;
    this.fileName = content.fileName;
    this.fileUrl = content.fileUrl;
  }
}
class AIContent extends MessageContent {
  constructor(fileDetail) {
    super();
    this.content = fileDetail ? fileDetail.content : ""; // 初始化宽度，默认为 0
    this.reasoningContent = fileDetail ? fileDetail.reasoningContent : ""; // 初始化高度，默认为 0
  }

  encodeJSON() {
    return {
      content: this.content,
      reasoningContent: this.reasoningContent
    };
  }

  decodeJSON(content) {
    this.content = content.content;
    this.reasoningContent = content.reasoningContent;
  }
}
class VoiceContent extends MediaMessageContent {
  constructor(fileDetail) {
    super();
    this.timeTrad = fileDetail ? fileDetail.timeTrad : ""; // 初始化宽度，默认为 0
    this.url = fileDetail ? fileDetail.url : ""; // 初始化高度，默认为 0
    this.waveform = fileDetail ? fileDetail.waveform : ""; // 初始化高度，默认为 0
  }

  encodeJSON() {
    return {
      timeTrad: this.timeTrad,
      url: this.url,
      waveform: this.waveform // 假设 remoteUrl 来自父类
    };
  }

  decodeJSON(content) {
    this.timeTrad = content.timeTrad;
    this.url = content.url;
    this.waveform = content.waveform;
  }
}
class AISendContent extends MessageContent {
  constructor(fileDetail) {
    super();
    this.msgContent = fileDetail ? fileDetail.msgContent : ""; // 初始化宽度，默认为 0
    this.fileUrl = fileDetail ? fileDetail.fileUrl : ""; // 初始化高度，默认为 0
    this.fileName = fileDetail ? fileDetail.fileName : ""; // 初始化宽度，默认为 0
    this.size = fileDetail ? fileDetail.size : ""; // 初始化高度，默认为 0
  }

  encodeJSON() {
    return {
      msgContent: this.msgContent,
      fileUrl: this.fileUrl,
      fileName: this.fileName, // 初始化宽度，默认为 0
      size: this.size // 初始化高度，默认为 0
    };
  }

  decodeJSON(content) {
    this.msgContent = content.msgContent;
    this.fileUrl = content.fileUrl;
    this.fileName = content.fileName; // 初始化宽度，默认为 0
    this.size = content.size; // 初始化高度，默认为 0
  }
}
WKSDK.shared().register(101, () => new MediaContent());
WKSDK.shared().register(102, () => new VoiceContent());
WKSDK.shared().register(103, () => new AIContent());
WKSDK.shared().register(103, () => new AISendContent());
export class Convert {
  static toMessage(msgMap) {
    const message = new Message();
    if (msgMap.message_idstr) {
      message.messageID = msgMap.message_idstr;
    } else {
      message.messageID = new BigNumber(msgMap.message_id).toString();
    }
    if (msgMap.header) {
      message.header.reddot = msgMap.header.red_dot === 1;
    }
    if (msgMap.setting) {
      message.setting = Setting.fromUint8(msgMap.setting);
    }
    if (msgMap.revoke) {
      message.remoteExtra.revoke = msgMap.revoke === 1;
    }
    if (msgMap.message_extra) {
      const messageExtra = msgMap.message_extra;
      message.remoteExtra = this.toMessageExtra(messageExtra);
    }

    message.clientSeq = msgMap.client_seq;
    message.channel = new Channel(msgMap.channelId, msgMap.channelType);
    message.messageSeq = msgMap.messageSeq;
    message.clientMsgNo = msgMap.client_msg_no;
    message.streamNo = msgMap.stream_no;
    message.streamFlag = msgMap.stream_flag;
    message.fromUID = msgMap.fromUid;
    message.timestamp = msgMap.timestamp;
    message.status = MessageStatus.Normal;

    let contentType = 0;
    try {
      let contentObj = null;
      const payload = msgMap.payload;
      if (payload && payload !== "") {
        const decodedBuffer = Buffer.from(payload, "base64");

        contentObj = JSON.parse(decodedBuffer.toString("utf8"));
        if (contentObj) {
          contentType = contentObj.type;
        }
      }
      const messageContent = WKSDK.shared().getMessageContent(contentType);
      if (contentObj) {
        messageContent.decode(this.stringToUint8Array(JSON.stringify(contentObj)));
      }
      message.content = messageContent;
      message.userName = msgMap.userName;
      message.orgName = msgMap.orgName;
    } catch (e) {
      // console.log("消息解析报错", e);
      // 如果报错，直接设置为unknown
      const messageContent = WKSDK.shared().getMessageContent(MessageContentType.unknown);
      message.content = messageContent;
    }

    message.isDeleted = msgMap.is_deleted === 1;

    const streamMaps = msgMap.streams;
    if (streamMaps && streamMaps.length > 0) {
      const streams = [];
      for (const streamMap of streamMaps) {
        const streamItem = new Stream();
        streamItem.streamNo = streamMap.stream_no;
        streamItem.streamId = streamMap.stream_idstr;
        if (streamMap.payload && streamMap.payload.length > 0) {
          const payload = Buffer.from(streamMap.payload, "base64");
          const payloadObj = JSON.parse(payload.toString("utf8"));
          const payloadType = payloadObj.type;
          const payloadContent = WKSDK.shared().getMessageContent(payloadType);
          if (payloadObj) {
            payloadContent.decode(this.stringToUint8Array(JSON.stringify(payloadObj)));
          }
          streamItem.content = payloadContent;
        }
        streams.push(streamItem);
      }
      message.streams = streams;
    }

    return message;
  }

  static toConversation(conversationMap) {
    const conversation = new Conversation();
    conversation.channel = new Channel(conversationMap.channelId, conversationMap.channelType);
    conversation.unread = conversationMap.unread || 0;
    conversation.timestamp = conversationMap.timestamp || 0;
    const recents = conversationMap.recents;
    if (recents && recents.length > 0) {
      const messageModel = this.toMessage(recents[0]);
      conversation.lastMessage = messageModel;
    }
    conversation.extra = {};
    return conversation;
  }

  static toMessageExtra(msgExtraMap) {
    const messageExtra = new MessageExtra();
    if (msgExtraMap.message_id_str) {
      messageExtra.messageID = msgExtraMap.message_id_str;
    } else {
      messageExtra.messageID = new BigNumber(msgExtraMap.message_id).toString();
    }
    messageExtra.messageSeq = msgExtraMap.message_seq;
    messageExtra.readed = msgExtraMap.readed === 1;
    if (msgExtraMap.readed_at && msgExtraMap.readed_at > 0) {
      messageExtra.readedAt = new Date(msgExtraMap.readed_at);
    }
    messageExtra.revoke = msgExtraMap.revoke === 1;
    if (msgExtraMap.revoker) {
      messageExtra.revoker = msgExtraMap.revoker;
    }
    messageExtra.readedCount = msgExtraMap.readed_count || 0;
    messageExtra.unreadCount = msgExtraMap.unread_count || 0;
    messageExtra.extraVersion = msgExtraMap.extra_version || 0;
    messageExtra.editedAt = msgExtraMap.edited_at || 0;

    const contentEditObj = msgExtraMap.content_edit;
    if (contentEditObj) {
      const contentEditContentType = contentEditObj.type;
      const contentEditContent = WKSDK.shared().getMessageContent(contentEditContentType);
      const contentEditPayloadData = this.stringToUint8Array(JSON.stringify(contentEditObj));
      contentEditContent.decode(contentEditPayloadData);
      messageExtra.contentEditData = contentEditPayloadData;
      messageExtra.contentEdit = contentEditContent;
      messageExtra.isEdit = true;
    }

    return messageExtra;
  }

  static stringToUint8Array(str) {
    const newStr = unescape(encodeURIComponent(str));
    const arr = [];
    for (let i = 0, j = newStr.length; i < j; ++i) {
      arr.push(newStr.charCodeAt(i));
    }
    return new Uint8Array(arr);
  }
}
