<template>
  <div class="page process-page">
    <h2 class="page-title">工序进度甘特</h2>

    <el-card class="card-block gantt-card" shadow="never">
      <div class="gantt-header">
        <span>工序</span>
        <span>时间轴</span>
      </div>
      <div v-for="item in ganttItems" :key="item.id" class="gantt-row">
        <span class="gantt-name">{{ item.name }}</span>
        <div class="gantt-track">
          <div
            class="gantt-bar"
            :class="item.acceptanceStatus === ACCEPTANCE_STATUS.DONE ? 'bar-done' : 'bar-pending'"
            :style="item.barStyle"
          />
        </div>
      </div>
    </el-card>

    <el-card v-for="process in state.processes" :key="process.id" class="card-block process-card" shadow="never">
      <div class="process-head">
        <h3>{{ process.name }}</h3>
        <el-tag :type="statusTagType(process.acceptanceStatus)" size="small">
          {{ process.acceptanceStatus }}
        </el-tag>
      </div>
      <div class="process-meta">
        <span>开始：{{ process.startDate }}</span>
        <span>结束：{{ process.endDate }}</span>
        <span>施工天数：{{ getProcessDays(process) }} 天</span>
      </div>
      <p v-if="process.note" class="process-note">备注：{{ process.note }}</p>
      <div class="process-actions">
        <el-select
          v-model="process.acceptanceStatus"
          size="small"
          style="width: 120px"
          @change="(val) => onStatusChange(process.id, val)"
        >
          <el-option label="未验收" :value="ACCEPTANCE_STATUS.NONE" />
          <el-option label="部分验收" :value="ACCEPTANCE_STATUS.PARTIAL" />
          <el-option label="已验收" :value="ACCEPTANCE_STATUS.DONE" />
        </el-select>
        <el-button type="primary" size="small" round @click="openEdit(process)">编辑</el-button>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑工序" width="90%" style="max-width: 420px">
      <el-form label-width="90px">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工序备注">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ACCEPTANCE_STATUS } from '../constants'
import { useAppStore } from '../composables/useAppStore'

const { state, updateProcess, getProcessDays } = useAppStore()

const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ startDate: '', endDate: '', note: '' })

const timeline = computed(() => {
  const dates = state.processes.flatMap((p) => [p.startDate, p.endDate]).filter(Boolean)
  if (!dates.length) return { min: '', max: '' }
  const sorted = [...dates].sort()
  return { min: sorted[0], max: sorted[sorted.length - 1] }
})

const ganttItems = computed(() => {
  const { min, max } = timeline.value
  if (!min || !max) return []
  const total = new Date(max) - new Date(min) || 1
  return state.processes.map((p) => {
    const left = ((new Date(p.startDate) - new Date(min)) / total) * 100
    const width = ((new Date(p.endDate) - new Date(p.startDate)) / total) * 100 + 2
    return {
      id: p.id,
      name: p.name,
      acceptanceStatus: p.acceptanceStatus,
      barStyle: {
        left: `${Math.max(0, left)}%`,
        width: `${Math.max(4, width)}%`,
      },
    }
  })
})

function statusTagType(status) {
  if (status === ACCEPTANCE_STATUS.DONE) return 'success'
  if (status === ACCEPTANCE_STATUS.PARTIAL) return 'warning'
  return 'info'
}

function openEdit(process) {
  editingId.value = process.id
  form.startDate = process.startDate
  form.endDate = process.endDate
  form.note = process.note
  dialogVisible.value = true
}

function submitEdit() {
  if (!form.startDate || !form.endDate) {
    ElMessage.warning('请完善必填信息')
    return
  }
  if (form.endDate < form.startDate) {
    ElMessage.warning('结束时间不能早于开始时间')
    return
  }
  updateProcess(editingId.value, {
    startDate: form.startDate,
    endDate: form.endDate,
    note: form.note,
  })
  dialogVisible.value = false
}

function onStatusChange(id, val) {
  updateProcess(id, { acceptanceStatus: val })
}
</script>

<style scoped>
.gantt-card {
  margin-bottom: 12px;
}
.gantt-header,
.gantt-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}
.gantt-track {
  position: relative;
  height: 18px;
  background: #f2f6fc;
  border-radius: 4px;
}
.gantt-bar {
  position: absolute;
  top: 2px;
  height: 14px;
  border-radius: 4px;
}
.bar-done {
  background: #409EFF;
}
.bar-pending {
  background: #a0cfff;
}
.process-card {
  margin-bottom: 12px;
}
.process-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.process-head h3 {
  margin: 0;
  font-size: 16px;
}
.process-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.process-note {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px;
}
.process-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
