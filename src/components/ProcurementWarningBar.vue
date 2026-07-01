<template>
  <div class="stat-cards compact procurement-warning-bar">
    <el-card
      class="card-block stat-card-link stat-card--overdue"
      :class="{
        active: activeFilter === WARNING_STATUS.OVERDUE,
        'has-risk': stats.overdue > 0,
        'is-muted': stats.overdue === 0,
      }"
      shadow="never"
      @click="emitSelect(WARNING_STATUS.OVERDUE)"
    >
      <div class="card-label danger">逾期</div>
      <div :class="overdueNumClass">{{ stats.overdue }}</div>
    </el-card>
    <el-card
      class="card-block stat-card-link"
      :class="{
        active: activeFilter === WARNING_STATUS.EXPIRING,
        'has-warning': stats.expiring > 0,
        'is-muted': stats.expiring === 0,
      }"
      shadow="never"
      @click="emitSelect(WARNING_STATUS.EXPIRING)"
    >
      <div class="card-label warning">即将到期</div>
      <div :class="expiringNumClass">{{ stats.expiring }}</div>
    </el-card>
    <el-card
      class="card-block stat-card-link is-muted"
      :class="{ active: activeFilter === WARNING_STATUS.NORMAL }"
      shadow="never"
      @click="emitSelect(WARNING_STATUS.NORMAL)"
    >
      <div class="card-label muted">正常</div>
      <div class="num-stat--muted">{{ stats.normal }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { WARNING_STATUS } from '../constants'

const props = defineProps({
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

const overdueNumClass = computed(() =>
  props.stats.overdue > 0 ? 'num-stat--danger' : 'num-stat--muted'
)

const expiringNumClass = computed(() =>
  props.stats.expiring > 0 ? 'num-stat--warning' : 'num-stat--muted'
)

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
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.stat-card-link:hover {
  box-shadow: var(--reno-shadow-hover);
  transform: translateY(-1px);
}
.stat-card-link.active {
  box-shadow: 0 0 0 2px var(--reno-primary) inset;
}
.stat-card--overdue.has-risk {
  background: #faf0ee !important;
  border-color: rgba(196, 86, 77, 0.35) !important;
}
.stat-card-link.has-warning {
  background: #faf6ee !important;
}
.stat-card-link.is-muted {
  opacity: 0.72;
}
.stat-card-link.is-muted .card-label {
  color: var(--reno-text-muted);
}
.card-label {
  font-size: 13px;
  margin-bottom: 6px;
  font-weight: 600;
}
.card-label.danger {
  color: var(--reno-danger);
}
.card-label.warning {
  color: var(--reno-warning);
}
.card-label.muted {
  color: var(--reno-text-muted);
  font-weight: 500;
}
@media (max-width: 640px) {
  .compact {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .stat-card-link :deep(.el-card__body) {
    padding: 10px 8px !important;
  }
}
</style>
