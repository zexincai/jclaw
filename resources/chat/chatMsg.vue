<template>
  <div class="chat-msg" :class="{ mine: isMine,systemMsg:[1001,1002,1003,1004,1005].includes(msgContent.content.contentType) }">
    <div style="text-align:center">{{ timeShow?time:'' }}</div>
    <div class="time" v-if="!isMine&&![1001,1002,1003,1004,1005].includes(msgContent.content.contentType)">{{ userName }}<span v-if="orgShow" class="orgName">（{{orgName}}）</span></div>
    <div class="time" v-else-if="![1001,1002,1003,1004,1005].includes(msgContent.content.contentType)"><span v-if="orgShow" class="orgName">（{{orgName}}）</span>{{ userName }} </div>
    <div class="msg">
      <template v-if="aiLoading">
        <div class="msg-box loadingBox">
          思考中
          <i class="el-icon-loading loading-icon"></i>
        </div>
      </template>
      <template v-else-if="msgContent.content.contentType === 1">
        <div class="msg-box">{{msgContent.content.text}}</div>
      </template>
      <template v-else-if="msgContent.content.contentType === 101">
        <template v-if="fileType == 'image'">
          <!-- @load="$emit('toBottom')" -->
          <img :src="fileContent.fileUrl" alt="" class="images" @click="preview" />
        </template>
        <template v-else-if="fileType == 'video'">
          <!-- <VoiceMessage :src="fileContent.fileUrl" :align="isMine ? 'right' : 'left'"></VoiceMessage> -->
          <div class="video" @click.stop="preview">
          <video :src="fileContent.fileUrl" :autoplay="false" class="video"></video>
          </div>
        </template>
        <template v-else>
          <!-- <div class="msg-box file" @click="preview">
            <div class="file-detail">
              <div class="file-name ellipsistwo">{{ fileContent.fileName }}</div>
              <div class="file-name">{{size}}</div>
            </div>
            <img src="../../assets/fileType/excel.png" alt="" v-if="fileType == 'excel'">
            <img src="../../assets/fileType/pdf.png" alt="" v-else-if="fileType == 'pdf'">
            <img src="../../assets/fileType/word.png" alt="" v-else-if="fileType == 'word'">
            <img src="../../assets/fileType/order.png" alt="" v-else>
          </div> -->
          <div class="msg-box file" @click="preview">
            <mFile :fileContent="fileContent" :fileType="fileType"></mFile>
            <div class="progress" v-if="!msgContent.content.fileUrl">
              <el-progress color="#1BB477" :stroke-width="4" :show-text="false" :percentage="Number(((fileContent.number / fileContent.total) * 100).toFixed(2) || 0)" ></el-progress>
            </div>
          </div>
        </template>
      </template>
      <template v-else-if="msgContent.content.contentType === 102">
          <VoiceMessage :src="fileContent.url?fileContent.url:''" :align="isMine ? 'right' : 'left'"></VoiceMessage>
      </template>
      <template v-else-if="msgContent.content.contentType === 103">
        <div class="aiMsg">
          <el-collapse v-model="activeNames">
          <el-collapse-item title="思考内容" name="1">
            <template slot="title">
              思考内容<i style="color: rgba(50, 52, 62, 1)" :class="['header-icon', activeNames && activeNames.length ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"></i>
            </template>
            <div class="reasoningContent">
            <div class="msg-box">{{msgContent.content.reasoningContent}}</div>
            </div>
          </el-collapse-item>
          </el-collapse>
        <div class="msg-box content">{{msgContent.content.content}}</div>
        <el-tag type="warning" class="aiTag"><i class="el-icon-warning-outline"></i>本回答由 AI 生成，内容仅供参考，请仔细甄别</el-tag>
        </div>
      </template>
      <template v-else-if="msgContent.content.contentType === 104">
        <div class="msg-box sendAiMsg" v-if="msgContent.content.msgContent">
          <template v-if="msgContent.content.fileUrl">
          <div @click="preview" class="msg-box file">
            <mFile :fileContent="msgContent.content" :fileType="fileType"></mFile>
          </div>
          </template>
          <div>{{msgContent.content.msgContent}}</div>
        </div>
        <div class="msg-box file" @click="preview" v-else>
          <mFile :fileContent="fileContent" :fileType="fileType"></mFile>
        </div>
      </template>
      <template v-else-if="[1001,1002,1003,1004,1005].includes(msgContent.content.contentType)">
        {{messageReplay(msgContent.content.contentObj)}}
      </template>
    </div>
  </div>
</template>

<script>
import { getFileType } from '@/utils/commond'
import VoiceMessage from './VoiceMessage.vue'
import { getTimeStringAutoShort2 } from './js/conversationWrap'
import moment from 'moment';
import mFile from './components/m-file.vue';
export default {
  components: { VoiceMessage,mFile },
  props: {
    msgContent: {
      required: true
    },
    aiLoading:{
      type:Boolean,
      default:false
    },
    timeShow:{
      type:Boolean,
      default:false
    },
    orgShow:{
      type:Boolean,
      default:false
    }
  },
  computed: {
    user() {
      return JSON.parse(sessionStorage.getItem('user') || '{}')
    },
    isMine(){
      return this.user.pkId == this.msgContent.fromUID
    },
  },
  mounted() {
    // console.log(this.msgContent);
    this.userName = this.msgContent.userName
    this.orgName = this.msgContent.orgName
    this.time = getTimeStringAutoShort2(this.msgContent.timestamp * 1000, true)
    // this.time = moment(this.msgContent.timestamp * 1000).format('yyyy/MM/DD HH:mm')
    if (this.msgContent.content.contentType == 1) {
      // this.msg = this.msgContent.content.text
    } else if (this.msgContent.content.contentType == 101) {
      if(this.msgContent.content.total){
        console.log(this.msgContent);
        
        this.fileContent = this.msgContent.content
        this.fileType = getFileType(this.fileContent.fileName)
        return
      }
      this.fileContent = this.msgContent.content.fileUrl?this.msgContent.content:this.msgContent.content.contentObj
      this.fileType = getFileType(this.fileContent.fileUrl?this.fileContent.fileUrl:this.fileContent.url)
      // this.size = this.fileContent.size?this.formatFileSize(this.fileContent.size):'未知大小'
    }else if (this.msgContent.content.contentType == 102) {
      this.fileContent = this.msgContent.content.fileUrl?this.msgContent.content:this.msgContent.content.contentObj
      console.log('fileContent',this.fileContent);
    }else if (this.msgContent.content.contentType == 104) {
      this.fileContent = this.msgContent.content.fileUrl?this.msgContent.content:this.msgContent.content.contentObj
      this.fileType = getFileType(this.fileContent.fileUrl?this.fileContent.fileUrl:this.fileContent.url)
      // this.size = this.fileContent.size?this.formatFileSize(this.fileContent.size):'未知大小'
    }
    else if([1001,1002,1003,1004,1005].includes(this.msgContent.content.contentType)){
    //  return this.messageReplay(msg.contentObj)
    }
  },
  data() {
    return {
      fileType: null,
      fileContent: { fileUrl: '', fileName: '' },
      // isMine: false,
      msg: '',
      time: '',
      userName: '',
      size:'',
      orgName:'',
      activeNames:'1'
    }
  },
  methods: {
    messageReplay(obj){
      let str = obj.content.replace(/\{(\d+)\}/g, (match, index) => {
          const idx = parseInt(index, 10);
          return obj.extra[idx]?obj.extra[idx].name : match; // 处理索引超出范围的情况
      });
      return str
    },
    getFileTypes() {
      let url = this.fileContent.fileUrl
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
    preview() {
      if ([101,104].includes(this.msgContent.content.contentType)) {
        let url = this.fileContent.fileUrl?this.fileContent.fileUrl:this.fileContent.url
        let name = this.fileContent.fileName?this.fileContent.fileName:this.fileContent.name
        if(!url){
          return
        }
        this.$emit('preview', url, name)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-msg {
  margin-bottom: 6px;
  .time {
    color: #203457;
  }
  .msg {
    display: flex;
    .msg-box {
      max-width: 100%;
      padding: 12px;
      border-radius: 8px;
      background-color: #fff;
      text-align: left;
      white-space: pre-wrap;
      box-shadow: 0px 2px 4px 0px #0229641A;
    }
    .loadingBox{
      white-space: nowrap;
    }
    
  }
  .aiMsg{
    width: 80%;
    background-color: #fff;
    padding-top: 8px;
    border-radius: 8px;
    box-shadow: 0px 2px 4px 0px #0229641A;
    .aiTag{
      margin-left: 8px;
      margin-bottom: 8px;
    }
    .reasoningContent{
      display: flex;
      color: $text-secondary;
      padding: 10px;
      background-color: #fff;
      &::before{
        content: '';
        display: block;
        width: 3px;
        margin-right: 6px;
        height: auto;
        background-color: $text-placeholder;
      }
      .msg-box{
        flex: 1;
        padding: 0;
        box-shadow:none
      }
    }
    .content{
      color: $text-primary;
      box-shadow:none
      // background-color: #fff;
    }
  }
  .orgName{
    font-size: $font-size-extra-small;
    color: $text-secondary;
  }
}
.mine {
  text-align: right;
  .msg {
    justify-content: flex-end;
    .msg-box {
      background-color: #D6E6FF;
    }
  }
}
.file {
  position: relative;
  display: flex;
  width: 300px;
  min-height: 60px;
  cursor: pointer;
  // border:1px solid $borderColor;
  .file-detail {
    display: flex;
    flex-direction: column;
    width: calc(100% - 50px);
    .file-size{
      font-size: $font-size-extra-small;
      color: $text-secondary;
    }
  }
  .file-icon {
    width: 50px;
    height: 50px;
    font-size: 50px;
    color: unset;
  }
  img{
      width: 50px;
      height: 50px;
    }
}
.images {
  //   max-width: 50%;
  // max-width: 360px;
  width: auto;
  height: 200px;
  background-color: #fff;
}
.video{
  // width: 100px;
  position: relative;
  height: 200px;
  &::before{
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1;
  }
}
.loading-icon{
  font-size: 20px;
}
.systemMsg{
  display: flex;
  // justify-content: center;
  align-items: center;
  flex-direction: column;
  .msg {
    justify-content: center;
    font-size: $font-size-extra-small;
    color: $text-secondary;
    text-align: center;
  }
}
/deep/ .el-collapse{
  border: none;
  background-color: #fff;
  .el-collapse-item__header{
    height: 30px;
    padding: 10px;
    border:none;
    background-color: #fff;
    border-radius: 8px;
  }
  .el-collapse-item__wrap{
    border-bottom: none;
  }
  .el-collapse-item__content{
    padding-bottom: 0;
  }
  .el-collapse-item__arrow{
    display: none;
  }
} 
.sendAiMsg{
  display: flex;
  flex-direction: column;
}
.progress {
  position: absolute;
  width: 274px;
  bottom: 0;
  z-index: 2;
  /deep/ .el-progress-bar__inner {
    background: $primary-color;
  }
}
</style>
