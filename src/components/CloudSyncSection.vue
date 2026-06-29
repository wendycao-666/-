<template>
  <div class="cloud-sync-section">
    <div class="cloud-sync-entry" @click="expanded = !expanded">
      <div class="entry-left">
        <span class="entry-label">云端共享</span>
        <el-tag v-if="syncMeta.cloudReady && syncMeta.projectId" type="success" size="small">已连接</el-tag>
        <el-tag v-else-if="syncMeta.cloudReady" type="warning" size="small">未创建链接</el-tag>
        <el-tag v-else type="info" size="small">仅本地</el-tag>
      </div>
      <el-icon class="entry-arrow" :class="{ expanded }">
        <ArrowRight />
      </el-icon>
    </div>

    <el-card v-show="expanded" class="card-block sync-card" shadow="never">
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { useAppStore } from '../composables/useAppStore'
import { parseProjectIdFromInput } from '../utils/projectSync'

const { syncMeta, shareLink, createCloudProject, openCloudProject } = useAppStore()

const expanded = ref(false)
const openLinkInput = ref('')

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
.cloud-sync-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}

.entry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.entry-arrow {
  font-size: 16px;
  color: #909399;
  transition: transform 0.2s;
}

.entry-arrow.expanded {
  transform: rotate(90deg);
  color: #409EFF;
}

.sync-card {
  margin-top: 8px;
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
