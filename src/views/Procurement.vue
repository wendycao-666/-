<template>
  <div class="page procurement-page">

    <ProcurementWarningBar
      :stats="procurementWarningStats"
      :active-filter="warningFilter"
      @select="onWarningSelect"
    />

    <PhaseProcurementPanel @select="onPhaseItemSelect" />

    <section v-if="warningFilter" ref="filterSectionRef" class="warning-filter-view">
      <div class="filter-toolbar">
        <span class="filter-title">「{{ warningFilter }}」共 {{ warningFilterItems.length }} 项</span>
        <el-button link type="primary" @click="clearWarningFilter">查看全部</el-button>
      </div>

      <div v-if="filteredMaterialNames.length" class="filter-group">
        <h4 class="filter-group-title">主材</h4>
        <MaterialSection :name-order="filteredMaterialNames" />
      </div>

      <div
        v-for="group in filteredProcurementGroups"
        :key="group.key"
        class="filter-group"
      >
        <h4 class="filter-group-title">{{ group.label }}</h4>
        <ProcurementSection
          :items="group.items"
          :category-label="group.label"
          :sync-tip="`填写实际费用后同步至「预算 · ${group.budgetCategory}」`"
          @save="(item) => saveProcurementItem(group.key, item)"
        />
      </div>
    </section>

    <el-tabs v-else v-model="activeTab" class="procurement-tabs">
      <el-tab-pane label="主材" name="material">
        <MaterialSection :name-order="materialNameOrder" :highlight-id="materialHighlightId" />
      </el-tab-pane>
      <el-tab-pane
        v-for="category in visibleCategories"
        :key="category.key"
        :label="category.label"
        :name="category.key"
      >
        <ProcurementSection
          :items="sortedItems(category.key)"
          :category-label="category.label"
          :highlight-id="procurementHighlightId"
          :sync-tip="`填写实际费用后同步至「预算 · ${category.budgetCategory}」`"
          @save="(item) => saveProcurementItem(category.key, item)"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PROCUREMENT_CATEGORIES, PROCUREMENT_CATEGORY_TEMPLATES } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { getMaterialNameOrder, sortProcurementItems } from '../utils/procurementSequence'
import { listProcurementWarningItems, resolveWarningFilterFromQuery, warningFilterToQuery } from '../utils/procurementWarning'
import MaterialSection from '../components/MaterialSection.vue'
import ProcurementSection from '../components/ProcurementSection.vue'
import ProcurementWarningBar from '../components/ProcurementWarningBar.vue'
import PhaseProcurementPanel from '../components/PhaseProcurementPanel.vue'

const route = useRoute()
const router = useRouter()
const { state, updateProcurementItem, refreshWarningsIfNeeded, procurementWarningStats } = useAppStore()

const materialNameOrder = getMaterialNameOrder()
const materialHighlightId = ref('')
const procurementHighlightId = ref('')
const warningFilter = ref('')
const filterSectionRef = ref(null)

onMounted(() => {
  refreshWarningsIfNeeded()
  applyWarningFilterFromQuery()
})

watch(
  () => route.query.warning,
  () => {
    applyWarningFilterFromQuery()
  }
)

const visibleCategories = PROCUREMENT_CATEGORIES.filter(
  (category) => (PROCUREMENT_CATEGORY_TEMPLATES[category.key] || []).length > 0
)

const TAB_NAMES = ['material', ...visibleCategories.map((item) => item.key)]
const LEGACY_TAB_MAP = { living: 'appliance', balcony: 'appliance' }

function resolveTab(tab) {
  const mapped = LEGACY_TAB_MAP[tab] || tab
  return TAB_NAMES.includes(mapped) ? mapped : 'material'
}

const activeTab = ref(resolveTab(route.query.tab))

watch(activeTab, (tab) => {
  if (warningFilter.value) return
  if (route.query.tab === tab) return
  router.replace({ query: { ...route.query, tab } })
})

watch(
  () => route.query.tab,
  (tab) => {
    if (warningFilter.value) return
    const resolved = resolveTab(tab)
    if (resolved !== activeTab.value) {
      activeTab.value = resolved
    }
  }
)

const warningFilterItems = computed(() =>
  warningFilter.value ? listProcurementWarningItems(warningFilter.value, state) : []
)

const filteredMaterialNames = computed(() =>
  warningFilterItems.value.filter((entry) => entry.type === 'material').map((entry) => entry.item.name)
)

const filteredProcurementGroups = computed(() =>
  visibleCategories
    .map((category) => ({
      key: category.key,
      label: category.label,
      budgetCategory: category.budgetCategory,
      items: sortProcurementItems(
        category.key,
        warningFilterItems.value
          .filter((entry) => entry.listKey === category.key)
          .map((entry) => entry.item)
      ),
    }))
    .filter((group) => group.items.length)
)

function sortedItems(listKey) {
  return sortProcurementItems(listKey, state.procurementLists[listKey] || [])
}

function saveProcurementItem(listKey, item) {
  updateProcurementItem(listKey, item.id, normalizePayload(item))
}

function clearWarningFilter() {
  warningFilter.value = ''
  const nextQuery = { ...route.query }
  delete nextQuery.warning
  if (route.query.warning) {
    router.replace({ query: nextQuery })
  }
}

function syncWarningQuery(status) {
  const nextQuery = { ...route.query }
  if (status) {
    nextQuery.warning = warningFilterToQuery(status)
    delete nextQuery.tab
  } else {
    delete nextQuery.warning
  }
  if (route.query.warning !== nextQuery.warning) {
    router.replace({ query: nextQuery })
  }
}

function scrollToFilterSection() {
  nextTick(() => {
    filterSectionRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

function applyWarningFilterFromQuery() {
  const status = resolveWarningFilterFromQuery(route.query.warning)
  if (!status) {
    warningFilter.value = ''
    return
  }
  if (!listProcurementWarningItems(status, state).length) {
    warningFilter.value = ''
    return
  }
  warningFilter.value = status
  scrollToFilterSection()
}

function onPhaseItemSelect(entry) {
  if (warningFilter.value) {
    clearWarningFilter()
  }

  if (entry.type === 'material') {
    activeTab.value = 'material'
    materialHighlightId.value = entry.item.id
    procurementHighlightId.value = ''
  } else {
    activeTab.value = entry.listKey
    procurementHighlightId.value = entry.item.id
    materialHighlightId.value = ''
  }

  const nextQuery = { ...route.query, tab: entry.tab }
  delete nextQuery.warning
  router.replace({ query: nextQuery })

  nextTick(() => {
    const anchorId =
      entry.type === 'material' ? `material-${entry.item.id}` : `procurement-${entry.item.id}`
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function onWarningSelect(status) {
  const items = listProcurementWarningItems(status, state)
  if (!items.length) {
    ElMessage.info(`暂无「${status}」采购项`)
    return
  }

  if (warningFilter.value === status) {
    clearWarningFilter()
    return
  }

  warningFilter.value = status
  syncWarningQuery(status)
  scrollToFilterSection()
}

function normalizePayload(item) {
  return {
    actualOrderDate: item.actualOrderDate || '',
    expectedArrivalDate: item.expectedArrivalDate || '',
    unitPrice: Number(item.unitPrice || 0),
    quantity: Number(item.quantity || 1) || 1,
    cost: Number(item.cost || 0),
    paidAmount: Number(item.paidAmount || 0),
    purchaseStatus: item.purchaseStatus,
    note: item.note || '',
  }
}
</script>

<style scoped>
.warning-filter-view {
  scroll-margin-top: 88px;
}
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f5f9ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
}
.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.filter-group {
  margin-bottom: 16px;
}
.filter-group:last-child {
  margin-bottom: 0;
}
.filter-group-title {
  margin: 0 0 10px;
  padding-left: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 3px solid var(--reno-primary);
  line-height: 1.4;
}
.procurement-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
@media (max-width: 640px) {
  .procurement-tabs :deep(.el-tabs__item) {
    padding: 0 10px;
    font-size: 13px;
  }
}
</style>
