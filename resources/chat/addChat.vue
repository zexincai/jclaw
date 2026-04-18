<template>
  <div>
    <el-dialog visible lock-scroll @close="close" :close-on-click-modal="false" class="addChatIndex">
      <div class="addChatDialog">
        <div class="addChatDialog-left">
          <div class="tree-search">
            <el-input v-model="treeInput"></el-input>
          </div>
          <el-tree class="tree" ref="tree" @check-change="checkChange" :data="treeList" :props="props" show-checkbox :filter-node-method="filterNode" :node-key="'pkId'"> </el-tree>
        </div>
        <div class="addChatDialog-right">
          <div class="channelName" v-if="onlyPeoList.length > 1 && !defaultList.length">
            <div>创建群聊</div>
            <el-input v-model="channelName" placeholder="请输入群聊名称" maxlength="25" show-word-limit></el-input>
          </div>
          <div class="channel-peo-list" :class="{ contentHeight1: onlyPeoList.length <= 1, contentHeight2: onlyPeoList.length > 1 }">
            <div class="channel-peo-list-head">
              <div>群成员</div>
              <div>已选{{ onlyPeoList.length }}人</div>
            </div>
            <el-row :span="24" class="channel-peo-list-content">
              <template v-for="item in treeCheckList">
                <el-col :span="24" v-if="item.grade == 1" :key="item.pkId">
                  {{item.nickName}}:
                </el-col>
              <el-col :span="11" class="channel-peo-list-item" :key="item.pkId" v-else>
                <div class="channel-icon el-icon-user-solid"></div>
                <div class="channel-peo">{{ item.nickName }}</div>
                <div class="channel-icon el-icon-close" @click="clearPeo(item)"></div>
              </el-col>
              </template>
            </el-row>
          </div>
          <div class="channel-btn">
            <el-button size="small" @click="close">取消</el-button>
            <el-button size="small" type="primary" @click="save" :disabled="!onlyPeoList.length" v-if="defaultList.length">保存</el-button>
            <el-button size="small" type="primary" @click="addChat" :disabled="!onlyPeoList.length" v-else>创建</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      treeInput: '',
      treeList: [],
      props: {
        label: 'nickName',
        children: 'children'
      },
      channelName: '',
      treeCheckList: [],
      timer: null
    }
  },
  props: {
    defaultList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    user() {
      return JSON.parse(sessionStorage.getItem('user') || '{}')
    },
    onlyPeoList() {
      return this.treeCheckList.filter(item=>!item.grade)
    }
  },
  watch: {
    treeInput(val) {
      if (val) {
        val = val.replace(/\s+/g, '')
      }
      this.$refs.tree.filter(val)
    }
  },
  mounted() {
    this.getList()
  },
  methods: {
    getList() {
      this.$api.findChatIMCustomList().then(res => {
        if (res.code == 200) {
          res.data.forEach(item => {
            item.grade = 1
            item.children.forEach(item2=>item2.grade = 2)
          })
          console.log('treeList',res.data);
          
          this.treeList = res.data
          if (this.defaultList.length) {
            this.$nextTick(() => {
              console.log(this.defaultList)

              this.$refs.tree.setCheckedKeys(this.defaultList)
            })
          }
        } else {
          this.$message.warning(res.msg)
        }
      })
    },
    checkChange() {
      console.log('触发')

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.treeCheckList = this.$refs.tree ? this.$refs.tree.getCheckedNodes(false,true).filter(item=>item.grade!=2) : []
      }, 200)
    },
    filterNode(value, data) {
      if (!value) return true
      console.log(data.nickName)

      return data.nickName.indexOf(value) !== -1
    },
    addChat() {
      let arr = this.treeCheckList.filter(item=>!item.grade)
      if (arr.length > 1 && !this.channelName) {
        this.$message.warning('请输入群聊名称')
      }
      if(arr.length == 1&&arr[0].telephone==this.user.telephone){
        this.$message.warning('同一账号不能私聊')
        return
      }
      if (this.addLoading) return
      this.addLoading = true
      setTimeout(() => (this.addLoading = false), 500)
      this.$emit('addChat', arr, this.channelName)
    },
    save() {
      let orginArr = this.defaultList.filter(item => item != this.user.pkId)
      let arr = this.treeCheckList.filter(item=>!item.grade).map(item => item.pkId)
      let deleteSubscribers = orginArr.filter(item => !arr.includes(item))
      // 找出被添加的元素（在这个例子中，因为我们删除了一个元素，所以理论上没有新添加的元素）
      let subscribers = arr.filter(item => !orginArr.includes(item))
      let obj = {
        deleteSubscribers,
        subscribers
      }
      console.log(obj)

      this.$emit('save', obj, this.treeCheckList)
    },
    clearPeo(row) {
      let arr = this.treeCheckList.filter(item => item.pkId != row.pkId && !item.grade).map(item => item.pkId)
      console.log(row, this.treeCheckList, arr)
      this.$refs.tree.setCheckedKeys(arr)
      this.$nextTick(() => {
        this.treeCheckList = this.$refs.tree ? this.$refs.tree.getCheckedNodes(false,true).filter(item=>item.grade!=2) : []
      })
    },
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.addChatDialog {
  display: flex;
  min-height: 400px;
  .addChatDialog-left,
  .addChatDialog-right {
    width: 50%;
    padding: 20px;
  }
  .addChatDialog-left {
    border-right: 1px solid #b3baca;
    .tree-search {
      padding-bottom: 10px;
    }
    .tree {
      overflow: auto;
      height: 400px;
    }
  }
  .addChatDialog-right {
    .channelName {
      height: 80px;
    }
    .channel-peo-list {
      height: 400px;
      .channel-peo-list-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 30px;
      }
      .channel-peo-list-content {
        overflow: auto;
        height: calc(100% - 30px);
      }
      .channel-peo-list-item {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 10px;
        margin-bottom: 4px;
        margin-right:4px;
        background-color: #fafafa;
        .channel-peo {
          width: calc(100% - 30px);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .el-icon-close {
          font-size: 14px;
          cursor: pointer;
        }
        .channel-icon {
          font-size: 14px;
        }
      }
    }
    .channel-btn {
      display: flex;
      justify-content: center;
      height: 40px;
      /deep/ .el-button {
        width: 200px;
      }
    }
  }
}
.contentHeight1 {
  height: calc(100% - 40px);
}
.contentHeight2 {
  height: calc(100% - 120px);
}
</style>
<style lang="scss">
.addChatIndex{
  .el-dialog__header {
  display: none;
}
  &.el-dialog__wrapper {
    z-index: 4005!important;
  }
}
</style>