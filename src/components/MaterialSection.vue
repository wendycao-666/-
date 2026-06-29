<template>
  <div class="material-section">
    <div class="stat-cards compact">
      <el-card
        class="card-block stat-card-link"
        :class="{ active: activeStatus === WARNING_STATUS.OVERDUE }"
        shadow="never"
        @click="scrollToStatus(WARNING_STATUS.OVERDUE)"
      >
        <div class="card-label danger">逾期</div>
        <div class="card-value danger">{{ materialStats.overdue }}</div>
      </el-card>
      <el-card
        class="card-block stat-card-link"
        :class="{ active: activeStatus === WARNING_STATUS.EXPIRING }"
        shadow="never"
        @click="scrollToStatus(WARNING_STATUS.EXPIRING)"
      >
        <div class="card-label warning">即将到期</div>
        <div class="card-value warning">{{ materialStats.expiring }}</div>
      </el-card>
      <el-card
        class="card-block stat-card-link"
        :class="{ active: activeStatus === WARNING_STATUS.NORMAL }"
        shadow="never"
        @click="scrollToStatus(WARNING_STATUS.NORMAL)"
      >
        <div class="card-label success">正常</div>
        <div class="card-value success">{{ materialStats.normal }}</div>
      </el-card>
    </div>

    <el-card
      v-for="item in state.materials"
      :key="item.id"
      :id="`material-${item.id}`"
      class="card-block material-card"
      :class="{ 'material-highlight': highlightId === item.id }"
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
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { PURCHASE_STATUS, WARNING_STATUS } from '../constants'
import { calcBudgetItemTotal, calcBudgetItemVariance } from '../utils/calc'
import { useAppStore } from '../composables/useAppStore'

const { state, materialStats, refreshWarningsIfNeeded, updateMaterial } = useAppStore()

const activeStatus = ref('')
const highlightId = ref('')

onMounted(() => {
  refreshWarningsIfNeeded()
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

function getItemVariance(item) {
  return calcBudgetItemVariance({
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    actualAmount: item.cost,
    paidAmount: item.paidAmount,
  })
}

function scrollToStatus(status) {
  const target = state.materials.find((item) => item.warningStatus === status)
  if (!target) {
    ElMessage.info(`暂无「${status}」主材`)
    return
  }

  activeStatus.value = status
  highlightId.value = target.id

  nextTick(() => {
    document.getElementById(`material-${target.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })

  window.setTimeout(() => {
    highlightId.value = ''
  }, 1800)
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
  })
}
</script>

<style scoped>
.compact {
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 12px;
}
.stat-card-link {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card-link:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}
.stat-card-link.active {
  box-shadow: 0 0 0 2px #409EFF inset;
}
.material-card {
  margin-bottom: 12px;
  scroll-margin-top: 88px;
  transition: box-shadow 0.3s;
}
.material-highlight {
  box-shadow: 0 0 0 2px #409EFF;
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
  color: #409EFF;
}
.field-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
@media (max-width: 640px) {
  .compact {
    grid-template-columns: 1fr;
  }
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
