<template>
  <div class="page todo-page">
    <div class="page-header">
      <h2 class="page-title">整改待办</h2>
      <el-tag v-if="pendingTodoCount" type="danger" size="small">待处理 {{ pendingTodoCount }}</el-tag>
    </div>

    <el-radio-group v-model="filter" class="filter-bar" size="small">
      <el-radio-button label="pending">待办</el-radio-button>
      <el-radio-button label="done">已完成</el-radio-button>
      <el-radio-button label="all">全部</el-radio-button>
    </el-radio-group>

    <EmptyState v-if="!filteredTodos.length" :text="emptyText" />

    <el-card
      v-for="item in filteredTodos"
      :key="item.id"
      class="card-block todo-card"
      :class="{ 'todo-done': item.status === TODO_STATUS.DONE }"
      shadow="never"
    >
      <div class="todo-head">
        <span class="todo-content">{{ item.content }}</span>
        <el-tag v-if="item.status === TODO_STATUS.PENDING" type="danger" size="small">
          {{ TODO_STATUS.PENDING }}
        </el-tag>
        <el-tag v-else type="success" size="small">{{ TODO_STATUS.DONE }}</el-tag>
      </div>
      <div class="todo-meta">
        <span>{{ item.processName }}</span>
        <span>验收日期：{{ item.date }}</span>
        <span v-if="item.completedAt">整改完成：{{ item.completedAt }}</span>
      </div>
      <div class="card-footer">
        <el-button
          v-if="item.status === TODO_STATUS.PENDING"
          type="primary"
          size="small"
          round
          @click="handleComplete(item.id)"
        >
          整改完成
        </el-button>
        <el-button
          v-else
          type="primary"
          plain
          size="small"
          round
          @click="handleReopen(item.id)"
        >
          重新打开
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TODO_EMPTY_TEXT, TODO_STATUS } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import EmptyState from '../components/EmptyState.vue'

const { todos, pendingTodoCount, completeTodo, reopenTodo } = useAppStore()

const filter = ref('pending')

const filteredTodos = computed(() => {
  if (filter.value === 'pending') return todos.value.filter((t) => t.status === TODO_STATUS.PENDING)
  if (filter.value === 'done') return todos.value.filter((t) => t.status === TODO_STATUS.DONE)
  return todos.value
})

const emptyText = computed(() => {
  if (filter.value === 'done') return '暂无已完成整改项'
  if (filter.value === 'pending') return TODO_EMPTY_TEXT
  return TODO_EMPTY_TEXT
})

function handleComplete(id) {
  ElMessageBox.confirm('确认该不合格项已完成整改？', '整改完成', {
    type: 'info',
    confirmButtonText: '确认完成',
    cancelButtonText: '取消',
  })
    .then(() => {
      completeTodo(id)
      ElMessage.success('已标记为整改完成')
    })
    .catch(() => {})
}

function handleReopen(id) {
  ElMessageBox.confirm('确认重新打开该待办？', '重新打开', { type: 'warning' })
    .then(() => {
      reopenTodo(id)
      ElMessage.success('已恢复为待整改')
    })
    .catch(() => {})
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.page-header .page-title {
  margin: 0;
}
.filter-bar {
  margin-bottom: 12px;
}
.todo-card {
  margin-bottom: 12px;
}
.todo-done {
  opacity: 0.85;
}
.todo-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.todo-content {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  color: #303133;
  white-space: pre-wrap;
}
.todo-done .todo-content {
  color: #606266;
}
.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}
.card-footer {
  margin-top: 12px;
  text-align: right;
}
@media (max-width: 640px) {
  .filter-bar {
    display: flex;
    width: 100%;
  }
  .filter-bar :deep(.el-radio-button) {
    flex: 1;
  }
  .filter-bar :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 8px 4px;
  }
  .todo-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .todo-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
