<template>
  <div class="procurement-section">
    <el-card
      v-for="item in items"
      :key="item.id"
      :id="`procurement-${item.id}`"
      class="card-block procurement-card"
      :class="{ 'procurement-highlight': highlightId === item.id }"
      shadow="never"
    >
      <div class="procurement-head">
        <h3>{{ item.name }}</h3>
        <div class="procurement-tags">
          <el-tag v-if="item.warningStatus" :type="warningTagType(item.warningStatus)" size="small">
            {{ item.warningStatus }}
          </el-tag>
          <el-tag size="small" type="info">{{ categoryLabel }}</el-tag>
        </div>
      </div>

      <div v-if="item.processName" class="procurement-meta">
        <span>归属工序：{{ item.processName }}</span>
        <span>提前 {{ item.advanceDays }} 天采购</span>
        <span>最晚下单：{{ item.latestOrderDate || '-' }}</span>
      </div>

      <div v-if="item.note" class="procurement-note">
        <span class="note-label">注意事项</span>
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

      <el-form label-width="100px" class="procurement-form">
        <el-form-item label="注意事项">
          <el-input
            v-model="item.note"
            type="textarea"
            :rows="2"
            placeholder="填写采购注意事项"
            @change="emitSave(item)"
          />
        </el-form-item>
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
import { PURCHASE_STATUS, WARNING_STATUS } from '../constants'
import { calcBudgetItemTotal, calcBudgetItemVariance } from '../utils/calc'
import { formatMoney, formatVariance } from '../utils/format'

defineProps({
  items: {
    type: Array,
    required: true,
  },
  categoryLabel: {
    type: String,
    required: true,
  },
  highlightId: {
    type: String,
    default: '',
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

function warningTagType(status) {
  if (status === WARNING_STATUS.OVERDUE) return 'danger'
  if (status === WARNING_STATUS.EXPIRING) return 'warning'
  return 'success'
}
</script>

<style scoped>
.procurement-card {
  margin-bottom: 12px;
  scroll-margin-top: 120px;
  transition: box-shadow 0.3s;
}
.procurement-highlight {
  box-shadow: 0 0 0 2px var(--reno-primary);
}
.procurement-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.procurement-head h3 {
  margin: 0;
  font-size: 16px;
}
.procurement-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.procurement-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.procurement-note {
  margin-bottom: 10px;
  padding: 10px 12px;
  background: #fdf6ec;
  border-left: 3px solid #E6A23C;
  border-radius: 0 6px 6px 0;
}
.note-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #E6A23C;
  margin-bottom: 4px;
}
.note-text {
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
  color: var(--reno-primary);
}
.field-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
@media (max-width: 640px) {
  .procurement-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .procurement-tags {
    justify-content: flex-start;
  }
  .procurement-meta {
    flex-direction: column;
    gap: 4px;
  }
  .budget-compare {
    grid-template-columns: 1fr;
  }
}
</style>
