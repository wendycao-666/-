<template>
  <div class="page process-page">
    <h2 class="page-title">工序进度甘特</h2>

    <el-card class="card-block gantt-card" shadow="never">
      <div class="gantt-scroll">
        <div class="gantt-inner">
      <div class="gantt-header">
        <span class="gantt-header-label">工序</span>
        <div class="gantt-axis-wrap">
          <div class="gantt-axis">
            <span
              v-for="tick in timelineTicks"
              :key="tick.date"
              class="axis-tick"
              :style="{ left: `${tick.left}%` }"
              :title="tick.date"
            >
              {{ tick.label }}
            </span>
            <span
              v-if="todayMarker.visible"
              class="axis-today"
              :style="{ left: todayMarker.left }"
              :title="`今天 ${todayMarker.date}`"
            >
              今天
            </span>
          </div>
        </div>
      </div>

      <p v-if="!todayMarker.visible && todayMarker.hint" class="gantt-today-hint">{{ todayMarker.hint }}</p>

      <div v-for="group in ganttGroups" :key="group.id" class="gantt-group">
        <div class="gantt-row gantt-row-parent" @click="toggleGroup(group.id)">
          <span class="gantt-name">
            <el-icon class="gantt-arrow" :class="{ expanded: expandedGroups[group.id] }">
              <ArrowRight />
            </el-icon>
            {{ group.name }}
          </span>
          <div class="gantt-track">
            <div
              v-for="tick in timelineTicks"
              :key="`${group.id}-grid-${tick.date}`"
              class="gantt-grid-line"
              :style="{ left: `${tick.left}%` }"
            />
            <div v-if="todayMarker.visible" class="gantt-today-line" :style="{ left: todayMarker.left }" />
            <div
              class="gantt-bar"
              :class="group.acceptanceStatus === ACCEPTANCE_STATUS.DONE ? 'bar-done' : 'bar-pending'"
              :style="group.barStyle"
              :title="group.dateRange"
            />
          </div>
        </div>
        <div v-show="expandedGroups[group.id]" class="gantt-children">
          <div v-for="sub in group.subtasks" :key="sub.id" class="gantt-row gantt-row-child">
            <span class="gantt-name gantt-name-sub">{{ sub.name }}</span>
            <div class="gantt-track">
              <div
                v-for="tick in timelineTicks"
                :key="`${sub.id}-grid-${tick.date}`"
                class="gantt-grid-line"
                :style="{ left: `${tick.left}%` }"
              />
              <div v-if="todayMarker.visible" class="gantt-today-line" :style="{ left: todayMarker.left }" />
              <div
                class="gantt-bar gantt-bar-sub"
                :class="group.acceptanceStatus === ACCEPTANCE_STATUS.DONE ? 'bar-done' : 'bar-pending'"
                :style="sub.barStyle"
                :title="sub.dateRange"
              />
            </div>
          </div>
        </div>
      </div>
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
import { ArrowRight } from '@element-plus/icons-vue'
import { ACCEPTANCE_STATUS, PROCESS_SUBTASKS } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { buildSubtaskSchedule } from '../utils/workday'
import { todayStr, formatDate } from '../utils/date'

const { state, updateProcess, getProcessDays } = useAppStore()

const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ startDate: '', endDate: '', note: '' })

const expandedGroups = reactive(
  Object.fromEntries(state.processes.map((p) => [p.id, true]))
)

const timeline = computed(() => {
  const dates = state.processes.flatMap((p) => [p.startDate, p.endDate]).filter(Boolean)
  if (!dates.length) return { min: '', max: '', total: 1 }
  const sorted = [...dates].sort()
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const total = new Date(max) - new Date(min) || 1
  return { min, max, total }
})

function calcTimelinePercent(dateStr) {
  const { min, total } = timeline.value
  if (!min || !dateStr) return 0
  return ((new Date(dateStr) - new Date(min)) / total) * 100
}

function buildTimelineTicks(min, max, tickCount = 6) {
  const start = new Date(min).getTime()
  const end = new Date(max).getTime()
  if (!min || !max) return []
  if (start >= end) {
    return [{ date: min, label: formatTickLabel(min), left: 0 }]
  }

  const ticks = []
  for (let i = 0; i < tickCount; i += 1) {
    const ratio = i / (tickCount - 1)
    const time = start + (end - start) * ratio
    const date = formatDate(new Date(time))
    ticks.push({
      date,
      label: formatTickLabel(date),
      left: ratio * 100,
    })
  }
  return ticks
}

function formatTickLabel(dateStr) {
  const [, month, day] = dateStr.split('-')
  return `${month}/${day}`
}

const timelineTicks = computed(() => buildTimelineTicks(timeline.value.min, timeline.value.max))

const todayMarker = computed(() => {
  const { min, max } = timeline.value
  const today = todayStr()
  if (!min || !max) {
    return { visible: false, left: '0%', date: today, hint: '' }
  }
  if (today < min) {
    return { visible: false, left: '0%', date: today, hint: `今天 ${today}，尚未到首期工序（${min} 开工）` }
  }
  if (today > max) {
    return { visible: false, left: '0%', date: today, hint: `今天 ${today}，全部工序已结束（${max}）` }
  }
  return {
    visible: true,
    left: `${calcTimelinePercent(today)}%`,
    date: today,
    hint: '',
  }
})

function calcBarStyle(startDate, endDate) {
  if (!timeline.value.min || !startDate || !endDate) return { left: '0%', width: '4%' }
  const left = calcTimelinePercent(startDate)
  const width = calcTimelinePercent(endDate) - left + 2
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(4, width)}%`,
  }
}

const ganttGroups = computed(() =>
  state.processes.map((process) => {
    const subtaskDefs = PROCESS_SUBTASKS[process.name] || []
    const scheduled = buildSubtaskSchedule(process.startDate, subtaskDefs)
    return {
      id: process.id,
      name: process.name,
      acceptanceStatus: process.acceptanceStatus,
      dateRange: `${process.startDate} ~ ${process.endDate}`,
      barStyle: calcBarStyle(process.startDate, process.endDate),
      subtasks: scheduled.map((sub, index) => ({
        id: `${process.id}-${index}`,
        name: sub.name,
        dateRange: `${sub.startDate} ~ ${sub.endDate}`,
        barStyle: calcBarStyle(sub.startDate, sub.endDate),
      })),
    }
  })
)

function toggleGroup(id) {
  expandedGroups[id] = !expandedGroups[id]
}

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
.gantt-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.gantt-inner {
  min-width: 100%;
}
.gantt-header,
.gantt-row {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}
.gantt-header {
  align-items: end;
  margin-bottom: 10px;
  font-size: 12px;
  color: #909399;
}
.gantt-header-label {
  padding-bottom: 4px;
}
.gantt-axis-wrap {
  min-width: 0;
}
.gantt-axis {
  position: relative;
  height: 36px;
  border-bottom: 1px solid #dcdfe6;
}
.axis-tick {
  position: absolute;
  bottom: 6px;
  transform: translateX(-50%);
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}
.axis-today {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 11px;
  color: #F56C6C;
  font-weight: 600;
  white-space: nowrap;
}
.gantt-today-hint {
  margin: 0 0 10px 116px;
  font-size: 12px;
  color: #E6A23C;
}
.gantt-group {
  margin-bottom: 4px;
}
.gantt-row-parent {
  cursor: pointer;
  user-select: none;
}
.gantt-row-parent:hover .gantt-name {
  color: #409EFF;
}
.gantt-name {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.3;
}
.gantt-name-sub {
  padding-left: 18px;
  color: #606266;
  font-size: 12px;
}
.gantt-arrow {
  flex-shrink: 0;
  transition: transform 0.2s;
  color: #909399;
}
.gantt-arrow.expanded {
  transform: rotate(90deg);
}
.gantt-children {
  margin-bottom: 4px;
}
.gantt-row-child {
  margin-bottom: 6px;
}
.gantt-track {
  position: relative;
  height: 18px;
  background: #f2f6fc;
  border-radius: 4px;
  overflow: hidden;
}
.gantt-grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(220, 223, 230, 0.9);
  transform: translateX(-50%);
  pointer-events: none;
}
.gantt-today-line {
  position: absolute;
  top: -999px;
  bottom: -999px;
  width: 2px;
  background: #F56C6C;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
  opacity: 0.85;
}
.gantt-row-child .gantt-track {
  height: 14px;
}
.gantt-bar {
  position: absolute;
  top: 2px;
  height: 14px;
  border-radius: 4px;
  z-index: 1;
}
.gantt-bar-sub {
  top: 1px;
  height: 12px;
  opacity: 0.85;
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
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .gantt-inner {
    min-width: 520px;
  }
  .gantt-header,
  .gantt-row {
    grid-template-columns: 72px 1fr;
    gap: 6px;
  }
  .gantt-name {
    font-size: 12px;
  }
  .gantt-name-sub {
    padding-left: 14px;
    font-size: 11px;
  }
  .gantt-today-hint {
    margin-left: 78px;
    font-size: 11px;
  }
  .process-head {
    flex-wrap: wrap;
    gap: 6px;
  }
  .process-meta {
    flex-direction: column;
    gap: 4px;
  }
  .process-actions {
    width: 100%;
  }
  .process-actions .el-select {
    flex: 1;
    min-width: 0;
  }
  .process-actions .el-button {
    flex-shrink: 0;
  }
}
</style>
