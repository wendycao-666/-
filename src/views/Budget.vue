<template>
  <div class="page mine-page">
    <h2 class="page-title">我的</h2>

    <section class="mine-section">
      <div class="section-header">
        <h3 class="section-title">重要事项</h3>
        <el-tag v-if="pendingTodoCount" type="danger" size="small">待处理 {{ pendingTodoCount }}</el-tag>
      </div>
      <ImportantMattersSection />
    </section>

    <section class="mine-section">
      <div class="page-header budget-section-header">
      <h3 class="section-title">预算管理</h3>
      <el-button type="primary" round @click="openDialog()">新增预算</el-button>
    </div>

    <el-card class="card-block summary-card" shadow="never">
      <div class="summary-grid">
        <div>
          <div class="card-label">总预算</div>
          <div class="card-value primary">¥ {{ formatMoney(visibleBudgetSummary.totalBudget) }}</div>
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
          <div class="card-label">已支付</div>
          <div class="card-value">¥ {{ formatMoney(visibleBudgetSummary.totalPaid) }}</div>
        </div>
      </div>
      <div v-if="visibleBudgetSummary.isOverBudget" class="over-budget">已支付超预算</div>
    </el-card>

    <el-card v-if="visibleBudgets.length" class="card-block chart-card" shadow="never">
      <div class="chart-title">分类预算占比</div>
      <BudgetPieChart :segments="categoryChartData" />
    </el-card>

    <EmptyState v-if="!visibleBudgets.length" />

    <div v-if="visibleBudgets.length" class="budget-detail-block">
      <div class="budget-detail-entry" @click="budgetDetailExpanded = !budgetDetailExpanded">
        <div class="detail-entry-left">
          <span class="detail-entry-label">预算明细</span>
          <span class="detail-entry-count">{{ visibleBudgets.length }} 项</span>
        </div>
        <el-icon class="detail-entry-arrow" :class="{ expanded: budgetDetailExpanded }">
          <ArrowRight />
        </el-icon>
      </div>

      <div v-show="budgetDetailExpanded" class="budget-detail-list">
        <el-card v-for="item in visibleBudgets" :key="item.id" class="card-block budget-card" shadow="never">
          <div class="budget-head">
            <div>
              <h3>{{ item.name }}</h3>
              <el-tag size="small" type="info">{{ item.category }}</el-tag>
              <el-tag v-if="getProcurementBudgetSource(item)" size="small" type="success" class="sync-tag">
                {{ getProcurementSyncLabel(item) }}
              </el-tag>
            </div>
            <div class="budget-actions">
              <el-button type="primary" link @click="openDialog(item)">编辑</el-button>
              <el-button v-if="!getProcurementBudgetSource(item)" type="danger" link @click="remove(item.id)">删除</el-button>
            </div>
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
      </div>
    </div>

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
import { ArrowRight } from '@element-plus/icons-vue'
import { BUDGET_CATEGORIES, MANUAL_BUDGET_CATEGORIES, COLORS } from '../constants'
import { calcBudgetItemTotal, calcBudgetCategoryStats, calcBudgetItemVariance, calcBudgetSummary, isBudgetItemVisible } from '../utils/calc'
import { getProcurementBudgetSource } from '../utils/materialBudgetSync'
import { useAppStore } from '../composables/useAppStore'
import ImportantMattersSection from '../components/ImportantMattersSection.vue'
import EmptyState from '../components/EmptyState.vue'
import BudgetPieChart from '../components/BudgetPieChart.vue'

const CATEGORY_COLORS = {
  设计: '#9254DE',
  人工: COLORS.primary,
  主材: COLORS.success,
  辅材: COLORS.warning,
  软装: '#13C2C2',
  家电: '#2F54EB',
  杂项: COLORS.info,
}

const { state, pendingTodoCount, addBudget, updateBudget, deleteBudget } = useAppStore()

const visibleBudgets = computed(() => state.budgets.filter(isBudgetItemVisible))

const visibleBudgetSummary = computed(() => calcBudgetSummary(visibleBudgets.value))

const categoryChartData = computed(() =>
  calcBudgetCategoryStats(visibleBudgets.value, BUDGET_CATEGORIES).map((item) => {
    const total = visibleBudgetSummary.value.totalBudget || 1
    return {
      key: item.category,
      name: item.category,
      value: item.amount,
      color: CATEGORY_COLORS[item.category] || COLORS.primary,
      percent: ((item.amount / total) * 100).toFixed(1),
    }
  })
)

const dialogVisible = ref(false)
const editingId = ref('')
const budgetDetailExpanded = ref(false)
const form = reactive({
  category: '',
  name: '',
  unitPrice: 0,
  quantity: 1,
  actualAmount: 0,
  paidAmount: 0,
  procurementLinked: false,
  procurementPage: '',
})

function formatMoney(val) {
  return Number(val || 0).toFixed(2)
}

function formatVariance(val) {
  const num = Number(val || 0)
  if (num === 0) return '¥ 0.00'
  const prefix = num > 0 ? '+' : '-'
  return `${prefix}¥ ${Math.abs(num).toFixed(2)}`
}

function varianceClass(val) {
  const num = Number(val || 0)
  if (num < 0) return 'danger'
  if (num > 0) return 'success'
  return ''
}

function varianceHint(val) {
  const num = Number(val || 0)
  if (num > 0) return '预算未支完'
  if (num < 0) return '已支付超预算'
  return '已按预算支完'
}

function getItemVariance(item) {
  return calcBudgetItemVariance(item)
}

function getProcurementSyncLabel(item) {
  const source = getProcurementBudgetSource(item)
  if (!source) return ''
  if (source.page === '主材') return '主材台账同步'
  return `${source.category}台账同步`
}

function openDialog(item) {
  if (item) {
    const source = getProcurementBudgetSource(item)
    editingId.value = item.id
    form.category = item.category
    form.name = item.name
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
.chart-card {
  margin-bottom: 12px;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
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
.budget-detail-block {
  margin-top: 4px;
}
.budget-detail-list {
  margin-top: 10px;
}
.budget-detail-list .budget-card {
  margin-bottom: 12px;
}
.budget-detail-list .budget-card:last-child {
  margin-bottom: 0;
}
.budget-detail-list .budget-detail-panel {
  margin-top: 8px;
  padding: 4px 12px 8px;
  border-left: 2px solid #ecf5ff;
  margin-left: 4px;
}
.budget-detail-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s, border-color 0.2s;
}
.budget-detail-entry:hover {
  background: #f5f9ff;
  border-color: #c6e2ff;
}
.detail-entry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-entry-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.detail-entry-count {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 10px;
}
.detail-entry-arrow {
  font-size: 16px;
  color: #909399;
  transition: transform 0.2s;
}
.detail-entry-arrow.expanded {
  transform: rotate(90deg);
  color: #409EFF;
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
  .summary-grid {
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
  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
