<template>
  <div class="page home">
    <header class="home-header">
      <div class="home-header-main">
        <h1 class="home-title">{{ state.house.address || '装修项目' }}</h1>
        <p class="home-subtitle">{{ houseMeta }}</p>
      </div>
      <div class="home-header-actions">
        <CloudSyncBadge @open="cloudDialogVisible = true" />
        <el-button type="primary" link @click="openHouseDialog">编辑</el-button>
      </div>
    </header>

    <button type="button" class="home-decision-strip" @click="router.push(ROUTES.PROCESS)">
      <span class="decision-item">
        <span class="decision-label">当前工序</span>
        <span class="decision-value">{{ currentProgress.processName }}</span>
      </span>
      <span class="decision-divider" aria-hidden="true" />
      <span class="decision-item">
        <span class="decision-label">待采购</span>
        <span class="decision-value" :class="{ 'decision-value--alert': phasePendingCount > 0 }">
          {{ phasePendingCount }} 项
        </span>
      </span>
      <span class="decision-divider" aria-hidden="true" />
      <span class="decision-item">
        <span class="decision-label">还能花多少</span>
        <span
          class="decision-value"
          :class="budgetSummary.overallRemaining < 0 ? 'decision-value--danger' : 'decision-value--primary'"
        >
          ¥ {{ formatMoney(budgetSummary.overallRemaining) }}
        </span>
      </span>
    </button>

    <button
      v-if="showCloudPrompt"
      type="button"
      class="home-cloud-prompt"
      @click="cloudDialogVisible = true"
    >
      创建分享链接，与家人同步查看 →
    </button>

    <section class="home-hero">
      <PhaseProcurementPanel @select="onPhaseItemSelect" />
      <button
        v-if="phasePendingCount > 0"
        type="button"
        class="home-link-btn"
        @click="router.push(ROUTES.PROCUREMENT)"
      >
        查看全部采购 →
      </button>
      <div
        v-if="procurementWarningStats.overdue > 0"
        class="home-inline-alert home-inline-alert--danger"
        role="button"
        @click="goProcurementWarning(WARNING_STATUS.OVERDUE)"
      >
        <span class="alert-num">{{ procurementWarningStats.overdue }}</span>
        <span class="alert-text">项材料已逾期，请尽快下单</span>
      </div>
      <div
        v-else-if="procurementWarningStats.expiring > 0"
        class="home-inline-alert home-inline-alert--warning"
        role="button"
        @click="goProcurementWarning(WARNING_STATUS.EXPIRING)"
      >
        <span class="alert-num alert-num--warning">{{ procurementWarningStats.expiring }}</span>
        <span class="alert-text">项材料即将到期</span>
      </div>
    </section>

    <el-card class="card-block budget-hero" shadow="never" @click="router.push(ROUTES.BUDGET)">
      <div class="budget-hero-head">
        <span class="card-label">还能花多少</span>
        <span class="budget-hero-meta">
          整体规划 ¥ {{ formatMoney(budgetSummary.overallBudget) }}
        </span>
      </div>
      <div
        class="budget-hero-value num-hero"
        :class="{
          danger: budgetSummary.overallRemaining < 0,
          primary: budgetSummary.overallRemaining >= 0 && !budgetSummary.isOverOverallBudget,
        }"
      >
        ¥ {{ formatMoney(budgetSummary.overallRemaining) }}
      </div>
      <el-progress
        :percentage="overallPaidPercent"
        :stroke-width="10"
        :color="budgetProgressColor"
      />
      <p class="budget-hero-foot">
        已花 ¥ {{ formatMoney(budgetSummary.totalPaid) }} · 占整体 {{ overallPaidPercent }}%
      </p>
      <div v-if="budgetSummary.isOverOverallBudget" class="over-budget">
        {{ formatOverBudgetMessage(budgetSummary.totalPaid, budgetSummary.overallBudget) }}
      </div>
    </el-card>

    <el-card
      v-if="pendingTodoCount > 0"
      class="card-block todo-alert risk-card"
      shadow="never"
      @click="router.push(ROUTES.BUDGET)"
    >
      <div class="todo-alert-row">
        <span class="todo-alert-title">整改待办</span>
        <span class="todo-alert-count">{{ pendingTodoCount }} 项待处理</span>
      </div>
      <p class="todo-alert-desc">验收不合格项需跟进，点击查看</p>
    </el-card>

    <el-collapse v-model="moreExpanded" class="home-more">
      <el-collapse-item name="more">
        <template #title>
          <span class="home-more-title">更多概况</span>
          <span class="home-more-hint">验收 {{ progress.doneCount }}/{{ progress.totalCount }} · 进度 {{ progress.percent }}%</span>
        </template>

        <div class="more-stats">
          <button type="button" class="more-stat-chip" @click="router.push(ROUTES.PROCUREMENT)">
            <span class="chip-label">采购</span>
            <span class="chip-value">
              <span v-if="procurementWarningStats.overdue" class="danger">逾期 {{ procurementWarningStats.overdue }}</span>
              <span v-if="procurementWarningStats.expiring" class="warning"> 即将 {{ procurementWarningStats.expiring }}</span>
              <span v-if="!procurementWarningStats.overdue && !procurementWarningStats.expiring" class="success">
                正常 {{ procurementWarningStats.normal }}
              </span>
            </span>
          </button>
          <button type="button" class="more-stat-chip" @click="router.push(ROUTES.PROCESS)">
            <span class="chip-label">进度</span>
            <span class="chip-value primary">{{ progress.percent }}%</span>
          </button>
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-dialog v-model="cloudDialogVisible" title="云端共享" width="90%" style="max-width: 480px">
      <CloudSyncSection default-expanded />
    </el-dialog>

    <el-dialog v-model="houseDialogVisible" title="编辑项目信息" width="90%" style="max-width: 420px">
      <el-form label-width="96px">
        <el-form-item label="计划开工日" required>
          <el-date-picker
            v-model="houseForm.projectStartDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开工日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="房屋面积">
          <el-input v-model="houseForm.area" placeholder="请输入面积（㎡）" />
        </el-form-item>
        <el-form-item label="房屋地址">
          <el-input v-model="houseForm.address" placeholder="请输入房屋地址" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="装修总预算" required>
          <el-input-number
            v-model="houseForm.overallBudget"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="houseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHouse">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { ROUTES, OVERALL_BUDGET, COLORS, WARNING_STATUS, PROJECT_START_DATE } from '../constants'
import { formatMoney, formatOverBudgetMessage } from '../utils/format'
import { useAppStore } from '../composables/useAppStore'
import { getCurrentProcessInfo } from '../utils/calc'
import { buildPhaseProcurementGroups, countPhasePendingItems } from '../utils/phaseProcurement'
import { warningFilterToQuery } from '../utils/procurementWarning'
import PhaseProcurementPanel from '../components/PhaseProcurementPanel.vue'
import CloudSyncBadge from '../components/CloudSyncBadge.vue'
import CloudSyncSection from '../components/CloudSyncSection.vue'

const router = useRouter()
const {
  state,
  progress,
  budgetSummary,
  procurementWarningStats,
  pendingTodoCount,
  overallBudget,
  syncMeta,
  refreshWarningsIfNeeded,
  updateHouse,
} = useAppStore()

const houseDialogVisible = ref(false)
const cloudDialogVisible = ref(false)
const houseForm = reactive({
  area: '',
  address: '',
  overallBudget: OVERALL_BUDGET,
  projectStartDate: PROJECT_START_DATE,
})
const moreExpanded = ref([])

const currentProgress = computed(() => getCurrentProcessInfo(state.processes))

const phaseGroups = computed(() => buildPhaseProcurementGroups(state))
const phasePendingCount = computed(() => countPhasePendingItems(phaseGroups.value))

const overallPaidPercent = computed(() => {
  const total = budgetSummary.value.overallBudget || 1
  return Math.min(100, Math.round((budgetSummary.value.totalPaid / total) * 100))
})

const budgetProgressColor = computed(() =>
  budgetSummary.value.isOverOverallBudget ? COLORS.danger : COLORS.primary
)

const houseMeta = computed(() => {
  const parts = []
  if (state.house.area) parts.push(`${state.house.area} ㎡`)
  else parts.push('面积未填')
  parts.push(`开工 ${state.house.projectStartDate || PROJECT_START_DATE}`)
  parts.push(`总预算 ¥ ${formatMoney(overallBudget.value)}`)
  return parts.join(' · ')
})

const showCloudPrompt = computed(() => syncMeta.cloudReady && !syncMeta.projectId)

onMounted(() => {
  refreshWarningsIfNeeded()
})

function openHouseDialog() {
  houseForm.area = state.house.area
  houseForm.address = state.house.address
  houseForm.overallBudget = Number(state.house.overallBudget) || OVERALL_BUDGET
  houseForm.projectStartDate = state.house.projectStartDate || PROJECT_START_DATE
  houseDialogVisible.value = true
}

function submitHouse() {
  if (!houseForm.overallBudget || houseForm.overallBudget <= 0) {
    ElMessage.warning('请填写有效的装修总预算')
    return
  }
  if (!houseForm.projectStartDate) {
    ElMessage.warning('请选择计划开工日')
    return
  }
  updateHouse({
    area: houseForm.area.trim(),
    address: houseForm.address.trim(),
    overallBudget: Number(houseForm.overallBudget),
    projectStartDate: houseForm.projectStartDate,
  })
  houseDialogVisible.value = false
}

function onPhaseItemSelect(entry) {
  router.push({
    path: ROUTES.PROCUREMENT,
    query: { tab: entry.tab || 'material' },
  })
}

function goProcurementWarning(status) {
  const query = warningFilterToQuery(status)
  if (!query) return
  router.push({
    path: ROUTES.PROCUREMENT,
    query: { warning: query },
  })
}
</script>

<style scoped>
.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.home-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: var(--reno-text);
  line-height: 1.3;
}

.home-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--reno-text-muted);
}

.home-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.home-decision-strip {
  display: flex;
  align-items: stretch;
  width: 100%;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--reno-border-light);
  border-radius: 12px;
  background: var(--reno-surface);
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.2s;
}

.home-decision-strip:hover {
  box-shadow: var(--reno-shadow);
}

.decision-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.decision-label {
  font-size: 11px;
  color: var(--reno-text-muted);
}

.decision-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--reno-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.decision-value--primary {
  color: var(--reno-primary);
}

.decision-value--danger {
  color: var(--reno-danger);
}

.decision-value--alert {
  color: var(--reno-warning);
}

.decision-divider {
  width: 1px;
  margin: 0 10px;
  background: var(--reno-border-light);
  flex-shrink: 0;
}

.home-cloud-prompt {
  display: block;
  width: 100%;
  margin: -4px 0 12px;
  padding: 10px 12px;
  border: 1px dashed rgba(184, 115, 74, 0.35);
  border-radius: 10px;
  background: #faf6f2;
  color: var(--reno-primary);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}

.home-hero {
  margin-bottom: 12px;
}

.home-link-btn {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 8px 0;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--reno-primary);
  cursor: pointer;
  text-align: center;
}

.home-inline-alert {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.alert-num {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  color: var(--reno-danger);
  flex-shrink: 0;
}

.alert-num--warning {
  font-size: 28px;
  color: var(--reno-warning);
}

.alert-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.home-inline-alert--danger {
  color: var(--reno-danger);
  background: #faf0ee;
  border: 1px solid rgba(196, 86, 77, 0.25);
}

.home-inline-alert--warning {
  color: var(--reno-warning);
  background: #faf6ee;
  border: 1px solid rgba(201, 146, 58, 0.25);
}

.budget-hero {
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.budget-hero:hover {
  box-shadow: var(--reno-shadow-hover);
  transform: translateY(-1px);
}

.budget-hero-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.budget-hero-meta {
  font-size: 12px;
  color: var(--reno-text-muted);
}

.budget-hero-value {
  margin-bottom: 12px;
}

.budget-hero-value.primary {
  color: var(--reno-primary);
}

.budget-hero-value.danger {
  color: var(--reno-danger);
}

.budget-hero-foot {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--reno-text-muted);
}

.todo-alert {
  margin-bottom: 12px;
  cursor: pointer;
}

.todo-alert-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.todo-alert-title {
  font-weight: 600;
  color: var(--reno-text);
}

.todo-alert-count {
  font-size: 15px;
  font-weight: 700;
  color: var(--reno-danger);
}

.todo-alert-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--reno-text-muted);
}

.home-more {
  border: none;
  background: transparent;
}

.home-more :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--reno-border-light);
  background: var(--reno-surface);
  line-height: 1.4;
}

.home-more :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.home-more :deep(.el-collapse-item__content) {
  padding: 12px 0 0;
}

.home-more-title {
  font-weight: 600;
  color: var(--reno-text);
}

.home-more-hint {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--reno-text-muted);
}

.more-stats {
  display: flex;
  gap: 8px;
}

.more-stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--reno-border-light);
  border-radius: 10px;
  background: var(--reno-surface);
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.2s;
}

.more-stat-chip:hover {
  box-shadow: var(--reno-shadow);
}

.chip-label {
  font-size: 12px;
  color: var(--reno-text-muted);
}

.chip-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--reno-text);
}
</style>
