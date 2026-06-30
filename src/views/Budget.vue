<template>
  <div class="page mine-page">

    <section class="mine-section">
      <div class="section-header">
        <h3 class="section-title">重要事项</h3>
        <el-tag v-if="pendingTodoCount" type="danger" size="small">待处理 {{ pendingTodoCount }}</el-tag>
      </div>
      <ImportantMattersSection />
    </section>

    <section class="mine-section">
      <h3 class="section-title">整体预算</h3>
      <el-card class="card-block overall-budget-card" shadow="never">
        <div class="overall-budget-grid">
          <div class="overall-budget-main">
            <div class="card-label">装修总预算</div>
            <div class="card-value primary">¥ {{ formatMoney(visibleBudgetSummary.overallBudget) }}</div>
            <div class="card-sub">上限 18 万</div>
          </div>
          <div>
            <div class="card-label">已支付</div>
            <div class="card-value">¥ {{ formatMoney(visibleBudgetSummary.totalPaid) }}</div>
            <div class="card-sub">占整体 {{ overallPaidPercent }}%</div>
          </div>
          <div>
            <div class="card-label">剩余预算</div>
            <div class="card-value" :class="overallRemainingClass(visibleBudgetSummary.overallRemaining)">
              ¥ {{ formatMoney(visibleBudgetSummary.overallRemaining) }}
            </div>
            <div class="card-sub">总预算 − 已支付</div>
          </div>
        </div>
        <el-progress
          :percentage="overallPaidPercent"
          :stroke-width="12"
          :color="visibleBudgetSummary.isOverOverallBudget ? '#F56C6C' : '#409EFF'"
        />
        <div v-if="visibleBudgetSummary.isOverOverallBudget" class="over-budget">已支付超过整体预算</div>
      </el-card>
    </section>

    <section class="mine-section">
      <div class="section-header">
        <h3 class="section-title">预算明细</h3>
        <el-button type="primary" round @click="openDialog()">新增预算</el-button>
      </div>

      <el-card class="card-block detail-summary-card" shadow="never">
        <div class="detail-summary-grid">
          <div>
            <div class="card-label">明细总预算</div>
            <div class="card-value">¥ {{ formatMoney(visibleBudgetSummary.totalBudget) }}</div>
          </div>
          <div>
            <div class="card-label">实际费用</div>
            <div class="card-value">¥ {{ formatMoney(visibleBudgetSummary.totalActual) }}</div>
          </div>
          <div>
            <div class="card-label">预算差额</div>
            <div class="card-value" :class="varianceClass(visibleBudgetSummary.variance)">
              {{ formatVariance(visibleBudgetSummary.variance) }}
            </div>
            <div class="card-sub">{{ varianceHint(visibleBudgetSummary.variance) }}</div>
          </div>
          <div>
            <div class="card-label">明细已支付</div>
            <div class="card-value">¥ {{ formatMoney(visibleBudgetSummary.totalPaid) }}</div>
          </div>
        </div>
        <div v-if="visibleBudgetSummary.isOverBudget && !visibleBudgetSummary.isOverOverallBudget" class="over-budget">
          已支付超过明细总预算
        </div>
      </el-card>

      <el-card v-if="visibleBudgets.length" class="card-block chart-card" shadow="never">
        <div class="chart-title">分类支出占比</div>
        <p class="chart-desc">按已支付 / 实际费用统计</p>
        <BudgetPieChart :segments="categoryChartData" />
      </el-card>

      <EmptyState v-if="!visibleBudgets.length" />

      <div v-if="visibleBudgets.length" class="budget-detail-list">
        <section
          v-for="group in budgetDetailGroups"
          :key="group.category"
          class="budget-category-group"
        >
          <div class="budget-category-head">
            <span class="category-dot" :style="{ background: getCategoryColor(group.category) }" />
            <div class="category-head-main">
              <h4 class="category-title">{{ group.category }}</h4>
              <span class="category-meta">
                {{ group.count }} 项 · 预算 ¥ {{ formatMoney(group.budgetTotal) }} · 已支付 ¥ {{ formatMoney(group.paidTotal) }}
              </span>
            </div>
          </div>
          <el-card
            v-for="item in group.items"
            :key="item.id"
            class="card-block budget-card"
            shadow="never"
          >
            <div class="budget-head">
              <div>
                <h3>{{ item.name }}</h3>
                <el-tag v-if="getProcurementBudgetSource(item)" size="small" type="success" class="sync-tag">
                  {{ getProcurementSyncLabel(item) }}
                </el-tag>
              </div>
              <div class="budget-actions">
                <el-button type="primary" link @click="openDialog(item)">编辑</el-button>
                <el-button v-if="!getProcurementBudgetSource(item)" type="danger" link @click="remove(item.id)">删除</el-button>
              </div>
            </div>
            <div v-if="item.note" class="budget-note">
              <span class="note-label">备注</span>
              <p class="note-text">{{ item.note }}</p>
            </div>
            <div class="budget-compare">
              <div class="compare-item">
                <span class="compare-label">预算</span>
                <span class="compare-value">¥ {{ formatMoney(getItemVariance(item).budget) }}</span>
              </div>
              <div class="compare-item">
                <span class="compare-label">已支付</span>
                <span class="compare-value">¥ {{ formatMoney(getItemVariance(item).paid) }}</span>
              </div>
              <div class="compare-item">
                <span class="compare-label">差额</span>
                <span class="compare-value" :class="varianceClass(getItemVariance(item).variance)">
                  {{ formatVariance(getItemVariance(item).variance) }}
                </span>
              </div>
            </div>
            <div class="budget-detail-panel">
              <div class="detail-row">
                <span class="detail-label">单价</span>
                <span class="detail-value">¥ {{ formatMoney(item.unitPrice) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">数量</span>
                <span class="detail-value">{{ item.quantity }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">预算金额</span>
                <span class="detail-value">¥ {{ formatMoney(getItemVariance(item).budget) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">实际费用</span>
                <span class="detail-value">¥ {{ formatMoney(item.actualAmount) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">已支付</span>
                <span class="detail-value">¥ {{ formatMoney(item.paidAmount) }}</span>
              </div>
            </div>
          </el-card>
        </section>
      </div>

    </section>

    <section class="mine-section">
      <CloudSyncSection />
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑预算' : '新增预算'"
      width="90%"
      style="max-width: 420px"
    >
      <el-form label-width="90px">
        <el-form-item label="分类" required>
          <el-select
            v-model="form.category"
            placeholder="请选择分类"
            style="width: 100%"
            :disabled="form.procurementLinked"
          >
            <el-option v-for="cat in MANUAL_BUDGET_CATEGORIES" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目名称" required>
          <el-input v-model="form.name" placeholder="请输入项目名称" :disabled="form.procurementLinked" />
        </el-form-item>
        <el-form-item v-if="!form.procurementLinked" label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="填写备注或注意事项"
          />
        </el-form-item>
        <el-form-item label="预算单价" required>
          <el-input-number
            v-model="form.unitPrice"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input-number
            v-model="form.quantity"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预算金额">
          <span class="readonly-value">¥ {{ formatMoney(calcBudgetItemTotal(form.unitPrice, form.quantity)) }}</span>
        </el-form-item>
        <el-form-item label="实际费用">
          <el-input-number
            v-if="!form.procurementLinked"
            v-model="form.actualAmount"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
          <span v-else class="readonly-value">¥ {{ formatMoney(form.actualAmount) }}（来自{{ form.procurementPage }}采购成本）</span>
        </el-form-item>
        <el-form-item label="已支付">
          <el-input-number
            v-model="form.paidAmount"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { BUDGET_CATEGORIES, MANUAL_BUDGET_CATEGORIES, COLORS } from '../constants'
import { calcBudgetItemTotal, calcBudgetCategoryActualStats, calcBudgetItemVariance, calcBudgetSummary, isBudgetItemVisible } from '../utils/calc'
import { formatMoney, formatVariance } from '../utils/format'
import { getProcurementBudgetSource, getProcurementSyncLabel } from '../utils/materialBudgetSync'
import { useAppStore } from '../composables/useAppStore'
import ImportantMattersSection from '../components/ImportantMattersSection.vue'
import CloudSyncSection from '../components/CloudSyncSection.vue'
import EmptyState from '../components/EmptyState.vue'
import BudgetPieChart from '../components/BudgetPieChart.vue'

const CATEGORY_COLORS = {
  设计: '#9254DE',
  人工: COLORS.primary,
  主材: COLORS.success,
  基装: '#409EFF',
  定制: '#9C27B0',
  卫浴洁具: '#00BCD4',
  厨电: '#E6A23C',
  辅材: COLORS.warning,
  软装: '#13C2C2',
  家电: '#2F54EB',
  杂项: COLORS.info,
}

const { state, pendingTodoCount, addBudget, updateBudget, deleteBudget } = useAppStore()

const visibleBudgets = computed(() => state.budgets.filter(isBudgetItemVisible))

const visibleBudgetSummary = computed(() => calcBudgetSummary(visibleBudgets.value))

const overallPaidPercent = computed(() => {
  const total = visibleBudgetSummary.value.overallBudget || 1
  return Math.min(100, Math.round((visibleBudgetSummary.value.totalPaid / total) * 100))
})

const categoryChartData = computed(() => {
  const stats = calcBudgetCategoryActualStats(visibleBudgets.value, BUDGET_CATEGORIES)
  const total = stats.reduce((sum, item) => sum + item.amount, 0) || 1
  return stats.map((item) => ({
    key: item.category,
    name: item.category,
    value: item.amount,
    color: CATEGORY_COLORS[item.category] || COLORS.primary,
    percent: ((item.amount / total) * 100).toFixed(1),
  }))
})

const budgetDetailGroups = computed(() =>
  BUDGET_CATEGORIES.map((category) => {
    const items = visibleBudgets.value.filter((item) => item.category === category)
    if (!items.length) return null
    const budgetTotal = items.reduce(
      (sum, item) => sum + calcBudgetItemTotal(item.unitPrice, item.quantity),
      0
    )
    const paidTotal = items.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
    return {
      category,
      items,
      count: items.length,
      budgetTotal,
      paidTotal,
    }
  }).filter(Boolean)
)

const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({
  category: '',
  name: '',
  note: '',
  unitPrice: 0,
  quantity: 1,
  actualAmount: 0,
  paidAmount: 0,
  procurementLinked: false,
  procurementPage: '',
})

function varianceClass(val) {
  const num = Number(val || 0)
  if (num < 0) return 'danger'
  if (num > 0) return 'success'
  return ''
}

function varianceHint(val) {
  const num = Number(val || 0)
  if (num > 0) return '预算未支完'
  if (num < 0) return '已支付超明细预算'
  return '已按预算支完'
}

function overallRemainingClass(val) {
  const num = Number(val || 0)
  if (num < 0) return 'danger'
  if (num > 0) return 'success'
  return ''
}

function getItemVariance(item) {
  return calcBudgetItemVariance(item)
}

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || COLORS.primary
}

function openDialog(item) {
  if (item) {
    const source = getProcurementBudgetSource(item)
    editingId.value = item.id
    form.category = item.category
    form.name = item.name
    form.note = item.note || ''
    form.unitPrice = item.unitPrice
    form.quantity = item.quantity
    form.actualAmount = item.actualAmount ?? 0
    form.paidAmount = item.paidAmount
    form.procurementLinked = Boolean(source)
    form.procurementPage = source?.page || ''
  } else {
    editingId.value = ''
    form.category = '人工'
    form.name = ''
    form.note = ''
    form.unitPrice = 0
    form.quantity = 1
    form.actualAmount = 0
    form.paidAmount = 0
    form.procurementLinked = false
    form.procurementPage = ''
  }
  dialogVisible.value = true
}

function validateForm() {
  if (!form.category || !form.name.trim()) {
    ElMessage.warning('请完善必填信息')
    return false
  }
  if (form.unitPrice === null || form.unitPrice === undefined || form.unitPrice < 0) {
    ElMessage.warning('请完善必填信息')
    return false
  }
  if (form.quantity === null || form.quantity === undefined || form.quantity <= 0) {
    ElMessage.warning('请完善必填信息')
    return false
  }
  if (form.actualAmount === null || form.actualAmount === undefined || form.actualAmount < 0) {
    ElMessage.warning('请完善必填信息')
    return false
  }
  if (form.paidAmount === null || form.paidAmount === undefined || form.paidAmount < 0) {
    ElMessage.warning('请完善必填信息')
    return false
  }
  return true
}

function submit() {
  if (!validateForm()) return
  const payload = {
    category: form.category,
    name: form.name.trim(),
    note: form.note || '',
    unitPrice: Number(form.unitPrice),
    quantity: Number(form.quantity),
    actualAmount: Number(form.actualAmount),
    paidAmount: Number(form.paidAmount),
  }
  if (editingId.value) {
    updateBudget(editingId.value, payload)
  } else {
    addBudget(payload)
  }
  dialogVisible.value = false
}

function remove(id) {
  const item = state.budgets.find((b) => b.id === id)
  const source = item ? getProcurementBudgetSource(item) : null
  if (source) {
    ElMessage.warning(`${source.category}同步项请在「${source.page}」页维护，不可删除`)
    return
  }
  ElMessageBox.confirm('确定删除该预算条目吗？', '提示', { type: 'warning' })
    .then(() => {
      deleteBudget(id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<style scoped>
.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.mine-section {
  margin-bottom: 20px;
}
.mine-section:last-child {
  margin-bottom: 0;
}
.budget-section-header {
  margin-bottom: 12px;
}
.overall-budget-card {
  margin-bottom: 0;
}
.overall-budget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.overall-budget-main .card-value {
  font-size: 26px;
}
.detail-summary-card {
  margin-bottom: 12px;
}
.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.page-header .page-title {
  margin: 0;
}
.summary-card {
  margin-bottom: 12px;
}
.over-budget {
  margin-top: 10px;
  font-size: 13px;
  color: #F56C6C;
}
.chart-card {
  margin-bottom: 12px;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.chart-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
}
.budget-card {
  margin-bottom: 12px;
}
.budget-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.budget-head h3 {
  margin: 0 0 6px;
  font-size: 16px;
}
.sync-tag {
  margin-left: 6px;
}
.budget-note {
  margin-bottom: 10px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-left: 3px solid #909399;
  border-radius: 0 6px 6px 0;
}
.budget-note .note-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  margin-bottom: 4px;
}
.budget-note .note-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
}
.budget-compare {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}
.compare-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.compare-label {
  font-size: 12px;
  color: #909399;
}
.compare-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.compare-value.danger,
.card-value.danger {
  color: #F56C6C;
}
.compare-value.success,
.card-value.success {
  color: #67C23A;
}
.card-value.primary {
  color: #409EFF;
}
.budget-detail-list {
  margin-top: 12px;
}
.budget-category-group {
  margin-bottom: 16px;
}
.budget-category-group:last-child {
  margin-bottom: 0;
}
.budget-category-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  padding: 0 2px;
}
.category-dot {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 2px;
}
.category-head-main {
  flex: 1;
  min-width: 0;
}
.category-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.category-meta {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
.budget-detail-list .budget-card {
  margin-bottom: 10px;
}
.budget-detail-list .budget-category-group .budget-card:last-child {
  margin-bottom: 0;
}
.budget-detail-list .budget-detail-panel {
  margin-top: 8px;
  padding: 4px 12px 8px;
  border-left: 2px solid #ecf5ff;
  margin-left: 4px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #f2f6fc;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  color: #909399;
}
.detail-value {
  font-weight: 600;
  color: #303133;
}
.budget-actions {
  display: flex;
  gap: 4px;
}
.readonly-value {
  font-weight: 600;
  color: #409EFF;
}
@media (max-width: 640px) {
  .overall-budget-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .detail-summary-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .budget-head {
    flex-direction: column;
    gap: 8px;
  }
  .budget-actions {
    align-self: flex-end;
  }
  .budget-compare {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 640px) {
  .detail-summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
