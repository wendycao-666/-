<template>
  <div class="stat-cards compact procurement-warning-bar">
    <el-card
      class="card-block stat-card-link"
      :class="{ active: activeFilter === WARNING_STATUS.OVERDUE }"
      shadow="never"
      @click="emitSelect(WARNING_STATUS.OVERDUE)"
    >
      <div class="card-label danger">逾期</div>
      <div class="card-value danger">{{ stats.overdue }}</div>
    </el-card>
    <el-card
      class="card-block stat-card-link"
      :class="{ active: activeFilter === WARNING_STATUS.EXPIRING }"
      shadow="never"
      @click="emitSelect(WARNING_STATUS.EXPIRING)"
    >
      <div class="card-label warning">即将到期</div>
      <div class="card-value warning">{{ stats.expiring }}</div>
    </el-card>
    <el-card
      class="card-block stat-card-link"
      :class="{ active: activeFilter === WARNING_STATUS.NORMAL }"
      shadow="never"
      @click="emitSelect(WARNING_STATUS.NORMAL)"
    >
      <div class="card-label success">正常</div>
      <div class="card-value success">{{ stats.normal }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { WARNING_STATUS } from '../constants'

defineProps({
  stats: {
    type: Object,
    required: true,
  },
  activeFilter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

function emitSelect(status) {
  emit('select', status)
}
</script>

<style scoped>
.compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
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
.card-label {
  font-size: 13px;
  margin-bottom: 4px;
}
.card-label.danger {
  color: #F56C6C;
}
.card-label.warning {
  color: #E6A23C;
}
.card-label.success {
  color: #67C23A;
}
.card-value {
  font-size: 22px;
  font-weight: 700;
}
.card-value.danger {
  color: #F56C6C;
}
.card-value.warning {
  color: #E6A23C;
}
.card-value.success {
  color: #67C23A;
}
@media (max-width: 640px) {
  .compact {
    grid-template-columns: 1fr;
  }
}
</style>
