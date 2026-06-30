<template>
  <div class="budget-pie">
    <div v-if="!segments.length" class="pie-empty">暂无实际支出数据</div>
    <template v-else>
      <svg viewBox="0 0 120 120" class="pie-svg" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="#f2f6fc" />
        <path
          v-for="slice in slices"
          :key="slice.key"
          :d="slice.path"
          :fill="slice.color"
        />
        <circle cx="60" cy="60" r="28" fill="#fff" />
      </svg>
      <ul class="pie-legend">
        <li v-for="item in segments" :key="item.key">
          <span class="legend-dot" :style="{ background: item.color }" />
          <span class="legend-name">{{ item.name }}</span>
          <span class="legend-value">{{ item.percent }}%</span>
          <span class="legend-amount">¥ {{ formatMoney(item.value) }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  segments: {
    type: Array,
    default: () => [],
  },
})

import { formatMoney } from '../utils/format'

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function describeSlice(cx, cy, radius, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.999) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
  }
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

const slices = computed(() => {
  const total = props.segments.reduce((sum, item) => sum + item.value, 0)
  if (!total) return []

  let currentAngle = 0
  return props.segments.map((item) => {
    const sweep = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sweep
    currentAngle = endAngle
    return {
      key: item.key,
      color: item.color,
      path: describeSlice(60, 60, 52, startAngle, endAngle),
    }
  })
})
</script>

<style scoped>
.budget-pie {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.pie-empty {
  width: 100%;
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 24px 0;
}
.pie-svg {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}
.pie-legend {
  flex: 1;
  min-width: 180px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.pie-legend li {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.legend-name {
  color: #303133;
}
.legend-value {
  color: #409EFF;
  font-weight: 600;
}
@media (max-width: 640px) {
  .budget-pie {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .pie-svg {
    margin: 0 auto;
  }
  .pie-legend {
    min-width: 0;
    width: 100%;
  }
  .pie-legend li {
    grid-template-columns: 10px minmax(0, 1fr) auto;
    gap: 6px 8px;
  }
  .legend-amount {
    grid-column: 2 / -1;
    padding-left: 18px;
    font-size: 12px;
  }
}
</style>
