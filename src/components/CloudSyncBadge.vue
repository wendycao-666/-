<template>
  <button type="button" class="cloud-sync-badge" @click="$emit('open')">
    <el-tag :type="tagType" size="small">{{ tagLabel }}</el-tag>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../composables/useAppStore'

defineEmits(['open'])

const { syncMeta } = useAppStore()

const tagLabel = computed(() => {
  if (syncMeta.syncing) return '同步中'
  if (syncMeta.cloudReady && syncMeta.projectId) return '已同步'
  if (syncMeta.cloudReady) return '未分享'
  return '仅本地'
})

const tagType = computed(() => {
  if (syncMeta.syncing) return 'info'
  if (syncMeta.cloudReady && syncMeta.projectId) return 'success'
  if (syncMeta.cloudReady) return 'warning'
  return 'info'
})
</script>

<style scoped>
.cloud-sync-badge {
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  line-height: 1;
}
</style>
