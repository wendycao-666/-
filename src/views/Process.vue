<template>
  <div class="page process-page">

    <el-tabs v-model="activeTab" class="process-tabs">
      <el-tab-pane label="进度" name="schedule">
    <el-card class="card-block gantt-card" shadow="never">
      <div class="gantt-scroll">
        <div class="gantt-inner">
      <div class="gantt-header">
        <span class="gantt-header-label">工序</span>
        <div class="gantt-axis-wrap">
          <div class="gantt-axis">
            <span
              v-for="tick in timelineTicks"
              :key="tick.id"
              class="axis-tick"
              :class="[`axis-tick-${tick.align}`, tick.row ? `axis-tick-row-${tick.row}` : '']"
              :style="{ left: `${tick.left}%` }"
              :title="`${tick.name} · ${tick.date}`"
            >
              <span class="axis-tick-date">{{ tick.label }}</span>
              <span class="axis-tick-name">{{ tick.shortName }}</span>
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
        <div class="gantt-row gantt-row-parent" :class="{ 'is-selected': selectedItemId === group.id }">
          <span class="gantt-name">
            <el-icon
              class="gantt-arrow"
              :class="{ expanded: expandedGroups[group.id] }"
              @click.stop="toggleGroup(group.id)"
            >
              <ArrowRight />
            </el-icon>
            <span class="gantt-name-main" @click="selectItem(group.id)">
              <span class="gantt-name-text">{{ group.name }}</span>
            </span>
          </span>
          <div class="gantt-track" @click="selectItem(group.id)">
            <div
              v-for="tick in timelineTicks"
              :key="`${group.id}-grid-${tick.date}`"
              class="gantt-grid-line"
              :style="{ left: `${tick.left}%` }"
            />
            <div v-if="todayMarker.visible" class="gantt-today-line" :style="{ left: todayMarker.left }" />
            <span
              v-if="selectedItemId === group.id"
              class="gantt-duration-label"
              :style="group.durationLabelStyle"
            >
              {{ group.labelText }}
            </span>
            <div
              class="gantt-bar"
              :class="{ 'bar-selected': selectedItemId === group.id }"
              :style="{ ...group.barStyle, background: group.barColor, color: group.colors.main }"
            />
          </div>
        </div>
        <div v-show="expandedGroups[group.id]" class="gantt-children">
          <div
            v-for="sub in group.subtasks"
            :key="sub.id"
            class="gantt-row gantt-row-child"
            :class="{ 'is-selected': selectedItemId === sub.id }"
          >
            <span class="gantt-name gantt-name-sub" @click="selectItem(sub.id)">
              <span class="gantt-name-text">{{ sub.name }}</span>
            </span>
            <div class="gantt-track" @click="selectItem(sub.id)">
              <div
                v-for="tick in timelineTicks"
                :key="`${sub.id}-grid-${tick.date}`"
                class="gantt-grid-line"
                :style="{ left: `${tick.left}%` }"
              />
              <div v-if="todayMarker.visible" class="gantt-today-line" :style="{ left: todayMarker.left }" />
              <span
                v-if="selectedItemId === sub.id"
                class="gantt-duration-label gantt-duration-label-sub"
                :style="sub.durationLabelStyle"
              >
                {{ sub.labelText }}
              </span>
              <div
                class="gantt-bar gantt-bar-sub"
                :class="{ 'bar-selected': selectedItemId === sub.id }"
                :style="{ ...sub.barStyle, background: sub.barColor, color: group.colors.main }"
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
        <el-button type="primary" size="small" round @click="openAcceptance(process.name)">验收</el-button>
        <el-button size="small" round @click="openEdit(process)">编辑</el-button>
      </div>
    </el-card>
      </el-tab-pane>
      <el-tab-pane label="验收" name="acceptance">
        <AcceptanceSection />
      </el-tab-pane>
    </el-tabs>

    <AcceptanceFormDialog v-model="acceptanceDialogVisible" :process-name="acceptanceProcessName" />

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
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { ACCEPTANCE_STATUS, PROCESS_SUBTASKS, PROCESS_GANTT_COLORS, COLORS } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { buildSubtaskSchedule } from '../utils/workday'
import { calcConstructionDays } from '../utils/calc'
import { todayStr } from '../utils/date'
import AcceptanceSection from '../components/AcceptanceSection.vue'
import AcceptanceFormDialog from '../components/AcceptanceFormDialog.vue'

const route = useRoute()
const router = useRouter()
const { state, updateProcess, getProcessDays } = useAppStore()

const TAB_NAMES = ['schedule', 'acceptance']
const activeTab = ref(TAB_NAMES.includes(route.query.tab) ? route.query.tab : 'schedule')

watch(activeTab, (tab) => {
  if (route.query.tab === tab) return
  router.replace({ query: { ...route.query, tab } })
})

watch(
  () => route.query.tab,
  (tab) => {
    if (TAB_NAMES.includes(tab) && tab !== activeTab.value) {
      activeTab.value = tab
    }
  }
)

const dialogVisible = ref(false)
const acceptanceDialogVisible = ref(false)
const acceptanceProcessName = ref('')
const editingId = ref('')
const form = reactive({ startDate: '', endDate: '', note: '' })

function findCurrentProcessId(processes) {
  if (!processes.length) return null
  const today = todayStr()
  const sorted = [...processes].sort((a, b) => a.startDate.localeCompare(b.startDate))

  const inProgress = sorted.find(
    (process) => process.startDate && process.endDate && today >= process.startDate && today <= process.endDate
  )
  if (inProgress) return inProgress.id

  if (today < sorted[0].startDate) return sorted[0].id

  if (today > sorted[sorted.length - 1].endDate) return sorted[sorted.length - 1].id

  const upcoming = sorted.find((process) => process.startDate > today)
  return upcoming?.id || sorted[sorted.length - 1].id
}

function buildDefaultExpandedGroups() {
  const currentId = findCurrentProcessId(state.processes)
  return Object.fromEntries(state.processes.map((process) => [process.id, process.id === currentId]))
}

const expandedGroups = reactive(buildDefaultExpandedGroups())

const selectedItemId = ref(findCurrentProcessId(state.processes) || state.processes[0]?.id || '')

function toggleGroup(id) {
  expandedGroups[id] = !expandedGroups[id]
}

function selectItem(id) {
  selectedItemId.value = id
}

function buildDurationMeta(startDate, endDate) {
  const days = calcConstructionDays(startDate, endDate)
  return {
    days,
    labelText: `${days}天  ${startDate} ~ ${endDate}`,
  }
}

function getProcessColors(processName) {
  return PROCESS_GANTT_COLORS[processName] || { main: COLORS.primary, light: '#C9A882' }
}

function buildDurationLabelStyle(barStyle, colors) {
  return {
    left: barStyle.left,
    borderColor: colors.main,
    background: `${colors.main}18`,
    color: colors.main,
  }
}

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

const PROCESS_AXIS_LABELS = {
  拆改工程: '拆改',
  水电改造: '水电',
  泥瓦工程: '泥瓦',
  木作工程: '木作',
  油漆工程: '油漆',
  安装阶段: '安装',
  开荒保洁: '保洁',
}

function buildMilestoneTicks(processes, min, max) {
  if (!min || !max || !processes.length) return []
  const start = new Date(min).getTime()
  const total = new Date(max).getTime() - start || 1
  const MIN_LABEL_GAP = 8

  const ticks = processes.map((process) => ({
    id: process.id,
    name: process.name,
    date: process.startDate,
    label: formatTickLabel(process.startDate),
    shortName: PROCESS_AXIS_LABELS[process.name] || process.name,
    left: ((new Date(process.startDate).getTime() - start) / total) * 100,
    align: 'center',
    row: 0,
  }))

  ticks[0].align = 'start'
  ticks[0].row = 0

  for (let i = 1; i < ticks.length; i += 1) {
    const gap = ticks[i].left - ticks[i - 1].left
    const isLast = i === ticks.length - 1

    if (gap < MIN_LABEL_GAP) {
      ticks[i - 1].align = 'start'
      ticks[i - 1].row = 1
      ticks[i].row = 0
      ticks[i].align = isLast ? 'end' : 'start'
    } else {
      ticks[i].row = 0
      ticks[i].align = isLast ? 'end' : 'center'
    }
  }

  return ticks
}

function formatTickLabel(dateStr) {
  const [, month, day] = dateStr.split('-')
  return `${month}/${day}`
}

const timelineTicks = computed(() =>
  buildMilestoneTicks(state.processes, timeline.value.min, timeline.value.max)
)

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
    const colors = getProcessColors(process.name)
    const parentDuration = buildDurationMeta(process.startDate, process.endDate)
    const isDone = process.acceptanceStatus === ACCEPTANCE_STATUS.DONE
    const barStyle = calcBarStyle(process.startDate, process.endDate)
    return {
      id: process.id,
      name: process.name,
      acceptanceStatus: process.acceptanceStatus,
      colors,
      startDate: process.startDate,
      endDate: process.endDate,
      days: parentDuration.days,
      labelText: parentDuration.labelText,
      durationLabelStyle: buildDurationLabelStyle(barStyle, colors),
      barColor: isDone ? colors.main : colors.light,
      barStyle,
      subtasks: scheduled.map((sub, index) => {
        const subDuration = buildDurationMeta(sub.startDate, sub.endDate)
        const subBarStyle = calcBarStyle(sub.startDate, sub.endDate)
        return {
          id: `${process.id}-${index}`,
          name: sub.name,
          startDate: sub.startDate,
          endDate: sub.endDate,
          days: subDuration.days,
          labelText: subDuration.labelText,
          durationLabelStyle: buildDurationLabelStyle(subBarStyle, colors),
          barColor: colors.light,
          barStyle: subBarStyle,
        }
      }),
    }
  })
)

function statusTagType(status) {
  if (status === ACCEPTANCE_STATUS.DONE) return 'success'
  if (status === ACCEPTANCE_STATUS.FAIL) return 'danger'
  return 'info'
}

function openAcceptance(processName) {
  acceptanceProcessName.value = processName
  acceptanceDialogVisible.value = true
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
</script>

<style scoped>
.process-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
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
  grid-template-columns: 152px 1fr;
  gap: 10px;
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
  height: 48px;
  border-bottom: 1px solid #dcdfe6;
}
.axis-tick {
  position: absolute;
  bottom: 2px;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}
.axis-tick-row-1 {
  bottom: 22px;
}
.axis-tick-date {
  font-size: 11px;
  font-weight: 600;
  color: #606266;
  line-height: 1.15;
}
.axis-tick-name {
  font-size: 10px;
  color: #909399;
  line-height: 1.15;
}
.axis-tick-start {
  transform: translateX(0);
}
.axis-tick-center {
  transform: translateX(-50%);
}
.axis-tick-end {
  transform: translateX(-100%);
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
  margin: 0 0 10px 162px;
  font-size: 12px;
  color: #E6A23C;
}
.gantt-group {
  margin-bottom: 4px;
}
.gantt-row-parent {
  user-select: none;
}
.gantt-row-parent.is-selected,
.gantt-row-child.is-selected {
  background: #fafcff;
  border-radius: 6px;
  padding: 22px 0 4px;
}
.gantt-name-main,
.gantt-name-sub,
.gantt-track {
  cursor: pointer;
}
.gantt-name-main:hover .gantt-name-text,
.gantt-name-sub:hover .gantt-name-text {
  color: var(--reno-primary);
}
.gantt-name {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.3;
  min-width: 0;
}
.gantt-name-main,
.gantt-name-sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.gantt-name-text {
  line-height: 1.3;
  font-weight: 500;
}
.gantt-name-sub {
  padding-left: 18px;
  color: #606266;
  font-size: 12px;
}
.gantt-arrow {
  flex-shrink: 0;
  margin-top: 1px;
  cursor: pointer;
  transition: transform 0.2s;
  color: #909399;
}
.gantt-arrow:hover {
  color: var(--reno-primary);
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
  height: 22px;
  background: #f2f6fc;
  border-radius: 4px;
  overflow: visible;
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
  height: 18px;
}
.gantt-bar {
  position: absolute;
  top: 3px;
  height: 16px;
  border-radius: 4px;
  z-index: 1;
}
.gantt-bar-sub {
  top: 2px;
  height: 14px;
  opacity: 0.92;
}
.gantt-bar.bar-selected {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
  z-index: 2;
}
.gantt-duration-label {
  position: absolute;
  top: -24px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 5px 10px;
  border-left: 3px solid;
  border-radius: 4px;
  z-index: 4;
  pointer-events: none;
  transform: translateX(0);
}
.gantt-duration-label-sub {
  top: -22px;
  font-size: 11px;
  padding: 4px 8px;
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
  .process-tabs :deep(.el-tabs__item) {
    padding: 0 14px;
    font-size: 14px;
  }
  .gantt-inner {
    min-width: 520px;
  }
  .axis-tick-date {
    font-size: 10px;
  }
  .axis-tick-name {
    font-size: 9px;
  }
  .gantt-header,
  .gantt-row {
    grid-template-columns: 108px 1fr;
    gap: 8px;
  }
  .gantt-name {
    font-size: 12px;
  }
  .gantt-name-sub {
    padding-left: 14px;
    font-size: 11px;
  }
  .gantt-duration-label {
    font-size: 11px;
    padding: 4px 8px;
  }
  .gantt-today-hint {
    margin-left: 116px;
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
  .process-actions .el-button {
    flex: 1;
  }
}
</style>
