<template>
  <p class="empty-state">{{ text }}</p>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据，请添加对应内容' },
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  color: #909399;
  padding: 40px 16px;
  font-size: 14px;
}
</style>
