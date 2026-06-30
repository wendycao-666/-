<template>
  <el-dialog v-model="visible" title="新增验收记录" width="90%" style="max-width: 480px" @closed="onClosed">
    <el-form label-width="90px">
      <el-form-item label="所属工序" required>
        <el-select
          v-model="form.processName"
          placeholder="请选择工序"
          style="width: 100%"
          :disabled="!!fixedProcessName"
        >
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
        <div v-if="form.images.length" class="image-list">
          <el-image v-for="(img, idx) in form.images" :key="idx" :src="img" fit="cover" class="thumb" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { PROCESS_NAMES, ACCEPTANCE_RESULT } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { todayStr } from '../utils/date'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  processName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const { addAcceptance } = useAppStore()

const visible = ref(props.modelValue)
const fixedProcessName = ref('')

const form = reactive({
  processName: '',
  date: '',
  result: ACCEPTANCE_RESULT.PASS,
  comment: '',
  images: [],
  failItems: [''],
})

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) open(props.processName)
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
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

function open(processName = '') {
  fixedProcessName.value = processName
  form.processName = processName
  form.date = todayStr()
  form.result = ACCEPTANCE_RESULT.PASS
  form.comment = ''
  form.images = []
  resetFailItems()
}

function onClosed() {
  fixedProcessName.value = ''
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
  visible.value = false
  emit('submitted')
  ElMessage.success(
    form.result === ACCEPTANCE_RESULT.FAIL ? '验收记录已添加，不合格项已加入待办' : '验收记录已添加'
  )
}
</script>

<style scoped>
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
  margin-top: 12px;
}
.thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
}
@media (max-width: 640px) {
  .fail-item-row {
    flex-direction: column;
    align-items: stretch;
  }
  .fail-item-row .el-button {
    align-self: flex-end;
  }
}
</style>
