<template>
  <div class="acceptance-section">
    <EmptyState v-if="!state.acceptances.length" text="暂无验收记录，可在进度页各工序下新增验收" />
    <el-card
      v-for="item in state.acceptances"
      :key="item.id"
      class="card-block acceptance-card"
      shadow="never"
    >
      <div class="acceptance-head">
        <div>
          <h3>{{ item.processName }}</h3>
          <p class="acceptance-date">{{ item.date }}</p>
        </div>
        <el-tag :type="item.result === ACCEPTANCE_RESULT.PASS ? 'success' : 'danger'" size="small">
          {{ item.result }}
        </el-tag>
      </div>
      <p v-if="item.comment" class="acceptance-comment">{{ item.comment }}</p>
      <ul v-if="item.result === ACCEPTANCE_RESULT.FAIL && item.failItems?.length" class="fail-list">
        <li v-for="(failItem, idx) in item.failItems" :key="idx">{{ failItem }}</li>
      </ul>
      <div v-if="item.images.length" class="image-list">
        <el-image
          v-for="(img, idx) in item.images"
          :key="idx"
          :src="img"
          :preview-src-list="item.images"
          fit="cover"
          class="thumb"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ACCEPTANCE_RESULT } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import EmptyState from './EmptyState.vue'

const { state } = useAppStore()
</script>

<style scoped>
.acceptance-card {
  margin-bottom: 12px;
}
.acceptance-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.acceptance-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
.acceptance-date {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.acceptance-comment {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}
.fail-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #F56C6C;
  font-size: 14px;
}
.fail-list li {
  margin-bottom: 4px;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
}
@media (max-width: 640px) {
  .acceptance-head {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
