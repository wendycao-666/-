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

    <el-card class="card-block sync-card" shadow="never">
      <div class="sync-head">
        <h3 class="sync-title">云端共享</h3>
        <el-tag v-if="syncMeta.cloudReady && syncMeta.projectId" type="success" size="small">已连接云端</el-tag>
        <el-tag v-else-if="syncMeta.cloudReady" type="warning" size="small">云端可用 · 未创建链接</el-tag>
        <el-tag v-else type="info" size="small">仅本地模式</el-tag>
      </div>

      <p v-if="!syncMeta.cloudReady" class="sync-tip">
        当前为本地模式。配置 Supabase 并重新部署后，可通过链接与家人共享同一份数据（详见 README）。
      </p>
      <p v-else class="sync-tip">创建分享链接后，任何人打开同一链接都能看到并同步最新数据。</p>

      <div v-if="syncMeta.projectId && syncMeta.cloudReady" class="share-box">
        <el-input :model-value="shareLink" readonly>
          <template #append>
            <el-button @click="copyShareLink">复制链接</el-button>
          </template>
        </el-input>
        <p v-if="syncMeta.syncing" class="sync-status">正在同步到云端...</p>
        <p v-if="syncMeta.syncError" class="sync-error">{{ syncMeta.syncError }}</p>
      </div>

      <div class="sync-actions">
        <el-button type="primary" round @click="handleCreateCloud">创建云端项目链接</el-button>
      </div>

      <div class="open-box">
        <el-input v-model="openLinkInput" placeholder="粘贴分享链接或项目 ID" />
        <el-button type="primary" plain @click="handleOpenCloud">打开分享链接</el-button>
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
import { ElMessage } from 'element-plus'
import { ROUTES } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { parseProjectIdFromInput } from '../utils/projectSync'

const router = useRouter()
const {
  state,
  syncMeta,
  progress,
  budgetSummary,
  materialStats,
  shareLink,
  refreshWarningsIfNeeded,
  updateHouse,
  createCloudProject,
  openCloudProject,
} = useAppStore()

const houseDialogVisible = ref(false)
const houseForm = reactive({ area: '', address: '' })
const openLinkInput = ref('')

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

async function handleCreateCloud() {
  try {
    await createCloudProject()
    ElMessage.success('云端项目已创建，请复制链接分享给家人')
  } catch (error) {
    ElMessage.error(error.message || '创建失败')
  }
}

async function handleOpenCloud() {
  const projectId = parseProjectIdFromInput(openLinkInput.value)
  if (!projectId) {
    ElMessage.warning('请粘贴有效的分享链接或项目 ID')
    return
  }
  try {
    await openCloudProject(projectId)
    ElMessage.success('已加载云端项目数据')
  } catch (error) {
    ElMessage.error(error.message || '打开失败')
  }
}

async function copyShareLink() {
  if (!shareLink.value) return
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制链接')
  }
}
</script>

<style scoped>
.sync-card {
  margin-bottom: 16px;
}

.sync-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sync-title {
  margin: 0;
  font-size: 16px;
}

.sync-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.share-box,
.open-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.sync-actions {
  margin-bottom: 12px;
}

.sync-status {
  margin: 0;
  font-size: 12px;
  color: #409EFF;
}

.sync-error {
  margin: 0;
  font-size: 12px;
  color: #F56C6C;
}

@media (min-width: 640px) {
  .open-box {
    flex-direction: row;
    align-items: center;
  }

  .open-box .el-input {
    flex: 1;
  }
}
</style>
