<template>
  <div>
    <el-dialog title="文件管理" :visible.sync="dialogVisible" :width="$dialogSize.mini" z-index="4444">
      <div class="dialog-form files">
        <div class="fileImg">
          <img src="../../assets/fileType/excel.png" alt="" v-if="fileType == 'excel'" />
          <img src="../../assets/fileType/pdf.png" alt="" v-else-if="fileType == 'pdf'" />
          <img src="../../assets/fileType/word.png" alt="" v-else-if="fileType == 'word'" />
          <i class="file-icon el-icon-document" v-else></i>
        </div>
        <div class="fileName">{{ fileName }}</div>
      </div>
      <div slot="footer">
        <el-button @click="priview" v-if="canPrivew.includes(exit)">预览</el-button>
        <el-button type="primary" @click="download">下载</el-button>
      </div>
    </el-dialog>
    <priviewDialog ref="priviewDialog" :appendToBody="true" :notPreviewDownlaod="true"></priviewDialog>
  </div>
</template>

<script>
import { getFileType } from '@/utils/commond'
export default {
  data() {
    return {
      dialogVisible: false,
      fileName: '',
      fileUrl: '',
      fileType: '',
      exit: '',
      canPrivew: ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'avi', 'wmv', 'mpg', 'mpeg', 'mov', 'rm', 'ram', 'swf', 'flv', 'mp4', 'wma', 'rm', 'rmvb', 'flv', 'mpg', 'mkv']
    }
  },
  methods: {
    open(fileUrl, fileName) {
      this.fileUrl = fileUrl
      this.fileName = fileName
      this.fileType = getFileType(fileUrl)
      this.exit = this.fileUrl.substring(this.fileUrl.lastIndexOf('.') + 1).toLowerCase()
      this.dialogVisible = true
    },
    priview() {
      this.$refs.priviewDialog.preview(this.fileUrl, 0, this.fileName)
      this.dialogVisible = false
    },
    download() {
      this.$downFile({ url: this.fileUrl, name: this.fileName, type: this.exit }, 'chatFileDownload')
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.files {
  display: flex;
  flex-wrap: wrap;
  .file-icon {
    font-size: 25px;
  }
  .fileImg {
    width: 25px;
    height: 25px;
  }
  img {
    width: 25px;
    height: 25px;
  }
  .fileName {
    width: calc(100% - 35px);
    margin-left: 10px;
    line-height: 25px;
  }
}
</style>
