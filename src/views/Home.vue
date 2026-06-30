<template>
  <div class="page home">
    <el-card class="card-block house-card" shadow="never">
      <div class="house-info">
        <div class="house-main">
          <p class="house-name">{{ state.house.address || '未填写房屋地址' }}</p>
          <p class="house-area">面积：{{ state.house.area ? `${state.house.area} ㎡` : '未填写' }}</p>
          <p class="house-budget">装修总预算：¥ {{ formatMoney(overallBudget) }}</p>
        </div>
        <el-button type="primary" round @click="openHouseDialog">编辑项目信息</el-button>
      </div>
    </el-card>

    <el-card class="card-block current-progress-card" shadow="never" @click="router.push(ROUTES.PROCESS)">
      <div class="current-progress-head">
        <span class="card-label">当前进度</span>
        <el-tag :type="currentProgress.tagType" size="small">{{ currentProgress.phaseLabel }}</el-tag>
      </div>
      <div class="current-process-name">{{ currentProgress.processName }}</div>
      <p v-if="currentProgress.dateRange" class="current-process-meta">
        {{ currentProgress.dateRange }} · {{ currentProgress.days }} 天
      </p>
      <el-progress :percentage="progress.percent" :stroke-width="10" />
      <p class="current-progress-foot">
        整体验收 {{ progress.doneCount }} / {{ progress.totalCount }} 道工序 · {{ progress.percent }}%
      </p>
      <p class="current-progress-hint">{{ currentProgress.hint }}</p>
    </el-card>

    <div class="stat-cards">
      <el-card
        class="card-block stat-card-link"
        shadow="never"
        @click="router.push(ROUTES.PROCESS)"
      >
        <div class="card-label">整体进度</div>
        <div class="card-value primary">{{ progress.percent }}%</div>
        <el-progress :percentage="progress.percent" :stroke-width="10" :show-text="false" />
        <div class="card-sub">已验收 {{ progress.doneCount }} / {{ progress.totalCount }} 道工序</div>
      </el-card>

      <el-card
        class="card-block stat-card-link"
        :class="{ 'risk-card': procurementWarningStats.overdue > 0 }"
        shadow="never"
        @click="router.push(ROUTES.PROCUREMENT)"
      >
        <div class="card-label">材料采购预警</div>
        <div class="card-row">
          <span class="danger">逾期 {{ procurementWarningStats.overdue }}</span>
          <span class="warning">即将到期 {{ procurementWarningStats.expiring }}</span>
          <span class="success">正常 {{ procurementWarningStats.normal }}</span>
        </div>
      </el-card>

      <el-card
        class="card-block stat-card-link"
        :class="{ 'risk-card': pendingTodoCount > 0 }"
        shadow="never"
        @click="router.push(ROUTES.BUDGET)"
      >
        <div class="card-label">整改待办</div>
        <div class="card-value" :class="{ danger: pendingTodoCount > 0 }">{{ pendingTodoCount }}</div>
        <div class="card-sub">验收不合格项待处理</div>
      </el-card>

      <el-card
        class="card-block stat-card-link"
        :class="{ 'risk-card': budgetSummary.isOverOverallBudget }"
        shadow="never"
        @click="router.push(ROUTES.BUDGET)"
      >
        <div class="card-label">预算概况</div>
        <div class="card-value" :class="{ danger: budgetSummary.overallRemaining < 0, success: budgetSummary.overallRemaining > 0 }">
          剩余 ¥ {{ formatMoney(budgetSummary.overallRemaining) }}
        </div>
        <div class="card-sub">
          整体 ¥ {{ formatMoney(budgetSummary.overallBudget) }} · 已支付 ¥ {{ formatMoney(budgetSummary.totalPaid) }}
        </div>
        <div v-if="budgetSummary.isOverOverallBudget" class="over-budget">已支付超过整体预算</div>
      </el-card>
    </div>

    <el-dialog v-model="houseDialogVisible" title="编辑项目信息" width="90%" style="max-width: 420px">
      <el-form label-width="96px">
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
import { ROUTES, OVERALL_BUDGET } from '../constants'
import { formatMoney } from '../utils/format'
import { useAppStore } from '../composables/useAppStore'
import { getCurrentProcessInfo } from '../utils/calc'

const router = useRouter()
const {
  state,
  progress,
  budgetSummary,
  procurementWarningStats,
  pendingTodoCount,
  overallBudget,
  refreshWarningsIfNeeded,
  updateHouse,
} = useAppStore()

const houseDialogVisible = ref(false)
const houseForm = reactive({ area: '', address: '', overallBudget: OVERALL_BUDGET })

const currentProgress = computed(() => getCurrentProcessInfo(state.processes))

onMounted(() => {
  refreshWarningsIfNeeded()
})

function openHouseDialog() {
  houseForm.area = state.house.area
  houseForm.address = state.house.address
  houseForm.overallBudget = Number(state.house.overallBudget) || OVERALL_BUDGET
  houseDialogVisible.value = true
}

function submitHouse() {
  if (!houseForm.overallBudget || houseForm.overallBudget <= 0) {
    ElMessage.warning('请填写有效的装修总预算')
    return
  }
  updateHouse({
    area: houseForm.area.trim(),
    address: houseForm.address.trim(),
    overallBudget: Number(houseForm.overallBudget),
  })
  houseDialogVisible.value = false
}
</script>

<style scoped>
.current-progress-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.current-progress-card:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}

.current-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.current-progress-head .card-label {
  margin-bottom: 0;
}

.current-process-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 6px;
}

.current-process-meta {
  margin: 0 0 12px;
  font-size: 13px;
  color: #606266;
}

.current-progress-foot {
  margin: 8px 0 4px;
  font-size: 12px;
  color: #909399;
}

.current-progress-hint {
  margin: 0;
  font-size: 12px;
  color: #E6A23C;
  line-height: 1.5;
}

.stat-card-link {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card-link:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}
</style>
