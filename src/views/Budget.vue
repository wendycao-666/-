<template>
  <div class="page budget-page">
    <div class="page-header">
      <h2 class="page-title">预算管理</h2>
      <el-button type="primary" round @click="openDialog()">新增预算</el-button>
    </div>

    <el-card class="card-block summary-card" shadow="never">
      <div class="summary-grid">
        <div>
          <div class="card-label">总预算</div>
          <div class="card-value">¥ {{ formatMoney(budgetSummary.totalBudget) }}</div>
        </div>
        <div>
          <div class="card-label">已支付</div>
          <div class="card-value">¥ {{ formatMoney(budgetSummary.totalPaid) }}</div>
        </div>
        <div>
          <div class="card-label">未支付</div>
          <div class="card-value">¥ {{ formatMoney(budgetSummary.unpaid) }}</div>
        </div>
      </div>
      <div v-if="budgetSummary.isOverBudget" class="over-budget">已超支</div>
    </el-card>

    <EmptyState v-if="!state.budgets.length" />
    <el-card v-for="item in state.budgets" :key="item.id" class="card-block budget-card" shadow="never">
      <div class="budget-head">
        <div>
          <h3>{{ item.name }}</h3>
          <el-tag size="small" type="info">{{ item.category }}</el-tag>
        </div>
        <div class="budget-actions">
          <el-button type="primary" link @click="openDialog(item)">编辑</el-button>
          <el-button type="danger" link @click="remove(item.id)">删除</el-button>
        </div>
      </div>
      <div class="budget-meta">
        <span>单价：¥ {{ formatMoney(item.unitPrice) }}</span>
        <span>数量：{{ item.quantity }}</span>
        <span>单项预算：¥ {{ formatMoney(calcItemTotal(item)) }}</span>
        <span>已支付：¥ {{ formatMoney(item.paidAmount) }}</span>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑预算' : '新增预算'"
      width="90%"
      style="max-width: 420px"
    >
      <el-form label-width="90px">
        <el-form-item label="分类" required>
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in BUDGET_CATEGORIES" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目名称" required>
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="单价" required>
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
        <el-form-item label="单项预算">
          <span class="readonly-value">¥ {{ formatMoney(calcBudgetItemTotal(form.unitPrice, form.quantity)) }}</span>
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { BUDGET_CATEGORIES } from '../constants'
import { calcBudgetItemTotal } from '../utils/calc'
import { useAppStore } from '../composables/useAppStore'
import EmptyState from '../components/EmptyState.vue'

const { state, budgetSummary, addBudget, updateBudget, deleteBudget } = useAppStore()

const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({
  category: '',
  name: '',
  unitPrice: 0,
  quantity: 1,
  paidAmount: 0,
})

function formatMoney(val) {
  return Number(val || 0).toFixed(2)
}

function calcItemTotal(item) {
  return calcBudgetItemTotal(item.unitPrice, item.quantity)
}

function openDialog(item) {
  if (item) {
    editingId.value = item.id
    form.category = item.category
    form.name = item.name
    form.unitPrice = item.unitPrice
    form.quantity = item.quantity
    form.paidAmount = item.paidAmount
  } else {
    editingId.value = ''
    form.category = BUDGET_CATEGORIES[0]
    form.name = ''
    form.unitPrice = 0
    form.quantity = 1
    form.paidAmount = 0
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
  ElMessageBox.confirm('确定删除该预算条目吗？', '提示', { type: 'warning' })
    .then(() => {
      deleteBudget(id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<style scoped>
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
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
.budget-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #606266;
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
    grid-template-columns: 1fr;
  }
}
</style>
