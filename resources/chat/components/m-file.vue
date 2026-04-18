<template>
  <div class="file">
    <div class="file-detail">
      <div class="file-name ellipsistwo">{{ fileContent.fileName }}</div>
      <div class="file-name">{{ size }}</div>
    </div>
    <img src="@/assets/fileType/excel.png" alt="" v-if="fileType == 'excel'" />
    <img src="@/assets/fileType/pdf.png" alt="" v-else-if="fileType == 'pdf'" />
    <img src="@/assets/fileType/word.png" alt="" v-else-if="fileType == 'word'" />
    <img src="@/assets/fileType/order.png" alt="" v-else />
  </div>
</template>

<script>
export default {
  props: {
    fileContent: {
      type: Object,
      default: () => {
        return { fileUrl: '', fileName: '', size: '' }
      }
    },
    fileType: {
      type: String,
      default: ''
    }
  },
  computed: {
    size() {
      return this.fileContent.size ? this.formatFileSize(this.fileContent.size) : '未知大小'
    }
  },
  methods: {
    formatFileSize(size) {
      if (size < 1024 * 1024) {
        const temp = size / 1024
        return temp.toFixed(2) + 'KB'
      } else if (size < 1024 * 1024 * 1024) {
        const temp = size / (1024 * 1024)
        return temp.toFixed(2) + 'MB'
      } else {
        const temp = size / (1024 * 1024 * 1024)
        return temp.toFixed(2) + 'GB'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.file {
  display: flex;
  width: 300px;
  min-height: 60px;
  cursor: pointer;
  border: 1px solid $borderColor;
  .file-detail {
    display: flex;
    flex-direction: column;
    width: calc(100% - 50px);
    .file-size {
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
  img {
    width: 50px;
    height: 50px;
  }
}
</style>
