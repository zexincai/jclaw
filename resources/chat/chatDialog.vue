<template>
  <div class="chatAllDialog">
    <el-dialog
      :visible.sync="visible"
      v-dialogDrag
      class="chatDialog"
      ref="chatDialog"
      top="10vh"
      :width="smallScreen ? '420px' : $dialogSize.medium"
      @close="close"
      :close-on-click-modal="false"
      v-loading="loading"
      :modal="false"
    >
      <div class="chat" :class="{ 'small-chat': smallScreen }" @click="innerDrawer = false">
        <div class="chat-left" v-if="!lessen" v-show="!smallScreen">
          <div class="chat-left-head">
            <div class="chat-left-head-top">
              <el-input v-model="searchInput" placeholder="搜索">
                <i slot="suffix" class="el-input__icon el-icon-search"></i>
              </el-input>
              <div class="contactsBtn" @click="addChatBtn">
                <img src="../../assets/user-list.png" alt="" />
              </div>
              <!-- <el-button class="contactsBtn" size="small" @click="addChatBtn">📒</el-button> -->
            </div>
          </div>
          <div class="chat-left-list hasScroll" v-if="visible">
            <div class="chat-peo-item" :class="{ nowClick: nowChat === index }" v-for="(item, index) in showChannelList" :key="index" @click="checkChat(item, index)">
              <div class="headImg">
                <div class="avas" v-if="item.channel && item.channel.channelType == 2">
                  <img src="../../assets/groupAvg.png" alt="" />
                </div>
                <el-avatar v-else icon="el-icon-user-solid" :size="50" :src="item.extra ? item.extra.portraitUrl : ''"></el-avatar>
              </div>
              <div class="chat-peo-item-right">
                <el-badge :value="item.unread" :max="99" class="badge" :hidden="!item.unread">
                  <div class="chat-peo-info">
                    <div class="peoName">
                      <div class="userName over-hidden">{{ item.channel && item.channel.channelType == 1 ? item.extra.userName : item.extra.groupName }}</div>
                      <div class="msgTime">{{ renderTime(item.lastMessage) }}</div>
                    </div>
                    <div class="message">
                      {{ item.extra && item.extra.enableStatus ? getGroupTypeMsg(item.extra.enableStatus) : item.lastMessage ? decodeMsg(item.lastMessage.content) : '' }}
                    </div>
                  </div>
                </el-badge>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-right">
          <div class="chat-right-head">
            <div class="btns">
              <i
                class="btn-icon el-icon-more"
                @click.stop="innerDrawer = !innerDrawer"
                v-if="channelDetail.channelType == 2 && !(nowChannel.extra && nowChannel.extra.enableStatus)"
                v-show="!smallScreen"
              ></i>
              <!-- <i class="btn-icon" :class="{'el-icon-copy-document':!smallScreen,'el-icon-full-screen':smallScreen}" @click="screenChange"></i> -->
              <img class="btn-icon" src="@/assets/screenSmall.png" @click="screenChange" v-if="!smallScreen" />
              <img class="btn-icon" src="@/assets/screenBig.png" @click="screenChange" v-else />
              <i class="btn-icon el-icon-close" @click="visible = false"></i>
            </div>
            <div class="headImg" v-if="smallScreen">
              <el-dropdown trigger="click" placement="bottom-start" @command="handleCommand">
                <div>
                  <div class="avas" v-if="channelDetail.channelType == 2">
                    <img src="@/assets/groupAvg.png" alt="" />
                  </div>
                  <el-avatar v-else icon="el-icon-user-solid" :size="30" :src="channelDetail.portraitUrl"></el-avatar>
                </div>
                <el-dropdown-menu slot="dropdown" class="chat-dropdown">
                  <el-dropdown-item class="small-chat-list-item" :class="{ nowClick: nowChat === index }" :command="{...item,index}" v-for="(item,index) in showChannelList" :key="index">
                    <div class="headImg">
                      <div class="avas" v-if="item.channel && item.channel.channelType == 2">
                        <img src="../../assets/groupAvg.png" alt="" />
                      </div>
                      <el-avatar v-else icon="el-icon-user-solid" :size="30" :src="item.extra ? item.extra.portraitUrl : ''"></el-avatar>
                    </div>
                    <span>{{item.channel && item.channel.channelType == 1 ? item.extra.userName : item.extra.groupName}}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <el-tooltip placement="bottom" effect="light" :open-delay="500" :disabled="channelDetail.channelType == 2 || (nowChannel.extra && nowChannel.extra.aiType == 2)" popper-class="tooltipClass">
              <div slot="content" class="channel-peo-detail">
                <div class="headImg">
                  <el-avatar icon="el-icon-user-solid" :src="channelDetail.portraitUrl"></el-avatar>
                </div>
                <div class="channel-peo-right">
                  <div class="channel-peo-info">
                    <div class="peoName over-hidden">{{ channelDetail.userName }}</div>
                    <div class="message" :title="channelDetail.deptName + (channelDetail.deptName && channelDetail.roleName ? '/' + channelDetail.roleName : '')">
                      {{ channelDetail.deptName }}<span v-if="channelDetail.deptName && channelDetail.roleName">/</span>{{ channelDetail.roleName }}
                    </div>
                    <div>
                      <el-tag size="mini">{{ channelDetail.orgName }}</el-tag>
                    </div>
                  </div>
                </div>
              </div>
              <div class="peoName over-hidden" :class="{ figer: !(channelDetail.channelType == 2 || (nowChannel.extra && nowChannel.extra.aiType == 2)) }">
                {{ channelDetail.userName }}
              </div>
            </el-tooltip>
          </div>
          <div class="chat-right-content">
            <div class="chat-right-content-left">
              <div class="chat-list hasScroll" ref="chatList" @scroll="chatScroll">
                <chatMsg
                  @preview="preview"
                  @toBottom="toBottom"
                  :msgContent="item"
                  :userId="user.pkId"
                  v-for="(item, index) in messageList"
                  :timeShow="renderMessageDate(item, index)"
                  :orgShow="channelDetail.channelType == 2"
                  :key="index"
                  :aiLoading="msgLoading && index == messageList.length - 1 && nowChat == 0"
                ></chatMsg>
              </div>
              <div class="chat-input">
                <template v-if="!(nowChannel.extra && nowChannel.extra.enableStatus)">
                  <div class="chat-input-border" :class="{ blueBorder: blueBorder }">
                    <div class="chat-input-operation">
                      <el-popover class="operation-item" popper-class="chat-popover" placement="top-start" :width="380" trigger="click" v-show="nowChat !== 0">
                        <div class="emojiList no-select">
                          <div v-for="emoji in emojis" :key="emoji" @click="insertEmoji(emoji)" class="emoji-item">{{ emoji }}</div>
                        </div>
                        <!-- <el-button size="mini" slot="reference">😀表情</el-button> -->
                        <img src="../../assets/emoji.png" slot="reference" />
                      </el-popover>
                      <!-- <el-button size="mini" icon="el-icon-tickets" class="uploadFile" @click="selFile">文件</el-button> -->
                      <template>
                        <img src="../../assets/uploadfile.png" :class="{ uploadFile: nowChat !== 0 }" @click="selFile" v-if="!(nowChannel.extra.aiType == 2 && aiFile.fileUrl)" />
                        <div class="files" v-else>
                          <img src="@/assets/fileType/word.png" alt="" />
                          <div class="fileName">{{ aiFile.fileName }}</div>
                          <div class="delBtn" @click="aiFileClear">X</div>
                        </div>
                      </template>
                    </div>
                    <div class="chat-input-content">
                      <textarea
                        class="chat_edit"
                        ref="editor"
                        v-model="inputText"
                        :maxlength="nowChannel.extra.aiType == 2 ? 500 : 50000"
                        placeholder="请输入"
                        @focus="blueBorder = true"
                        @blur="blueBorder = false"
                        contenteditable
                        @keydown="Keydown"
                      ></textarea>
                    </div>
                    <div class="chat-input-btn" v-if="smallScreen">
                      <div class="aiTip" v-if="nowChannel.extra.aiType == 2">
                        内容由 AI 生成，请仔细甄别
                      </div>
                      <el-popover popper-class="chat-popover" placement="top-start" trigger="manual" :content="popoverText" v-model="sendPop">
                        <el-button slot="reference" type="text" @click="sendBtn" :disabled="btnDisabled && nowChat == 0">发送</el-button>
                      </el-popover>
                    </div>
                  </div>
                  <div class="chat-input-btn" v-if="!smallScreen">
                    <div class="aiTip" v-if="nowChannel.extra.aiType == 2">
                      内容由 AI 生成，请仔细甄别
                    </div>
                    <el-popover popper-class="chat-popover" v-show="!smallScreen" placement="top-start" trigger="manual" :content="popoverText" v-model="sendPop">
                      <el-button slot="reference" type="primary" @click="sendBtn" :disabled="btnDisabled && nowChat == 0">发送 <i class="el-icon-position"></i></el-button>
                    </el-popover>
                  </div>
                </template>
                <template v-else>
                  <div class="notSend">{{ getGroupTypeMsg(nowChannel.extra.enableStatus) }}</div>
                </template>
              </div>
            </div>
            <div class="chat-right-content-right" v-if="channelDetail.channelType == 2 && !(nowChannel.extra && nowChannel.extra.enableStatus)" v-show="!smallScreen">
              <div class="channel-num">群成员·{{ channelDetail.userInfoList.length }}</div>
              <ul class="channel-peo-list">
                <li v-for="item in channelDetail.userInfoList" :key="item.channelId" :class="{ nowClick: nowChat === item }">
                  <el-tooltip placement="left" effect="light" :open-delay="500" popper-class="tooltipClass">
                    <div slot="content" class="channel-peo-detail">
                      <div class="headImg">
                        <el-avatar icon="el-icon-user-solid" :src="item.portraitUrl"></el-avatar>
                      </div>
                      <div class="channel-peo-right">
                        <div class="channel-peo-info">
                          <div class="peoName over-hidden">{{ item.userName }}</div>
                          <div class="message" :title="item.deptName + (item.deptName && item.roleName ? '/' + item.roleName : '')">
                            {{ item.deptName }}<span v-if="item.deptName && item.roleName">/</span>{{ item.roleName }}
                          </div>
                          <div>
                            <el-tag size="mini">{{ item.orgName }}</el-tag>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="channel-peo-list-item">
                      <div class="channel-icon el-icon-user-solid"></div>
                      <div class="channel-peo-name">{{ item.userName }}</div>
                      <div class="channel-groupware" v-if="item.channelId == channelDetail.groupMasterId">群主</div>
                    </div>
                  </el-tooltip>
                </li>
              </ul>
            </div>
            <div class="groud-manager" v-if="innerDrawer == true" @click="innerDrawer = false">
              <div class="groud-manager-content" @click.stop>
                <template v-if="user.pkId == channelDetail.groupMasterId">
                  <div class="groud-manager-content-item blue" @click.stop="editGroup">
                    <div class="btn-icon el-icon-edit"></div>
                    <div>修改群名</div>
                  </div>
                  <div class="groud-manager-content-item blue" @click.stop="GroupMember">
                    <div class="btn-icon el-icon-user-solid"></div>
                    <div>群成员</div>
                  </div>
                  <div class="groud-manager-content-item red" @click.stop="breakGroup">
                    <div class="btn-icon el-icon-link"></div>
                    <div>解散群聊</div>
                  </div>
                </template>
                <div class="groud-manager-content-item red" @click.stop="exitGroup" v-else>
                  <div class="iconfont icontuichudenglu"></div>
                  <div>退出群聊</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    <addChat ref="addChat" :defaultList="groupList" @addChat="handleAddChat" @save="handleSaveChat" @close="addChatClose" v-if="addChatShow"></addChat>
    <uploadInput ref="files" :loading.sync="loading" :showToast="false" :limitType="nowChat == 0 ? ['.docx'] : []" @success="uploadSuccess" @process="onProcess"></uploadInput>
    <el-dialog title="提示" :visible.sync="editDialog" width="30%" center class="notHead" top="15vw">
      <div class="editGroup">
        <div>群名称</div>
        <el-input v-model="groupName" maxlength="25" show-word-limit></el-input>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleEditGroup">确 定</el-button>
      </span>
    </el-dialog>
    <fileConfurm ref="fileConfurm"></fileConfurm>
  </div>
</template>

<script>
import {
  MessageText,
  Channel,
  WKSDK,
  ChannelTypePerson,
  ChannelTypeGroup,
  MediaMessageContent,
  Conversation,
  Message,
  ChannelInfo,
  ConversationExtra,
  ConversationAction,
  MessageContent
} from 'wukongimjssdk'
import chatMsg from './chatMsg.vue'
import addChat from './addChat.vue'
import { Convert } from './js/convert'
import { getFileType } from '@/utils/commond'
import { getTimeStringAutoShort2 } from './js/conversationWrap'
import fileConfurm from './fileConfurm.vue'
class MediaContent extends MediaMessageContent {
  constructor(fileDetail) {
    super()
    console.log('fileDetail', fileDetail)

    this.fileName = fileDetail ? fileDetail.fileName : '' // 初始化宽度，默认为 0
    this.fileUrl = fileDetail ? fileDetail.fileUrl : '' // 初始化高度，默认为 0
    this.size = fileDetail ? fileDetail.size : '' // 初始化高度，默认为 0
  }
  encodeJSON() {
    return {
      fileName: this.fileName,
      size: this.size,
      fileUrl: this.fileUrl // 假设 remoteUrl 来自父类
    }
  }
  decodeJSON(content) {
    this.size = this.size
    this.fileName = this.fileName
    this.fileUrl = this.fileUrl
  }
}
class AIContent extends MessageContent {
  constructor(fileDetail) {
    super()
    this.content = fileDetail ? fileDetail.content : '' // 初始化宽度，默认为 0
    this.reasoningContent = fileDetail ? fileDetail.reasoningContent : '' // 初始化高度，默认为 0
  }

  encodeJSON() {
    return {
      content: this.content,
      reasoningContent: this.reasoningContent
    }
  }

  decodeJSON(content) {
    this.content = content.content
    this.reasoningContent = content.reasoningContent
  }
}
class AISendContent extends MessageContent {
  constructor(fileDetail) {
    super()
    this.msgContent = fileDetail ? fileDetail.msgContent : '' // 初始化宽度，默认为 0
    this.fileUrl = fileDetail ? fileDetail.fileUrl : '' // 初始化高度，默认为 0
    this.fileName = fileDetail ? fileDetail.fileName : '' // 初始化宽度，默认为 0
    this.size = fileDetail ? fileDetail.size : '' // 初始化高度，默认为 0
  }

  encodeJSON() {
    return {
      msgContent: this.msgContent,
      fileUrl: this.fileUrl,
      fileName: this.fileName, // 初始化宽度，默认为 0
      size: this.size // 初始化高度，默认为 0
    }
  }

  decodeJSON(content) {
    this.msgContent = content.msgContent
    this.fileUrl = content.fileUrl
    this.fileName = content.fileName // 初始化宽度，默认为 0
    this.size = content.size // 初始化高度，默认为 0
  }
}
WKSDK.shared().register(103, () => new AIContent())
WKSDK.shared().register(104, () => new AISendContent())
let timer = null
let btnTimer = null
export default {
  components: {
    chatMsg,
    addChat,
    fileConfurm
  },
  data() {
    return {
      loading: false,
      visible: false,
      linkStatus: 0,
      addrObj: {},
      addr: '',
      colony: 1,
      orgType: '',
      options: [],
      searchInput: '',
      lessen: false,
      nowChannel: {},
      nowChat: 0,
      inputText: '',
      channelList: [],
      channelDetail: {
        userName: '建小优'
      },
      messageList: [],
      emojis: [
        '😀',
        '😁',
        '😂',
        '😃',
        '😄',
        '😅',
        '😆',
        '😉',
        '😊',
        '😋',
        '😎',
        '😍',
        '😘',
        '😗',
        '😙',
        '😚',
        '😇',
        '😐',
        '😑',
        '😶',
        '😏',
        '😣',
        '😥',
        '😮',
        '😯',
        '😪',
        '😫',
        '😴',
        '😌',
        '😛',
        '😜',
        '😝',
        '😒',
        '😓',
        '😔',
        '😕',
        '😲',
        '😷',
        '😖',
        '😞',
        '😟',
        '😤',
        '😢',
        '😭',
        '😦',
        '😧',
        '😨',
        '😬',
        '😰',
        '😱',
        '😳',
        '😵',
        '😡',
        '😠',
        '😈',
        '👿',
        '👹',
        '👺',
        '💀',
        '☠',
        '👻',
        '👽',
        '👾',
        '💣',
        '💋',
        '💌',
        '💘',
        '❤',
        '💓',
        '💔',
        '💕',
        '💖',
        '💗',
        '💙',
        '💚',
        '💛',
        '💜',
        '💝',
        '💞',
        '💟',
        '💏',
        '🧑‍🤝‍🧑',
        '💪',
        '👈',
        '👉',
        '☝',
        '👆',
        '👇',
        '✌',
        '✋',
        '👌',
        '👍',
        '👎',
        '✊',
        '👊',
        '👋',
        '👏',
        '👐',
        '✍'
      ],
      showEmojis: false,
      channelPeoList: [],
      addChatShow: false,
      addObj: {},
      innerDrawer: false,
      editDialog: false,
      groupName: '',
      groupList: [],
      currentContent: '',
      reasoningContent: '',
      msgLoading: false,
      btnDisabled: false,
      strArr: [],
      msgPage: {
        pageSize: 50,
        pageNum: 1
      },
      lastScrollHeight: 0,
      canScroll: false,
      sendPop: false,
      blueBorder: false,
      aiFile: '',
      popoverText: '不能发送空消息',
      nowUploadFile: [],
      smallScreen: false
    }
  },
  computed: {
    user() {
      return JSON.parse(sessionStorage.getItem('user') || '{}')
    },
    showMessageList() {
      return this.messageList.sort(item => {})
    },
    channel() {
      if (this.nowChannel) {
        return new Channel(this.nowChannel.channelId, this.nowChannel.channelType === 1 ? ChannelTypePerson : ChannelTypeGroup)
      } else {
        return null
      }
    },
    showChannelList() {
      // item.channel && item.channel.channelType == 1 ? item.extra.userName : item.extra.groupName
      let val = this.searchInput.replace(/\s+/g, '')
      let arr = []
      if (val) {
        arr = this.channelList.filter(item => (item.channel && item.channel.channelType == 1 ? item.extra.userName : item.extra.groupName).indexOf(val) !== -1)
      } else {
        arr = this.channelList
      }
      // 对arr数组去重,唯一标识为 extra.channelId  bug：14773
      let map = new Map()
      arr = arr.reduce((acc, cur) => {
        if (cur.extra && cur.extra.channelId) {
          if (!map.has(cur.extra.channelId)) {
            map.set(cur.extra.channelId, true)
            acc.push(cur)
          }
        } else {
          acc.push(cur)
        }
        return acc
      }, [])
      return arr
    }
  },
  beforeDestroy() {
    console.log('beforeDestroy')
    this.disconnect()
  },
  // mounted() {
  //   this.getAddr()
  // },
  methods: {
    screenChange() {
      this.smallScreen = !this.smallScreen
      let dom = this.$refs.chatDialog.$el
      let dialog = dom.querySelector('.el-dialog')
      if (!this.smallScreen) {
        dialog.style.left = '0'
        dialog.style.top = '0'
      } else {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const dialogWidth = dialog.offsetWidth
        const dialogHeight = dialog.offsetHeight

        dialog.style.left = `${windowWidth - dialogWidth + 30}px`
        dialog.style.top = `${windowHeight - dialogHeight}px`
      }
    },
    aiFileClear() {
      this.aiFile = {
        fileName: '',
        fileUrl: '',
        size: ''
      }
    },
    renderTime(msg) {
      if (!msg || !msg.timestamp) {
        return ''
      }
      let time = msg.timestamp.length > 10 ? msg.timestamp - 0 : msg.timestamp * 1000
      return getTimeStringAutoShort2(time, true)
    },
    getGroupTypeMsg(type) {
      let obj = {
        1: '该群已解散，无法发送信息',
        2: '已退出群聊，无法发送信息',
        3: '已被移出群聊，无法发送信息'
      }
      return obj[type]
    },
    renderMessageDate(message, index) {
      let bool = false
      if (message.timestamp * 1000 - (this.messageList[index - 1] ? this.messageList[index - 1].timestamp * 1000 : 0) > 3 * 60 * 1000) {
        bool = true
      }
      return bool
    },
    getAddr() {
      this.$api.getChatIMLongConnection({ sourceType: 1 }).then(res => {
        if (res.code == 200) {
          this.addrObj = res.data
          console.log('获取地址', res.data)

          this.initWukongIM(res.data.modelType, res.data.wsAddr)
        } else {
          this.$message.warning(res.msg)
        }
      })
    },
    open() {
      if (!this.addrObj) {
        return this.$message.warning('聊天登录失败')
      }
      if (!this.addrObj.wsAddr) {
        this.getAddr(true)
        this.visible = true
        return
      }
      if (this.visible) return
      console.log('触发hasNew')
      this.$emit('hasNew', false)
      this.visible = true
      this.chatListScroll()
    },
    initWukongIM(modelType, addr) {
      console.log('触发init')
      // this.disconnect()
      if (modelType == 2) {
        // 集群模式通过此方法获取连接地址
        WKSDK.shared().config.provider.connectAddrCallback = async callback => {
          //   const addr = await xxxx // addr 格式为 ip:port
          callback(addr)
        }
      } else {
        // 单机模式可以直接设置地址
        WKSDK.shared().config.addr = addr // 默认端口为5200
      }

      // 认证信息，频道格式：用户ID@手机号，例如：1234@18620920112
      WKSDK.shared().config.uid = `${this.user.pkId}@${this.user.telephone}` // 用户uid（需要在悟空通讯端注册过）
      let token = sessionStorage.getItem('token')

      WKSDK.shared().config.token = token // 用户token （需要在悟空通讯端注册过）
      if (this.linkStatus == 1) return
      WKSDK.shared().connectManager.connect() // 连接
      // 监听最近会话列表
      WKSDK.shared().conversationManager.addConversationListener(this.ConversationListener)
      // 连接状态监听
      WKSDK.shared().connectManager.addConnectStatusListener(this.ConnectStatusListener)
      // 本地消息发送状态监听
      WKSDK.shared().chatManager.addMessageStatusListener(this.MessageStatusListener)
      //远程消息发送状态监听
      WKSDK.shared().chatManager.addMessageListener(this.MessageListener)
      // 历史记录接口配置
      this.MessagesCallback()

      this.getList()
    },
    // 连接状态监听
    async ConnectStatusListener(status, reasonCode) {
      console.log('连接状态监听', status, reasonCode)
      this.linkStatus = status
      sessionStorage.setItem('linkStatus', status)
      if (status === 1) {
        console.log('连接成功')
      } else {
        console.log('连接失败', reasonCode) //  reasonCode: 2表示认证失败（uid或token错误）
      }
    },

    // 本地消息发送状态监听
    MessageStatusListener(packet) {
      console.log('本地消息发送状态监听->', packet, packet.clientSeq) // 消息客户端序号用来匹配对应的发送的消息
      if (packet.reasonCode === 1) {
        console.log('发送成功')
        // review.value = '' // 自己绑定的输入框文本
      } else {
        console.log('发送失败')
      }
    },

    //远程消息发送状态监听
    MessageListener(message) {
      // message.channel // 消息频道
      // message.fromUID // 消息发送者
      // message.content // 消息内容
      console.log('远程消息发送状态监听', message, '消息频道:', message.channel, '消息发送者:', message.fromUID, '消息内容:', message.content)
      if (message.contentType == 0) {
        this.$store.dispatch('sosMessageListen', message.content.contentObj)
        return
      }
      let obj = this.channelList.find(item => item.channel.channelID == message.channel.channelID)
      if (obj.extra.enableStatus && message.contentType !== 1001) {
        return
      }
      if (obj) {
        if (![1001, 1002, 1003, 1004, 1005].includes(message.contentType)) {
          obj.extra.lastMsgSeqs++
        }
        obj.lastMessage = message
        let index = this.channelList.findIndex(item => item.channel.channelID == message.channel.channelID)
        if (this.nowChat != 0) {
          this.toFirst(this.channelList, index)
        }
      }
      if (!this.visible) {
        this.$emit('hasNew', true)
      }
      if (message.contentType == 1005) {
        obj.extra.groupName = message.content.content.groupName
      }
      if (!this.nowChannel.channel.isEqual(message.channel)) {
        return
      }
      if (this.nowChat == 0 && message.fromUID !== this.user.pkId) {
        return
      }
      if (message.channel.channelType == 2) {
        if ([1001, 1002, 1003, 1004, 1005].includes(message.contentType)) {
          if (message.contentType == 1001) {
            if (obj) {
              obj.extra.enableStatus = 0
            }
          }
          if (message.contentType == 1003) {
            let arr = message.content.contentObj.extra
            let hasMe = arr.find(item => item.uid == this.user.pkId)
            console.log(hasMe)

            if (hasMe) {
              obj.extra.enableStatus = 3
            }
          } else if (message.contentType == 1004) {
            obj.extra.enableStatus = 1
          } else if (message.contentType == 1005) {
            this.channelDetail.userName = message.content.content.groupName
          }
        } else {
          let obj = this.channelDetail.userInfoList.find(item => item.channelId == message.fromUID)
          message.userName = obj.userName
          message.orgName = obj.orgName
        }
      }
      if (message.contentType == 101) {
        let index = this.messageList.findIndex(item => item.contentType == 101 && !item.content.fileUrl && item.content.fileName == message.content.fileName)
        console.log(this.messageList, index)

        if (index != -1) {
          this.messageList.splice(index, 1)
          this.$set(this.messageList, index, message)
          console.log(this.messageList)

          // this.messageList[index] = message
          this.chatListScroll()
          return
        }
      }
      this.messageList.push(message)

      this.chatListScroll()
    },

    // 监听最近会话列表
    ConversationListener(conversation, action) {
      console.log('监听最近会话列表', conversation, action, ConversationAction)

      if (action === ConversationAction.add) {
        // 新增最近会话
        this.$api.monitorChannelInfo({ channelId: conversation.channel.channelID, channelType: conversation.channel.channelType }).then(res => {
          if (res.code == 200) {
            conversation.extra = res.data
            this.channelList.splice(1, 0, conversation)
          } else {
            this.$message.warning(res.msg)
          }
        })
      } else if (action === ConversationAction.update) {
        this.channelList.forEach(item => {
          if (item.channel.isEqual(conversation.channel)) {
            console.log(item)
            item = conversation
            if (this.nowChannel.channel.isEqual(conversation.channel)) {
              item.unread = 0
            }
          }
        })
      } else if (action === ConversationAction.remove) {
        // 删除最近会话
        let arr = []
        this.channelList.forEach(item => {
          if (item.channel.isEqual(conversation.channel)) {
          } else {
            arr.push(item)
          }
        })
        this.channelList = arr
      }
    },
    // 获取历史数据
    MessagesCallback() {
      let that = this
      WKSDK.shared().config.provider.syncMessagesCallback = async function(channel, opts) {
        // 后端提供的获取频道消息列表的接口数据 然后构建成 Message对象数组返回
        let messages = []
        let res = await that.$api.findChatIMAppointChannelData(opts)
        console.log('历史消息接口', res)
        if (res.code == 200) {
          res.data.forEach(item => {
            messages.push(Convert.toMessage(item))
          })
        }
        // that.messageList = messages
        return messages
      }
    },
    async getHistory() {
      let startMessageSeq = 0
      let endMessageSeq = 0
      console.log(this.nowChannel)

      if (this.msgPage.pageNum > 1) {
        startMessageSeq = this.nowChannel.extra.lastMsgSeqs - (this.msgPage.pageNum - 1) * this.msgPage.pageSize
        endMessageSeq = startMessageSeq - this.msgPage.pageSize
        endMessageSeq = endMessageSeq > 0 ? endMessageSeq : 0
      } else {
        startMessageSeq = this.nowChannel.extra.lastMsgSeqs ? this.nowChannel.extra.lastMsgSeqs : 0
        endMessageSeq = this.nowChannel.extra.lastMsgSeqs - this.msgPage.pageSize > 0 ? this.nowChannel.extra.lastMsgSeqs - this.msgPage.pageSize : 0
      }
      this.lastScrollHeight = this.$refs.chatList ? this.$refs.chatList.scrollHeight : 0
      let opts = {
        channelType: this.nowChannel.channel.channelType,
        channelId: this.nowChannel.channel.channelID,
        startMessageSeq: startMessageSeq, // 开始消息列号（结果包含startMessageSeq的消息）
        endMessageSeq: endMessageSeq, //  结束消息列号（结果不包含endMessageSeq的消息）0表示不限制
        limit: 50, // 每次限制数量
        pullMode: 0 // 拉取模式 0:向下拉取 1:向上拉取
      }
      const messages = await WKSDK.shared().chatManager.syncMessages(this.nowChannel.channel, opts)
      if (this.msgPage.pageNum == 1) {
        let arr = []
        console.log(this.nowUploadFile)

        if (this.nowUploadFile.length > 0) {
          this.nowUploadFile.forEach(item => {
            if (item.channelId == this.nowChannel.channel.channelID) {
              let msg = {
                channel: this.nowChannel.channel,
                content: {
                  fileName: item.fileName,
                  fileUrl: '',
                  size: item.size,
                  total: item.total,
                  number: item.number,
                  contentType: 101
                },
                timestamp: Date.now() / 1000,
                contentType: 101,
                fromUID: this.user.pkId,
                userName: this.user.userName,
                orgName: this.user.orgName,
                changeFileName: item.fileName,
                id: item.id
              }
              arr.push(msg)
            }
          })
        }

        this.messageList = [...messages, ...arr]
        this.chatListScroll()
        // this.toBottom()
      } else {
        this.messageList = [...messages, ...this.messageList]
        this.$nextTick(() => {
          const container = this.$refs.chatList
          // 计算新增内容高度差
          const heightDiff = container.scrollHeight - this.lastScrollHeight
          container.scrollTop = heightDiff
        })
      }
      if (this.btnDisabled && this.nowChannel.extra.aiType == 2) {
        let msg = {
          channel: this.nowChannel.channel,
          content: new AIContent(),
          timestamp: Date.now() / 1000,
          contentType: 103
        }
        msg.content.content = this.currentContent
        msg.content.reasoningContent = this.reasoningContent
        msg.content.contentType = 103
        this.messageList.push(msg)
      }
      console.log('历史消息', messages)
    },
    // 断开连接
    disconnect() {
      console.log('断开')
      sessionStorage.removeItem('linkStatus')
      WKSDK.shared().connectManager.disconnect()
      // 移除消息发送状态监听
      WKSDK.shared().chatManager.removeMessageStatusListener(this.MessageStatusListener)
      // 移除远程消息发送状态监听
      WKSDK.shared().chatManager.removeMessageListener(this.MessageListener)
      // 移除订阅者监听
      // WKSDK.shared().channelManager.removeSubscriberChangeListener(this.listenChannelMember)
      // 移除最近会话列表监听
      WKSDK.shared().conversationManager.removeConversationListener(this.ConversationListener)
    },
    async getList() {
      // 提供最近会话同步的数据源
      WKSDK.shared().config.provider.syncConversationsCallback = async () => {
        // 后端提供的获取最近会话列表的接口数据 然后构建成 Conversation对象数组返回
        let conversations = []
        let res = await this.$api.findChatIMLatelyInfoList()
        if (res.code == 200) {
          res.data.forEach(item => {
            conversations.push(this.channelListTransition(item))
          })
          console.log('转换后列表', conversations)
        }
        this.channelList = res.data
        return conversations
      }
      // 同步最近会话列表
      let conversations = await WKSDK.shared().conversationManager.sync({})
      console.log(conversations)

      this.channelList = conversations ? conversations : []
      this.checkChat(this.channelList[0], 0)
    },
    channelListTransition(conversationMap) {
      const conversation = new Conversation()
      conversation.channel = new Channel(conversationMap['channelId'], conversationMap['channelType'])
      conversation.unread = conversationMap['unread'] || 0
      conversation.timestamp = conversationMap['timestamp'] || 0
      let recents = conversationMap['recents']
      if (recents && recents.length > 0) {
        const messageModel = this.toMessage(recents[0])
        conversation.lastMessage = messageModel
      } else {
        conversation.lastMessage = Convert.toMessage(conversationMap) || {}
      }
      conversation.extra = {
        ...conversationMap
      }
      return conversation
    },
    decodeMsg(msg) {
      if (!msg) return ''
      if (msg.contentType == 1) {
        return msg.text
      } else if (msg.contentType == 101) {
        let url = msg.fileUrl ? msg.fileUrl : msg.contentObj.fileUrl
        let name = msg.fileName ? msg.fileName : msg.contentObj.fileName
        let type = getFileType(url)
        if (type === 'image') {
          return '[图片]'
        } else {
          return `[${name}]`
        }
      } else if (msg.contentType == 102) {
        return '[语音]'
      } else if (msg.contentType == 103) {
        return msg.content.content ? msg.content.content : msg.content
      } else {
        return ''
      }
      // else if([1001,1002,1003,1010].includes(msg.contentType)){
      //  return this.messageReplay(msg.contentObj)
      // }
    },
    messageReplay(obj) {
      let str = obj.content.replace(/\{(\d+)\}/g, (match, index) => {
        const idx = parseInt(index, 10)
        return obj.extra[idx] ? obj.extra[idx].name : match // 处理索引超出范围的情况
      })
      return str
    },
    getFileTypes(url) {
      let type = getFileType(url)
      if (type === 'image') {
        return 'icontupian'
      } else if (type === 'excel') {
        return 'iconexcel1'
      } else if (type === 'word') {
        return 'iconwork1'
      } else if (type === 'pdf') {
        return 'iconpdf'
      } else {
        return 'iconyasuobao'
      }
    },
    addChatBtn() {
      this.groupList = []
      this.addChatShow = true
    },
    handleAddChat(arr, groupName) {
      if (arr.length == 1) {
        this.addObj = { userName: arr[0].nickName, channelId: arr[0].pkId, channelType: ChannelTypePerson, lastMsgSeqs: 0 }
        let channel = new Channel(arr[0].pkId, ChannelTypePerson)
        const conversation = WKSDK.shared().conversationManager.findConversation(channel)
        if (!conversation) {
          let obj = WKSDK.shared().conversationManager.createEmptyConversation(channel)
          this.nowChat = 1
          let nowChannel = { ...obj, extra: this.addObj }
          this.checkChat(nowChannel, 1)
        } else {
          let nowChannel = conversation
          let index = this.channelList.findIndex(item => item.channel.channelID == nowChannel.channel.channelID)
          this.toFirst(this.channelList, index)
          this.nowChat = 1
          this.checkChat(nowChannel, 1)
        }
        this.addChatClose()
      } else {
        let subscribers = arr.map(item => item.pkId)
        this.$api.addChannel({ ban: 0, subscribers, groupName }).then(res => {
          if (res.code == 200) {
            this.addChatClose()
            this.getChannelList(res.data)
          }
        })
      }
    },
    handleSaveChat(e) {
      this.$api.addUserListByChannel({ channelId: this.channelDetail.channelId, ...e }).then(res => {
        if (res.code == 200) {
          this.getChannelDetail()
          this.addChatShow = false
          this.$message.success('保存成功')
        } else {
          this.$message.warning(res.msg)
        }
      })
    },
    async getChannelList(posId) {
      let conversations = await WKSDK.shared().conversationManager.sync({})
      // console.log(conversations)
      this.channelList = conversations ? conversations : []
      if (posId) {
        let obj = this.channelList.find(item => item.channel.channelID == posId)
        let index = this.channelList.findIndex(item => item.channel.channelID == posId)
        this.checkChat(obj, index)
      }
    },
    addChatClose() {
      this.addChatShow = false
      this.addObj = {}
    },
    handleCommand(item){
      console.log(item)
      this.checkChat(item,item.index)
    },
    // 点击频道
    checkChat(item, index) {
      // console.log(item)
      this.canScroll = false
      let oldChannel = { ...this.nowChannel }
      this.nowChat = index
      this.nowChannel = item
      console.log('点击的频道', item, oldChannel)
      this.msgPage = {
        pageSize: 50,
        pageNum: 1
      }
      this.inputText = ''
      item.unread = 0
      if (!oldChannel.channel || !oldChannel.channel.isEqual(item.channel)) {
        this.messageList = []
        this.getChannelDetail()
        this.getHistory()
      }
      setTimeout(() => {
        this.canScroll = true
      }, 200)
      // } else {
      //   this.messageList = []
      //   this.channelDetail = item
      // }
    },
    getChannelDetail() {
      this.$api.findChatIMAppointChannelInfo({ channelId: this.nowChannel.channel.channelID }).then(res => {
        if (res.code == 200) {
          this.channelDetail = res.data ? res.data : {}
          if (res.data.channelType == 2) {
            this.channelDetail.userName = res.data.groupName
          }
        } else {
          this.$message.warning(res.msg)
        }
      })
    },
    toBottom() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        this.chatListScroll()
      }, 200)
    },
    chatListScroll() {
      this.$nextTick(() => {
        const chatList = this.$refs.chatList
        if (!chatList) return

        chatList.scrollTo({ top: chatList.scrollHeight })
      })
    },
    chatScroll(e) {
      if (e.target.scrollTop == 0) {
        // console.log('滚到顶部',e);
        if (!this.canScroll) return
        if (this.nowChannel.extra.lastMsgSeqs - this.msgPage.pageSize * this.msgPage.pageNum < 0) return
        if (this.msgPage.pageSize * this.msgPage.pageNum > this.nowChannel.extra.lastMsgSeqs) {
          return
        }
        this.msgPage.pageNum++
        this.getHistory()
      }
    },
    sendBtn() {
      if ((!this.inputText.trim() && this.nowChannel.extra.aiType != 2) || (this.nowChannel.extra.aiType == 2 && !this.inputText.trim() && !this.aiFile.fileUrl)) {
        this.popoverText = '不能发送空消息'
        this.sendPop = true
        this.sendPopClose()
        return
      }
      if (this.inputText.trim().length > 500) {
        this.$confirm('发送内容超过500字，是否转为word文档方式发送?', '提示', {
          confirmButtonText: '转为word文档',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.createDocxMessage()
        })
        return
      }
      // let msg = this.inputText.replace(/\n/g, '<br>')
      let msg = this.inputText
      if (this.nowChannel.extra.aiType == 2) {
        this.send(104, { msgContent: msg, ...this.aiFile })
        this.aiFile = {
          fileUrl: '',
          fileName: '',
          size: ''
        }
      } else {
        this.send(1, msg)
      }
      this.inputText = ''
    },
    sendPopClose() {
      clearTimeout(btnTimer)
      btnTimer = setTimeout(() => {
        this.sendPop = false
      }, 1000)
    },
    send(type, content, channelId) {
      let msg = null
      if (type == 1) {
        msg = new MessageText(content)
      } else if (type == 101) {
        WKSDK.shared().register(101, () => new MediaContent())
        msg = new MediaContent(content)
        msg.contentType = 101
      } else if (type == 104) {
        msg = new AISendContent(content)
        msg.contentType = 104
      }
      console.log('发送消息的频道', this.nowChannel)
      let obj = null
      if (channelId) {
        obj = this.channelList.find(item => item.channel.channelID == channelId)
      }
      WKSDK.shared().chatManager.send(msg, obj ? obj.channel : this.nowChannel.channel)
      if (this.nowChannel.extra.aiType == 2 && !channelId) {
        let data = {
          msgContent: content.msgContent ? content.msgContent : '',
          fileUrl: content.fileUrl ? content.fileUrl : ''
        }
        // msg.channel = this.nowChannel.channel
        // msg.content = new AIContent()
        // msg.timestamp = Date.now() / 1000,
        // msg.contentType = 103
        let msg = {
          channel: this.nowChannel.channel,
          content: new AIContent(),
          timestamp: Date.now() / 1000,
          contentType: 103
        }
        msg.content.contentType = 103
        this.messageList.push(msg)
        console.log('添加ai消息', this.messageList, msg)
        console.log(this.messageList[this.messageList.length - 1])

        this.fetchStream(data)
      }
      this.chatListScroll()
    },
    // 新增Fetch流式请求方法
    async fetchStream(data) {
      const decoder = new TextDecoder('utf-8')
      this.msgLoading = true
      this.btnDisabled = true
      try {
        const stream = await this.$api.noticeChatIMSendMessage(data) // 获取流
        const reader = stream.getReader() // 获取流的读取器
        let result = ''
        let buffer = '' // 用于缓存接收到的数据
        const messageEnd = '\n\n' // 假设消息以两个换行符结束
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            this.reasoningContent = this.reasoningContent.replace(/\s*null\s*$/, '')
            if (this.nowChannel.extra.aiType == 2) {
              this.$set(this.messageList[this.messageList.length - 1].content, 'reasoningContent', this.reasoningContent)
            }
            this.btnDisabled = false
            this.$nextTick(() => {
              this.currentContent = ''
              this.reasoningContent = ''
            })
            break
          }
          buffer += decoder.decode(value, { stream: true }) // 解码并拼接结果

          // 处理缓存中的数据
          let startIndex = 0
          let endIndex

          while ((endIndex = buffer.indexOf(messageEnd, startIndex)) !== -1) {
            const completeMessage = buffer.substring(startIndex, endIndex).trim() // 获取完整消息
            if (completeMessage) {
              this.processEvent(completeMessage) // 处理完整消息
            }
            startIndex = endIndex + messageEnd.length // 更新起始索引
          }

          // 保留未处理的部分
          buffer = buffer.substring(startIndex)
        }

        // 处理剩余数据
        if (buffer) {
          this.processEvent(buffer)
        }
        // 处理剩余数据
        if (result) {
          this.processEvent(result)
        }
      } catch (error) {
        this.msgLoading = false
        this.btnDisabled = false
        console.error('Error fetching AI text:', error)
      }
    },
    processEvent(data) {
      // 按行分割数据
      const lines = data.split('\n')
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const eventData = line.substring(5).trim() // 获取数据部分
          if (eventData) {
            // 这里可以将数据转换为对象，假设数据是 JSON 格式
            try {
              const jsonObject = JSON.parse(eventData)
              this.msgLoading = false
              this.reasoningContent += jsonObject.reasoning_content
              this.currentContent += jsonObject.content
              if (this.nowChannel.extra.aiType == 2) {
                this.$set(this.messageList[this.messageList.length - 1].content, 'reasoningContent', this.reasoningContent)
                this.$set(this.messageList[this.messageList.length - 1].content, 'content', this.currentContent)
                // this.chatListScroll()
              }
            } catch (error) {
              console.error('解析 JSON 失败:', error)
            }
          }
        }
      }
    },
    selFile() {
      this.$refs.files.click(this.nowChannel.extra.aiType == 2 ? null : this.nowChannel.channel.channelID)
    },
    uploadSuccess(path, name, size, saveObj) {
      let obj = { fileUrl: path, fileName: name, size }
      if (this.nowChannel.extra.aiType == 2 && !saveObj.setId) {
        this.aiFile = obj
      } else {
        this.nowUploadFile = this.nowUploadFile.filter(item => item.id != saveObj.id)
        this.send(101, obj, saveObj.setId)
      }
    },
    onProcess(e) {
      console.log('上传进度', e)

      if (!e || this.nowChannel.extra.aiType == 2) return
      let process = this.nowUploadFile.find(item => item.id == e.id)
      console.log('process', process)

      if (!process) {
        this.nowUploadFile.push({
          number: 0,
          total: e.total,
          fileName: e.fileName,
          id: e.id,
          size: e.size,
          channelId: this.nowChannel.channel.channelID
        })
        process = this.nowUploadFile.find(item => item.id == e.id)
        let msg = {
          channel: this.nowChannel.channel,
          content: {
            ...process,
            ...new MediaContent({ fileName: e.fileName, size: e.size }),
            fileUrl: '',
            contentType: 101
          },
          fromUID: this.user.pkId,
          userName: this.user.userName,
          orgName: this.user.orgName,
          changeFileName: e.fileName,
          id: e.id,
          timestamp: Date.now() / 1000,
          contentType: 101
        }
        this.messageList.push(msg)
        this.chatListScroll()
      }
      process.number += 1
      if (process.number >= process.total) {
        process.number = process.total
      }
      if (this.messageList.find(item => item.id == e.id)) {
        this.messageList.find(item => item.id == e.id).content.number = process.number
      }
    },
    insertEmoji(emoji) {
      const editor = this.$refs.editor // 获取可编辑区域的引用
      if (!editor) return
      // 获取当前光标位置
      const start = editor.selectionStart
      const end = editor.selectionEnd

      // 插入表情
      const textBefore = editor.value.substring(0, start)
      const textAfter = editor.value.substring(end, editor.value.length)
      editor.value = textBefore + emoji + textAfter
      this.inputText = editor.value

      // 设置新的光标位置
      editor.selectionStart = editor.selectionEnd = start + emoji.length
      // 使用nextTick确保DOM更新完成
      this.$nextTick(() => {
        // 设置新的光标位置
        const newPos = start + emoji.length
        editor.selectionStart = newPos
        editor.selectionEnd = newPos
        editor.focus()
      })
    },
    editGroup() {
      this.groupName = this.channelDetail.userName
      this.editDialog = true
    },
    handleEditGroup() {
      let data = {
        channelId: this.channelDetail.channelId,
        groupName: this.groupName
      }
      this.$api.updateGroupInfo(data).then(res => {
        if (res.code == 200) {
          let obj = this.channelList.find(item => item.extra.channelId == this.channelDetail.channelId)
          obj.extra.groupName = this.groupName
          this.channelDetail.userName = this.groupName
          this.$message.success('修改成功')
          this.editDialog = false
        } else {
          this.$message.warning(res.msg)
        }
      })
    },
    GroupMember() {
      this.groupList = this.channelDetail.userInfoList.map(item => item.channelId)
      this.addChatShow = true
    },
    breakGroup() {
      this.$confirm(`即将解散<span class="comfigGroupName">${this.channelDetail.userName}</span>`, '解散群聊', {
        confirmButtonText: '确定',
        showCancelButton: false,
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'redConfirmBtn'
      })
        .then(() => {
          this.$api.deleteChannel({ channelId: this.channelDetail.channelId }).then(res => {
            if (res.code == 200) {
              this.getChannelList()
              this.checkChat(this.channelList[0], 0)
              this.innerDrawer = false
            } else {
              this.$message.warning(res.msg)
            }
          })
        })
        .catch(() => {})
    },
    exitGroup() {
      this.$confirm(`即将退出<span class="comfigGroupName">${this.channelDetail.userName}</span>`, '退出群聊', {
        confirmButtonText: '确定',
        showCancelButton: false,
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'redConfirmBtn'
      })
        .then(() => {
          this.$api.quitUserByChannel({ channelId: this.channelDetail.channelId }).then(res => {
            if (res.code == 200) {
              this.getChannelList()
              this.checkChat(this.channelList[0], 0)
              this.innerDrawer = false
            } else {
              this.$message.warning(res.msg)
            }
          })
        })
        .catch(() => {})
    },
    close() {},
    Keydown(event) {
      // 回车发送
      if (!event.ctrlKey && !event.shiftKey && event.keyCode == 13) {
        event.cancelBubble = true //ie阻止冒泡行为
        event.stopPropagation() //Firefox阻止冒泡行为
        event.preventDefault() //取消事件的默认动作*换行
        //以下处理发送消息代码
        if (!(this.btnDisabled && this.nowChat == 0)) {
          this.sendBtn()
        }
      } else if (event.key === 'Enter' && event.shiftKey) {
        // shift+回车换行禁用
        event.cancelBubble = true //ie阻止冒泡行为
        event.stopPropagation() //Firefox阻止冒泡行为
        event.preventDefault() //取消事件的默认动作*换行
      } else if (event.key === 'Enter' && event.ctrlKey) {
        // ctrl+回车换行
        event.preventDefault() // 阻止默认的换行行为
        const selectionStart = event.target.selectionStart // 获取光标位置
        this.inputText = this.inputText.substring(0, selectionStart) + '\n' + this.inputText.substring(selectionStart)

        // 重设光标位置
        this.$nextTick(() => {
          event.target.selectionStart = selectionStart + 1
          event.target.selectionEnd = selectionStart + 1
        })
      }
    },
    handlePaste(event) {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items
      for (let index in items) {
        const item = items[index]
        if (item.kind === 'file') {
          const blob = item.getAsFile()
          const file = {
            name: blob.name,
            size: blob.size,
            type: blob.type,
            preview: URL.createObjectURL(blob),
            blob: blob
          }
          this.previewFiles.push(file)
          this.showPreviewModal = true
        } else if (item.kind === 'string') {
          // item.getAsString(text => {
          //     // 在这里处理粘贴的文本内容
          // });
        }
      }
    },
    preview(url, name) {
      if (!url) {
        return this.$message.warning('无法识别的文件')
      }
      this.$refs.fileConfurm.open(url, name)
    },
    toFirst(arr, index) {
      if (index != 0) {
        arr.splice(1, 0, arr.splice(index, 1)[0])
        this.nowChat = this.channelList.findIndex(item => item.channel.channelID == this.nowChannel.channel.channelID)
      }
    },
    async createDocxMessage() {
      this.loading = true
      this.$api.createDocxMessage(this.inputText).then(res => {
        this.loading = false
        if (res.code == 200) {
          this.getFileSize(res.data).then(resp => {
            let obj = { fileUrl: res.data, fileName: this.inputText.trim().substring(0, 5) + '.docx', size: resp }
            this.send(101, obj)
            this.inputText = ''
          })
        }
      })
    },
    async getFileSize(url) {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error('请求失败')
        }

        // 从响应头获取文件大小（字节）

        return response.headers.get('Content-Length')
      } catch (error) {
        console.error('获取文件大小失败:', error)
        return 0 // 返回0表示获取失败
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// * {
//   color: #203457;
// }
/deep/ .el-avatar {
  background-color: #fff;
  border: 1px solid $borderColor;
  img {
    margin: 0 auto;
  }
}
.no-select {
  -webkit-user-select: none; /* Chrome, Safari, Opera */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently supported by Chrome, Opera, and Firefox */
}
.over-hidden {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

textarea {
  font-family: 'Segoe UI Emoji', 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
}
.emojiList {
  display: flex;
  flex-wrap: wrap;
  .emoji-item {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 25px;
    height: 25px;
  }
}
.uploadFile {
  margin-left: 12px;
}
.hasScroll {
  &::-webkit-scrollbar {
    width: 6px;
    color: $borderColor;
    background-color: $borderColor;
  }
  &::-webkit-scrollbar-track {
    // background-color: rgba(0, 0, 0, 0.1);
    /* 轨道的颜色 */
    border-radius: 6px;
    /* 轨道的圆角 */
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background-color: $borderColor;
  }
}
.channel-peo-detail {
  display: flex;
  align-items: center;
  width: 300px;
  height: 80px;
  .headImg {
    width: 50px;
    margin-right: 8px;
  }
  .channel-peo-right {
    width: calc(100% - 58px);
    height: 100%;
    .channel-peo-info {
      height: 50px;
      margin: 15px 0;
      .peoName {
        margin-bottom: 4px;
        font-size: 14px;
        font-family: 'PFMedium';
      }
      .message {
        margin-bottom: 4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        word-break: break-all;
      }
    }
  }
}
.editGroup {
  padding: 20px;
}
.files {
  display: flex;
  align-items: center;
  max-width: 300px;
  img {
    width: 20px;
    height: 20px;
  }
  .fileName {
    max-width: 250px;
    margin-left: 4px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    word-break: break-all;
  }
  .delBtn {
    cursor: pointer;
    width: 20px;
    margin-left: 4px;
    color: red;
  }
}
.figer {
  cursor: pointer;
}
.smallSel {
  position: relative;
  // top: 38%;
  // transform: translateY(-50%);
  margin-left: 10px;
  z-index: 22;
  color: #000;
}
</style>
<style>
.el-tooltip__popper.is-light.tooltipClass {
  z-index: 4002 !important;
  border: 1px solid #bac3d5;
}
.el-tooltip__popper.is-light.tooltipClass .popper__arrow {
  border-left-color: #bac3d5;
}
.redConfirmBtn {
  border: 1px solid #cf3232 !important;
  background-color: #cf3232 !important;
}
.redConfirmBtn:hover {
  border: 1px solid #cf3232 !important;
  background-color: #cf3232 !important;
}
.comfigGroupName {
  font-family: 'PFMedium';
  font-size: 16px;
  color: #000;
}
.chat-popover {
  z-index: 4002 !important;
}
.small-chat-list-item{
  display: flex;
}
  .small-chat-list-item .headImg {
    display: flex;
    position: relative;
    width: 30px;
    margin-right: 8px;
    z-index: 22;
  }
  .small-chat-list-item .peoName {
    max-width: calc(100% - 90px);
  }
  .small-chat-list-item .avas {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid #EBEEF5;
    overflow: hidden;
  }
  .small-chat-list-item .avas img {
      width: 25px;
      height: 25px;
    }
.nowClick {
  background-color: #e8effb;
}
</style>
<style lang="scss">
.chatAllDialog {
  .el-dialog__wrapper {
    z-index: 4001 !important;
  }
}
.chatDialog {
  &.el-dialog__wrapper {
    z-index: 4002!important;
  }
  pointer-events: none;
  & .el-dialog {
    pointer-events: auto;
    box-shadow: 0px 0px 10px 0px #02296440;
    .el-dialog__headerbtn {
      display: none !important;
    }
  }
  & .el-dialog__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
    background: transparent;
    border-bottom: none;
    height: 60px;
    .el-dialog__headerbtn {
      display: none;
    }
  }
}
.notHead {
  /deep/ .el-dialog__header {
    display: none;
  }
}
.chat-dropdown{
  z-index: 4003 !important;
}
.chat {
  display: flex;
  height: 700px;
  .chat-left,
  .chat-right {
    height: 100%;
    padding: 20px;
  }
  .chat-left {
    // min-width: 260px;
    // max-width: 340px;
    width: 320px;
    padding-right: 16px;
    border-right: 1px solid $borderColor;
    box-shadow: 2px 0px 4px 0px #0229641a;
    .chat-left-head {
      .chat-left-head-top {
        position: relative;
        z-index: 22;
        display: flex;
        margin-bottom: 10px;
        .select {
          flex: 1;
        }
        /deep/ .el-input {
          .el-input__inner {
            height: 36px;
            line-height: 36px;
          }
          .el-input__icon {
            font-weight: 700;
            color: #32343e;
          }
        }
        .contactsBtn {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          width: 36px;
          height: 36px;
          margin-left: 6px;
          border: 1px solid $borderColor;
          border-radius: 8px;
          &:hover {
            background: #ecf5ff;
            border-color: #c6e2ff;
          }
          img {
            width: 20px;
            height: 18px;
          }
        }
      }
    }
    .chat-left-list {
      overflow-y: auto;
      height: calc(100% - 50px);
      padding: 0;
      .chat-peo-item {
        display: flex;
        align-items: center;
        height: 72px;
        margin-bottom: 6px;
        padding: 12px 8px;
        border-radius: 8px;
        cursor: pointer;
        .headImg {
          width: 48px;
          margin-right: 8px;
          .el-avatar {
            width: 48px !important;
            height: 48px !important;
          }
          .avas {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1px solid $borderColor;
            // background-color: #c0c4cc;
            overflow: hidden;
            img {
              width: 40px;
              height: 40px;
            }
          }
        }
        .chat-peo-item-right {
          //   flex: 1;
          width: calc(100% - 58px);
          height: 100%;
          .badge {
            width: 100%;
            /deep/ .el-badge__content.is-fixed {
              top: 33px;
              right: 30px;
              background-color: #df4412;
            }
          }
          .chat-peo-info {
            height: 50px;
            // margin: 15px 0;
            .peoName {
              display: flex;
              font-size: $font-size-medium;
              font-family: 'PFMedium';
              .userName {
                flex: 1;
              }
              .msgTime {
                display: flex;
                justify-content: end;
                align-items: flex-end;
                width: 115px;
                font-family: 'PFMedium';
                text-align: right;
                font-size: $font-size-base;
                color: $text-secondary;
              }
            }
            .message {
              width: calc(100% - 36px);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
          }
        }
        &:hover {
          background-color: #e8effb;
          // .chat-peo-item-right {
          //   background: linear-gradient(to right, #f2f6ff00, #f2f6ff);
          // }
        }
      }
      .nowClick {
        // background: linear-gradient(to right, #f2f6ff00, #f2f6ff);
        background-color: #e8effb;
      }
    }
  }
  .chat-right {
    flex: 1;
    position: relative;
    padding-left: 16px;
    background-color: #f9fafb;
    .chat-right-head {
      position: relative;
      height: 40px;
      // padding: 20px 10px 10px 20px;
      border-bottom: 1px solid $borderColor;
      .peoName {
        position: relative;
        z-index: 22;
        display: inline-block;
        max-width: calc(100% - 60px);
        font-size: 20px;
        font-family: 'PFMedium';
      }
    }
    .btns {
      position: absolute;
      top: 0px;
      right: -10px;
      z-index: 22;
      .btn-icon {
        cursor: pointer;
        font-size: 24px;
        margin-right: 6px;
      }
    }
    .chat-right-content {
      position: relative;
      display: flex;
      height: calc(100% - 40px);
      .chat-right-content-left {
        flex: 1;
        .chat-list {
          overflow: auto;
          height: calc(100% - 230px);
          margin-top: 10px;
          padding-right: 4px;
          // padding: 10px;
        }
        .chat-input {
          height: 200px;
          // background-color: #f9f9ff;
          .chat-input-border {
            height: 160px;
            border: 1px solid $borderColor;
            border-radius: 4px;
            padding: 0 10px;
            margin-top: 10px;
            background-color: #fff;
          }
          .blueBorder {
            border-color: #134898;
          }
          .chat-input-operation {
            display: flex;
            align-items: center;
            height: 40px;
            // padding: 0 10px;
            background-color: #fff;
            border-radius: 4px;
            // border-top: 1px solid $borderColor;
            // border-bottom: 1px solid $borderColor;
            img {
              cursor: pointer;
            }
            .operation-item {
              /deep/ .el-popover__reference-wrapper {
                display: flex;
              }
              .item-btn {
                width: 20px;
                height: 20px;
                cursor: pointer;
              }
            }
          }
          .chat-input-content {
            height: calc(100% - 40px);
            .chat_edit {
              width: 100%;
              height: 100%;
              resize: none;
              border: none;
              caret-color: #134898;
              // background-color: #f9f9ff;
            }
          }
          .chat-input-btn {
            position: relative;
            // height: 30px;
            // padding-right: 10px;
            padding-top: 12px;
            text-align: right;
            .aiTip {
              position: absolute;
              left: 50%;
              top: 40%;
              transform: translateX(-50%);
              display: flex;
              align-items: center;
            }
          }
          .notSend {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            border-top: 1px solid $borderColor;
          }
        }
      }
      .chat-right-content-right {
        width: 160px;
        margin-left: 16px;
        border-left: 1px solid $borderColor;
        .channel-num {
          height: 30px;
          line-height: 30px;
          padding: 0 10px;
        }
        .channel-peo-list {
          overflow: auto;
          height: calc(100% - 30px);
          .channel-peo-list-item {
            display: flex;
            align-items: center;
            height: 30px;
            padding: 0 10px;
            font-size: 12px;
            cursor: pointer;
            .channel-icon {
              color: #4b95f3;
              margin-right: 6px;
            }
            .channel-peo-name {
              width: calc(100% - 48px);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            .channel-groupware {
              width: 30px;
              text-align: center;
              background-color: #eaebec;
              border-radius: 6px;
            }
            &:hover {
              background-color: #eaeaec;
            }
          }
        }
      }
      .groud-manager {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.3);
        .groud-manager-content {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 80px;
          padding: 10px 0;
          padding-left: 20px;
          background-color: #fff;
          .groud-manager-content-item {
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            width: 60px;
            height: 60px;
            margin-bottom: 20px;
            border: 1px solid $borderColor;
            border-radius: 6px;
            font-size: 12px;
            .btn-icon {
              font-size: 16px;
              margin-bottom: 6px;
            }
          }
          .blue {
            &:hover {
              color: #1576e6;
              border: 1px solid #4878d5;
            }
          }
          .red {
            &:hover {
              color: #cf3232;
              background-color: #fffbfb;
              border: 1px solid #d54848;
            }
          }
        }
      }
    }
  }
}
.small-chat {
  height: 500px;
  .chat-right {
    // padding-left: 0;
    .chat-right-head {
      display: flex;
      align-items: center;
      .headImg {
        cursor: pointer;
        position: relative;
        width: 30px;
        margin-right: 8px;
        z-index: 22;
      }
      .peoName {
        max-width: calc(100% - 90px);
      }
      .avas {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid $borderColor;
        // background-color: #c0c4cc;
        overflow: hidden;
        img {
          cursor: pointer;
          width: 25px;
          height: 25px;
        }
      }
    }
    .btns {
      top: 50%;
      transform: translateY(-50%);
    }
    .chat-right-content {
      .chat-right-content-left {
        .chat-list {
          overflow: auto;
          height: calc(100% - 170px);
          margin-top: 10px;
          padding-right: 4px;
          // padding: 10px;
        }
        .chat-input {
          height: 170px;
          .chat-input-border {
            height: 160px;
            .chat-input-content {
              height: calc(100% - 65px);
            }
          }
          .chat-input-operation {
            height: 40px;
          }
          .chat-input-btn {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            height: 30px;
            padding-top: 0;
            .aiTip {
              top: unset;
            }
          }
        }
      }
    }
  }
}
</style>
