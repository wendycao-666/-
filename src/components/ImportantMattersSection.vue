<template>
  <div class="important-section">
    <el-card
      v-for="alert in alertItems"
      :key="alert.key"
      class="card-block alert-card"
      :class="`alert-${alert.level}`"
      shadow="never"
      @click="alert.action"
    >
      <div class="alert-row">
        <el-icon class="alert-icon"><component :is="alert.icon" /></el-icon>
        <div class="alert-body">
          <div class="alert-title">{{ alert.title }}</div>
          <div class="alert-desc">{{ alert.desc }}</div>
        </div>
        <el-icon class="alert-arrow"><ArrowRight /></el-icon>
      </div>
    </el-card>

    <el-radio-group v-model="filter" class="filter-bar" size="small">
      <el-radio-button label="pending">待处理</el-radio-button>
      <el-radio-button label="done">已完成</el-radio-button>
      <el-radio-button label="all">全部</el-radio-button>
    </el-radio-group>

    <EmptyState v-if="!filteredTodos.length && !alertItems.length" text="暂无重要事项，一切正常" />
    <EmptyState v-else-if="!filteredTodos.length" :text="emptyText" />

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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, WarningFilled, Clock, Wallet } from '@element-plus/icons-vue'
import { ROUTES, TODO_EMPTY_TEXT, TODO_STATUS, WARNING_STATUS } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { warningFilterToQuery } from '../utils/procurementWarning'
import { formatMoney, formatOverBudgetMessage } from '../utils/format'
import EmptyState from './EmptyState.vue'

const router = useRouter()
const { todos, procurementWarningStats, budgetSummary, completeTodo, reopenTodo } = useAppStore()

const filter = ref('pending')

const alertItems = computed(() => {
  const items = []
  if (procurementWarningStats.value.overdue > 0) {
    items.push({
      key: 'material-overdue',
      level: 'danger',
      icon: WarningFilled,
      title: `材料采购逾期 ${procurementWarningStats.value.overdue} 项`,
      desc: '请尽快处理采购下单',
      action: () =>
        router.push({
          path: ROUTES.PROCUREMENT,
          query: { warning: warningFilterToQuery(WARNING_STATUS.OVERDUE) },
        }),
    })
  }
  if (procurementWarningStats.value.expiring > 0) {
    items.push({
      key: 'material-expiring',
      level: 'warning',
      icon: Clock,
      title: `材料采购即将到期 ${procurementWarningStats.value.expiring} 项`,
      desc: '建议近期安排下单',
      action: () =>
        router.push({
          path: ROUTES.PROCUREMENT,
          query: { warning: warningFilterToQuery(WARNING_STATUS.EXPIRING) },
        }),
    })
  }
  if (budgetSummary.value.isOverOverallBudget) {
    items.push({
      key: 'budget-over',
      level: 'danger',
      icon: Wallet,
      title: '装修花钱已超出规划',
      desc: formatOverBudgetMessage(budgetSummary.value.totalPaid, budgetSummary.value.overallBudget),
      action: () =>
        router.push({
          path: ROUTES.BUDGET,
          query: { focus: 'overall' },
        }),
    })
  }
  return items
})

const filteredTodos = computed(() => {
  if (filter.value === 'pending') return todos.value.filter((t) => t.status === TODO_STATUS.PENDING)
  if (filter.value === 'done') return todos.value.filter((t) => t.status === TODO_STATUS.DONE)
  return todos.value
})

const emptyText = computed(() => {
  if (filter.value === 'done') return '暂无已完成整改项'
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
.alert-card {
  margin-bottom: 10px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.alert-card:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
  transform: translateY(-1px);
}
.alert-danger {
  border-left: 3px solid #F56C6C;
}
.alert-warning {
  border-left: 3px solid #E6A23C;
}
.alert-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.alert-icon {
  font-size: 22px;
  flex-shrink: 0;
}
.alert-danger .alert-icon {
  color: #F56C6C;
}
.alert-warning .alert-icon {
  color: #E6A23C;
}
.alert-body {
  flex: 1;
  min-width: 0;
}
.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.alert-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.alert-arrow {
  color: #C0C4CC;
  flex-shrink: 0;
}
.filter-bar {
  margin: 12px 0;
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
