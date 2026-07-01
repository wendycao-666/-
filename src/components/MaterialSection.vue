<template>
  <div class="material-section">
    <el-card
      v-for="item in visibleMaterials"
      :key="item.id"
      :id="`material-${item.id}`"
      class="card-block material-card"
      :class="{ 'material-highlight': props.highlightId === item.id }"
      shadow="never"
    >
      <div class="material-head">
        <h3>{{ item.name }}</h3>
        <el-tag :type="warningTagType(item.warningStatus)" size="small">{{ item.warningStatus }}</el-tag>
      </div>
      <div class="material-meta">
        <span>归属工序：{{ item.processName }}</span>
        <span>提前 {{ item.advanceDays }} 天采购</span>
        <span>最晚下单：{{ item.latestOrderDate || '-' }}</span>
      </div>

      <div v-if="item.note" class="material-note">
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

      <el-form label-width="100px" class="material-form">
        <el-form-item label="注意事项">
          <el-input
            v-model="item.note"
            type="textarea"
            :rows="2"
            placeholder="填写采购注意事项"
            @change="saveMaterial(item)"
          />
        </el-form-item>
        <el-form-item label="实际下单">
          <el-date-picker
            v-model="item.actualOrderDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
            @change="saveMaterial(item)"
          />
        </el-form-item>
        <el-form-item label="预计到货">
          <el-date-picker
            v-model="item.expectedArrivalDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
            @change="saveMaterial(item)"
          />
        </el-form-item>
        <el-form-item label="预算单价">
          <el-input-number
            v-model="item.unitPrice"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="saveMaterial(item)"
          />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="item.quantity"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="saveMaterial(item)"
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
            @change="saveMaterial(item)"
          />
        </el-form-item>
        <el-form-item label="已支付">
          <el-input-number
            v-model="item.paidAmount"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            @change="saveMaterial(item)"
          />
        </el-form-item>
        <el-form-item label="采购状态">
          <el-select v-model="item.purchaseStatus" style="width: 100%" @change="saveMaterial(item)">
            <el-option label="待下单" :value="PURCHASE_STATUS.PENDING" />
            <el-option label="已下单" :value="PURCHASE_STATUS.ORDERED" />
            <el-option label="已到货" :value="PURCHASE_STATUS.ARRIVED" />
          </el-select>
        </el-form-item>
      </el-form>
      <p class="field-tip">填写实际费用后同步至「预算 · 主材」</p>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PURCHASE_STATUS, WARNING_STATUS } from '../constants'
import { calcBudgetItemTotal, calcBudgetItemVariance } from '../utils/calc'
import { formatMoney, formatVariance } from '../utils/format'
import { useAppStore } from '../composables/useAppStore'

const props = defineProps({
  nameOrder: {
    type: Array,
    default: null,
  },
  highlightId: {
    type: String,
    default: '',
  },
})

const { state, updateMaterial } = useAppStore()

const visibleMaterials = computed(() => {
  if (!props.nameOrder?.length) return state.materials
  return props.nameOrder
    .map((name) => state.materials.find((item) => item.name === name))
    .filter(Boolean)
})

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

function saveMaterial(item) {
  updateMaterial(item.id, {
    actualOrderDate: item.actualOrderDate || '',
    expectedArrivalDate: item.expectedArrivalDate || '',
    unitPrice: Number(item.unitPrice || 0),
    quantity: Number(item.quantity || 1) || 1,
    cost: Number(item.cost || 0),
    paidAmount: Number(item.paidAmount || 0),
    purchaseStatus: item.purchaseStatus,
    note: item.note || '',
  })
}
</script>

<style scoped>
.material-card {
  margin-bottom: 12px;
  scroll-margin-top: 120px;
  transition: box-shadow 0.3s;
}
.material-highlight {
  box-shadow: 0 0 0 2px var(--reno-primary);
}
.material-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.material-head h3 {
  margin: 0;
  font-size: 16px;
}
.material-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.material-note {
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
.material-form {
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
  .material-head {
    flex-wrap: wrap;
    gap: 6px;
  }
  .material-meta {
    flex-direction: column;
    gap: 4px;
  }
  .budget-compare {
    grid-template-columns: 1fr;
  }
}
</style>
