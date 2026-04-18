import { Conversation, Message } from "wukongimjssdk";

export class ConversationWrap {
  constructor(conversation) {
    this.conversation = conversation;
  }

  get channel() {
    return this.conversation.channel;
  }

  get channelInfo() {
    return this.conversation.channelInfo;
  }

  get unread() {
    return this.conversation.unread;
  }

  get timestamp() {
    return this.conversation.timestamp;
  }

  set timestamp(timestamp) {
    this.conversation.timestamp = timestamp;
  }

  get timestampString() {
    return getTimeStringAutoShort2(this.timestamp * 1000, true);
  }

  get lastMessage() {
    return this.conversation.lastMessage;
  }

  set lastMessage(lastMessage) {
    this.conversation.lastMessage = lastMessage;
  }

  get isMentionMe() {
    return this.conversation.isMentionMe;
  }

  set isMentionMe(isMentionMe) {
    this.conversation.isMentionMe = isMentionMe;
  }

  get remoteExtra() {
    return this.conversation.remoteExtra;
  }

  get reminders() {
    return this.conversation.reminders;
  }

  get simpleReminders() {
    return this.conversation.simpleReminders;
  }

  get conversationDigest() {
    if (!this.lastMessage) {
      return "";
    }
    if (this.lastMessage.streamOn) {
      return "[流消息]";
    }
    return this.lastMessage.content.conversationDigest;
  }

  reloadIsMentionMe() {
    return this.conversation.reloadIsMentionMe();
  }

  get extra() {
    if (!this.conversation.extra) {
      this.conversation.extra = {};
    }
    return this.conversation.extra;
  }

  isEqual(c) {
    return this.conversation.isEqual(c.conversation);
  }
}

export function getTimeStringAutoShort2(timestamp, mustIncludeTime) {
  const currentDate = new Date();
  const srcDate = new Date(timestamp);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDateD = currentDate.getDate();

  const srcYear = srcDate.getFullYear();
  const srcMonth = srcDate.getMonth() + 1;
  const srcDateD = srcDate.getDate();

  let ret = "";
  const timeExtraStr = mustIncludeTime ? " " + _formatDate(srcDate, "hh:mm") : "";

  if (currentYear === srcYear) {
    const currentTimestamp = currentDate.getTime();
    const srcTimestamp = timestamp;
    const deltaTime = currentTimestamp - srcTimestamp;

    if (currentMonth === srcMonth && currentDateD === srcDateD) {
      ret = deltaTime < 60000 ? "刚刚" : _formatDate(srcDate, "hh:mm");
    } else {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      const beforeYesterdayDate = new Date();
      beforeYesterdayDate.setDate(beforeYesterdayDate.getDate() - 2);

      if (srcMonth === yesterdayDate.getMonth() + 1 && srcDateD === yesterdayDate.getDate()) {
        ret = "昨天" + timeExtraStr;
      } else if (srcMonth === beforeYesterdayDate.getMonth() + 1 && srcDateD === beforeYesterdayDate.getDate()) {
        ret = "前天" + timeExtraStr;
      } else {
        const deltaHour = deltaTime / 3600000;
        if (deltaHour <= 168) {
          const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
          ret = weekday[srcDate.getDay()] + timeExtraStr;
        } else {
          ret = _formatDate(srcDate, "yyyy/M/d") + timeExtraStr;
        }
      }
    }
  } else {
    ret = _formatDate(srcDate, "yyyy/M/d") + timeExtraStr;
  }

  return ret;
}

function dateFormat(date, fmt) {
  return _formatDate(date, fmt);
}

const _formatDate = function(date, fmt) {
  const o = {
    "M+": date.getMonth() + 1,
    "d+": date.getDate(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
    "q+": Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }

  for (const k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    }
  }
  return fmt;
};
