<template>
  <div class="procurement-section">
    <el-card
      v-for="item in items"
      :key="item.id"
      class="card-block procurement-card"
      shadow="never"
    >
      <div class="procurement-head">
        <h3>{{ item.name }}</h3>
        <el-tag size="small" type="info">{{ categoryLabel }}</el-tag>
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

      <el-form label-width="100px" class="procurement-form">
        <el-form-item label="实际下单">
          <el-date-picker
            v-model="item.actualOrderDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
            @change="emitSave(item)"
          />
        </el-form-item>
        <el-form-item label="预计到货">
          <el-date-picker
            v-model="item.expectedArrivalDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
            @change="emitSave(item)"
          />
        </el-form-item>
        <el-form-item label="预算单价">
          <el-input-number
            v-model="item.unitPrice"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="emitSave(item)"
          />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="item.quantity"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="emitSave(item)"
          />
        </el-form-item>
        <el-form-item label="预算金额">
          <span class="readonly-value">¥ {{ formatMoney(calcBudgetItemTotal(item.unitPrice, item.quantity)) }}</span>
        </el-form-item>
        <el-form-item label="实际费用">
          <el-input-number
            v-model="item.cost"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="emitSave(item)"
          />
        </el-form-item>
        <el-form-item label="已支付">
          <el-input-number
            v-model="item.paidAmount"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="emitSave(item)"
          />
        </el-form-item>
        <el-form-item label="采购状态">
          <el-select v-model="item.purchaseStatus" style="width: 100%" @change="emitSave(item)">
            <el-option label="待下单" :value="PURCHASE_STATUS.PENDING" />
            <el-option label="已下单" :value="PURCHASE_STATUS.ORDERED" />
            <el-option label="已到货" :value="PURCHASE_STATUS.ARRIVED" />
          </el-select>
        </el-form-item>
      </el-form>
      <p class="field-tip">{{ syncTip }}</p>
    </el-card>
  </div>
</template>

<script setup>
import { PURCHASE_STATUS } from '../constants'
import { calcBudgetItemTotal, calcBudgetItemVariance } from '../utils/calc'

defineProps({
  items: {
    type: Array,
    required: true,
  },
  categoryLabel: {
    type: String,
    required: true,
  },
  syncTip: {
    type: String,
    default: '填写实际费用后同步至预算页',
  },
})

const emit = defineEmits(['save'])

function emitSave(item) {
  emit('save', item)
}

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

function getItemVariance(item) {
  return calcBudgetItemVariance({
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    actualAmount: item.cost,
    paidAmount: item.paidAmount,
  })
}
</script>

<style scoped>
.procurement-card {
  margin-bottom: 12px;
}
.procurement-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.procurement-head h3 {
  margin: 0;
  font-size: 16px;
}
.budget-compare {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
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
.compare-value.danger {
  color: #F56C6C;
}
.compare-value.success {
  color: #67C23A;
}
.procurement-form {
  margin-top: 8px;
}
.readonly-value {
  font-weight: 600;
  color: #409EFF;
}
.field-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
@media (max-width: 640px) {
  .budget-compare {
    grid-template-columns: 1fr;
  }
}
</style>
