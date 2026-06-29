<template>
  <div class="acceptance-section">
    <div class="section-toolbar">
      <el-button type="primary" round @click="openDialog">新增验收</el-button>
    </div>

    <EmptyState v-if="!state.acceptances.length" />
    <el-card
      v-for="item in state.acceptances"
      :key="item.id"
      class="card-block acceptance-card"
      shadow="never"
    >
      <div class="acceptance-head">
        <div>
          <h3>{{ item.processName }}</h3>
          <p class="acceptance-date">{{ item.date }}</p>
        </div>
        <el-tag :type="item.result === ACCEPTANCE_RESULT.PASS ? 'success' : 'danger'" size="small">
          {{ item.result }}
        </el-tag>
      </div>
      <p v-if="item.comment" class="acceptance-comment">{{ item.comment }}</p>
      <ul v-if="item.result === ACCEPTANCE_RESULT.FAIL && item.failItems?.length" class="fail-list">
        <li v-for="(failItem, idx) in item.failItems" :key="idx">{{ failItem }}</li>
      </ul>
      <div v-if="item.images.length" class="image-list">
        <el-image
          v-for="(img, idx) in item.images"
          :key="idx"
          :src="img"
          :preview-src-list="item.images"
          fit="cover"
          class="thumb"
        />
      </div>
      <div class="card-footer">
        <el-button type="danger" link @click="remove(item.id)">删除</el-button>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增验收记录" width="90%" style="max-width: 480px">
      <el-form label-width="90px">
        <el-form-item label="所属工序" required>
          <el-select v-model="form.processName" placeholder="请选择工序" style="width: 100%">
            <el-option v-for="name in PROCESS_NAMES" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item label="验收日期" required>
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择验收日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="验收结果" required>
          <el-radio-group v-model="form.result" @change="onResultChange">
            <el-radio :label="ACCEPTANCE_RESULT.PASS">合格</el-radio>
            <el-radio :label="ACCEPTANCE_RESULT.FAIL">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.result === ACCEPTANCE_RESULT.FAIL" label="不合格项" required>
          <div v-for="(_, index) in form.failItems" :key="index" class="fail-item-row">
            <el-input v-model="form.failItems[index]" placeholder="描述不合格位置或问题" />
            <el-button v-if="form.failItems.length > 1" link type="danger" @click="removeFailItem(index)">
              删除
            </el-button>
          </div>
          <el-button link type="primary" @click="addFailItem">+ 添加不合格项</el-button>
        </el-form-item>
        <el-form-item label="验收评语">
          <el-input v-model="form.comment" type="textarea" :rows="3" placeholder="请输入验收评语" />
        </el-form-item>
        <el-form-item label="图片上传">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            multiple
            @change="onFileChange"
          >
            <el-button type="primary" plain>选择图片</el-button>
          </el-upload>
          <div v-if="form.images.length" class="image-list preview-list">
            <el-image v-for="(img, idx) in form.images" :key="idx" :src="img" fit="cover" class="thumb" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PROCESS_NAMES, ACCEPTANCE_RESULT } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import EmptyState from './EmptyState.vue'

const { state, addAcceptance, deleteAcceptance } = useAppStore()

const dialogVisible = ref(false)
const form = reactive({
  processName: '',
  date: '',
  result: ACCEPTANCE_RESULT.PASS,
  comment: '',
  images: [],
  failItems: [''],
})

function resetFailItems() {
  form.failItems = ['']
}

function addFailItem() {
  form.failItems.push('')
}

function removeFailItem(index) {
  form.failItems.splice(index, 1)
}

function onResultChange(val) {
  if (val === ACCEPTANCE_RESULT.FAIL && !form.failItems.length) {
    resetFailItems()
  }
}

function openDialog() {
  form.processName = ''
  form.date = ''
  form.result = ACCEPTANCE_RESULT.PASS
  form.comment = ''
  form.images = []
  resetFailItems()
  dialogVisible.value = true
}

function onFileChange(uploadFile) {
  const file = uploadFile.raw
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => {
    form.images.push(e.target.result)
  }
  reader.readAsDataURL(file)
}

function submit() {
  if (!form.processName || !form.date || !form.result) {
    ElMessage.warning('请完善必填信息')
    return
  }

  const failItems = form.failItems.map((item) => item.trim()).filter(Boolean)
  if (form.result === ACCEPTANCE_RESULT.FAIL && !failItems.length) {
    ElMessage.warning('请至少填写一项不合格内容')
    return
  }

  addAcceptance({
    processName: form.processName,
    date: form.date,
    result: form.result,
    comment: form.comment.trim(),
    images: [...form.images],
    failItems,
  })
  dialogVisible.value = false
  ElMessage.success(
    form.result === ACCEPTANCE_RESULT.FAIL ? '验收记录已添加，不合格项已加入待办' : '验收记录已添加'
  )
}

function remove(id) {
  ElMessageBox.confirm('确定删除该验收记录吗？', '提示', { type: 'warning' })
    .then(() => {
      deleteAcceptance(id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<style scoped>
.section-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.acceptance-card {
  margin-bottom: 12px;
}
.acceptance-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.acceptance-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
.acceptance-date {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.acceptance-comment {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}
.fail-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #F56C6C;
  font-size: 14px;
}
.fail-list li {
  margin-bottom: 4px;
}
.fail-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.fail-item-row .el-input {
  flex: 1;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
}
.preview-list {
  margin-top: 12px;
}
.card-footer {
  margin-top: 8px;
  text-align: right;
}
@media (max-width: 640px) {
  .section-toolbar .el-button {
    width: 100%;
  }
  .acceptance-head {
    flex-direction: column;
    gap: 8px;
  }
  .fail-item-row {
    flex-direction: column;
    align-items: stretch;
  }
  .fail-item-row .el-button {
    align-self: flex-end;
  }
}
</style>
