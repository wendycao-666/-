<template>
  <div class="page home">
    <el-card class="card-block house-card" shadow="never">
      <div class="house-info">
        <div class="house-main">
          <h2 class="page-title">毛坯装修管理</h2>
          <p class="house-address">{{ state.house.address || '未填写房屋地址' }}</p>
          <p class="house-area">面积：{{ state.house.area ? `${state.house.area} ㎡` : '未填写' }}</p>
        </div>
        <el-button type="primary" round @click="openHouseDialog">编辑房屋信息</el-button>
      </div>
    </el-card>

    <div class="stat-cards">
      <el-card class="card-block" shadow="never">
        <div class="card-label">整体进度</div>
        <div class="card-value primary">{{ progress.percent }}%</div>
        <el-progress :percentage="progress.percent" :stroke-width="10" :show-text="false" />
        <div class="card-sub">已验收 {{ progress.doneCount }} / {{ progress.totalCount }} 道工序</div>
      </el-card>

      <el-card class="card-block" :class="{ 'risk-card': materialStats.overdue > 0 }" shadow="never">
        <div class="card-label">主材预警</div>
        <div class="card-row">
          <span class="danger">逾期 {{ materialStats.overdue }}</span>
          <span class="warning">即将到期 {{ materialStats.expiring }}</span>
          <span class="success">正常 {{ materialStats.normal }}</span>
        </div>
      </el-card>

      <el-card class="card-block" :class="{ 'risk-card': budgetSummary.isOverBudget }" shadow="never">
        <div class="card-label">预算概况</div>
        <div class="card-value">¥ {{ formatMoney(budgetSummary.totalBudget) }}</div>
        <div class="card-sub">
          已支出 ¥ {{ formatMoney(budgetSummary.totalPaid) }} · 剩余 ¥ {{ formatMoney(budgetSummary.remaining) }}
        </div>
        <div v-if="budgetSummary.isOverBudget" class="over-budget">已超支</div>
      </el-card>
    </div>

    <div class="nav-grid">
      <el-card
        v-for="item in navItems"
        :key="item.path"
        class="card-block nav-item"
        shadow="never"
        @click="router.push(item.path)"
      >
        <el-icon :size="28" color="#409EFF"><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-card>
    </div>

    <el-dialog v-model="houseDialogVisible" title="编辑房屋信息" width="90%" style="max-width: 420px">
      <el-form label-width="80px">
        <el-form-item label="房屋面积">
          <el-input v-model="houseForm.area" placeholder="请输入面积（㎡）" />
        </el-form-item>
        <el-form-item label="房屋地址">
          <el-input v-model="houseForm.address" placeholder="请输入房屋地址" type="textarea" :rows="2" />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, Box, DocumentChecked, Wallet } from '@element-plus/icons-vue'
import { ROUTES } from '../constants'
import { useAppStore } from '../composables/useAppStore'

const router = useRouter()
const { state, progress, budgetSummary, materialStats, refreshWarningsIfNeeded, updateHouse } = useAppStore()

const houseDialogVisible = ref(false)
const houseForm = reactive({ area: '', address: '' })

const navItems = [
  { label: '工序进度', path: ROUTES.PROCESS, icon: Calendar },
  { label: '主材采购', path: ROUTES.MATERIAL, icon: Box },
  { label: '验收记录', path: ROUTES.ACCEPTANCE, icon: DocumentChecked },
  { label: '预算管理', path: ROUTES.BUDGET, icon: Wallet },
]

onMounted(() => {
  refreshWarningsIfNeeded()
})

function openHouseDialog() {
  houseForm.area = state.house.area
  houseForm.address = state.house.address
  houseDialogVisible.value = true
}

function submitHouse() {
  updateHouse({ area: houseForm.area.trim(), address: houseForm.address.trim() })
  houseDialogVisible.value = false
}

function formatMoney(val) {
  return Number(val || 0).toFixed(2)
}
</script>
