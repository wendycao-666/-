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

      <p v-if="!syncMeta.cloudReady" class="sync-tip sync-tip-warn">
        当前为<strong>仅本地模式</strong>，数据只保存在本浏览器。要使用云端共享，管理员需先完成 Supabase 配置（约 10 分钟）。
        点击下方按钮可查看详细步骤。
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
        <el-button v-if="!syncMeta.cloudReady" link type="primary" @click="showCloudSetupGuide">
          查看配置步骤
        </el-button>
      </div>

      <div class="open-box">
        <el-input v-model="openLinkInput" placeholder="粘贴分享链接或项目 ID" />
        <el-button type="primary" plain @click="handleOpenCloud">打开分享链接</el-button>
      </div>
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
        :class="{ 'risk-card': materialStats.overdue > 0 }"
        shadow="never"
        @click="router.push({ path: ROUTES.PROCUREMENT, query: { tab: 'material' } })"
      >
        <div class="card-label">主材预警</div>
        <div class="card-row">
          <span class="danger">逾期 {{ materialStats.overdue }}</span>
          <span class="warning">即将到期 {{ materialStats.expiring }}</span>
          <span class="success">正常 {{ materialStats.normal }}</span>
        </div>
      </el-card>

      <el-card
        class="card-block stat-card-link"
        :class="{ 'risk-card': pendingTodoCount > 0 }"
        shadow="never"
        @click="router.push(ROUTES.TODO)"
      >
        <div class="card-label">整改待办</div>
        <div class="card-value" :class="{ danger: pendingTodoCount > 0 }">{{ pendingTodoCount }}</div>
        <div class="card-sub">验收不合格项待处理</div>
      </el-card>

      <el-card
        class="card-block stat-card-link"
        :class="{ 'risk-card': budgetSummary.isOverBudget }"
        shadow="never"
        @click="router.push(ROUTES.BUDGET)"
      >
        <div class="card-label">预算概况</div>
        <div class="card-value">¥ {{ formatMoney(budgetSummary.totalBudget) }}</div>
        <div class="card-sub">
          实际 ¥ {{ formatMoney(budgetSummary.totalActual) }} · 已支付 ¥ {{ formatMoney(budgetSummary.totalPaid) }}
        </div>
        <div v-if="budgetSummary.isOverBudget" class="over-budget">已支付超预算</div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
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
  pendingTodoCount,
  refreshWarningsIfNeeded,
  updateHouse,
  createCloudProject,
  openCloudProject,
} = useAppStore()

const houseDialogVisible = ref(false)
const houseForm = reactive({ area: '', address: '' })
const openLinkInput = ref('')

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

function showCloudSetupGuide() {
  ElMessageBox.alert(
    `【第 1 步】打开 supabase.com 注册，新建项目

【第 2 步】SQL Editor 中运行项目 supabase/schema.sql 建表

【第 3 步】Settings → API，复制 Project URL 和 anon public key

【第 4 步】GitHub 仓库 → Settings → Secrets → Actions，添加：
  · VITE_SUPABASE_URL
  · VITE_SUPABASE_ANON_KEY

【第 5 步】GitHub Actions 重新部署后，刷新本页

完成后标签变为「云端可用」，即可创建分享链接。`,
    '云端共享配置指南',
    {
      confirmButtonText: '我知道了',
      type: 'info',
      customClass: 'cloud-setup-msgbox',
    }
  )
}

async function handleCreateCloud() {
  if (!syncMeta.cloudReady) {
    showCloudSetupGuide()
    return
  }
  try {
    await createCloudProject()
    ElMessage.success('云端项目已创建，请复制链接分享给家人')
  } catch (error) {
    ElMessage.error(error.message || '创建失败')
  }
}

async function handleOpenCloud() {
  if (!syncMeta.cloudReady) {
    showCloudSetupGuide()
    return
  }
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

.sync-tip-warn {
  color: #606266;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  padding: 10px 12px;
}

.sync-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
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

.stat-card-link {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card-link:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .sync-actions .el-button {
    width: 100%;
  }

  .open-box .el-button {
    width: 100%;
  }
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
