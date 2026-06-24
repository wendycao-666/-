<template>
  <div class="page material-page">
    <h2 class="page-title">主材采购台账</h2>

    <div class="stat-cards compact">
      <el-card class="card-block" shadow="never">
        <div class="card-label danger">逾期</div>
        <div class="card-value danger">{{ materialStats.overdue }}</div>
      </el-card>
      <el-card class="card-block" shadow="never">
        <div class="card-label warning">即将到期</div>
        <div class="card-value warning">{{ materialStats.expiring }}</div>
      </el-card>
      <el-card class="card-block" shadow="never">
        <div class="card-label success">正常</div>
        <div class="card-value success">{{ materialStats.normal }}</div>
      </el-card>
    </div>

    <el-card v-for="item in state.materials" :key="item.id" class="card-block material-card" shadow="never">
      <div class="material-head">
        <h3>{{ item.name }}</h3>
        <el-tag :type="warningTagType(item.warningStatus)" size="small">{{ item.warningStatus }}</el-tag>
      </div>
      <div class="material-meta">
        <span>归属工序：{{ item.processName }}</span>
        <span>提前 {{ item.advanceDays }} 天采购</span>
        <span>最晚下单：{{ item.latestOrderDate || '-' }}</span>
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
        <el-form-item label="采购成本">
          <el-input-number
            v-model="item.cost"
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
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { PURCHASE_STATUS, WARNING_STATUS } from '../constants'
import { useAppStore } from '../composables/useAppStore'

const { state, materialStats, refreshWarningsIfNeeded, updateMaterial } = useAppStore()

onMounted(() => {
  refreshWarningsIfNeeded()
})

function warningTagType(status) {
  if (status === WARNING_STATUS.OVERDUE) return 'danger'
  if (status === WARNING_STATUS.EXPIRING) return 'warning'
  return 'success'
}

function saveMaterial(item) {
  updateMaterial(item.id, {
    actualOrderDate: item.actualOrderDate || '',
    expectedArrivalDate: item.expectedArrivalDate || '',
    cost: item.cost || 0,
    purchaseStatus: item.purchaseStatus,
  })
}
</script>

<style scoped>
.compact {
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 12px;
}
.material-card {
  margin-bottom: 12px;
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
.material-form {
  margin-top: 8px;
}
</style>
