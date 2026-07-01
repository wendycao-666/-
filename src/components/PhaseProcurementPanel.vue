<template>
  <el-card v-if="groups.length" class="card-block phase-panel" shadow="never">
    <div class="panel-head">
      <div>
        <h3 class="panel-title">本阶段待采购</h3>
        <p class="panel-desc">按当前 / 下一工序汇总，仅展示未到货项</p>
      </div>
      <el-tag v-if="pendingCount" type="warning" size="small">待完成 {{ pendingCount }} 项</el-tag>
    </div>

    <section v-for="group in groups" :key="`${group.role}-${group.processName}`" class="phase-group">
      <div class="group-head">
        <div class="group-head-main">
          <span class="group-label">{{ group.label }}</span>
          <span class="group-process">{{ group.processName }}</span>
        </div>
        <span class="group-date">{{ group.dateRange }}</span>
      </div>

      <p v-if="!group.items.length" class="group-empty">该工序相关采购已全部到货</p>

      <button
        v-for="entry in group.items"
        :key="entry.item.id"
        type="button"
        class="phase-item"
        @click="emit('select', entry)"
      >
        <div class="item-main">
          <span class="item-name">{{ entry.item.name }}</span>
          <span class="item-category">{{ entry.categoryLabel }}</span>
        </div>
        <div class="item-meta">
          <span class="item-deadline">最晚 {{ entry.item.latestOrderDate || '-' }}</span>
          <el-tag :type="warningTagType(entry.item.warningStatus)" size="small">
            {{ entry.item.warningStatus }}
          </el-tag>
          <el-tag size="small" effect="plain">{{ entry.item.purchaseStatus }}</el-tag>
        </div>
      </button>
    </section>
  </el-card>

  <el-card v-else class="card-block phase-panel phase-panel-empty" shadow="never">
    <h3 class="panel-title">本阶段待采购</h3>
    <p class="panel-empty-text">当前暂无待采购项，相关材料均已到货</p>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../composables/useAppStore'
import { buildPhaseProcurementGroups, countPhasePendingItems, warningTagType } from '../utils/phaseProcurement'

const emit = defineEmits(['select'])

const { state } = useAppStore()

const groups = computed(() => buildPhaseProcurementGroups(state))
const pendingCount = computed(() => countPhasePendingItems(groups.value))
</script>

<style scoped>
.phase-panel {
  margin-bottom: 12px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}
.panel-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.panel-desc,
.panel-empty-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.phase-group + .phase-group {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
}
.group-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.group-head-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--reno-primary);
  background: var(--reno-primary-light);
  padding: 2px 8px;
  border-radius: 4px;
}
.group-process {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.group-date {
  font-size: 12px;
  color: #909399;
}
.group-empty {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.phase-item {
  display: block;
  width: 100%;
  margin: 0 0 8px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.phase-item:last-child {
  margin-bottom: 0;
}
.phase-item:hover {
  border-color: var(--reno-primary);
  background: #f5f9ff;
}
.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.item-category {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.item-deadline {
  font-size: 12px;
  color: #606266;
}
@media (max-width: 640px) {
  .item-main {
    flex-direction: column;
    align-items: flex-start;
  }
  .group-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
