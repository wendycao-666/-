<template>
  <div class="page procurement-page">

    <div class="procurement-toolbar">
      <ProcurementWarningBar
        :stats="procurementWarningStats"
        :active-filter="warningFilter"
        @select="onWarningSelect"
      />
      <el-button round size="small" type="primary" plain @click="handleImportQuoteEstimates">
        导入预估报价
      </el-button>
    </div>

    <PhaseProcurementPanel @select="onPhaseItemSelect" />

    <section v-if="processFilter" ref="filterSectionRef" class="warning-filter-view">
      <div class="filter-toolbar">
        <span class="filter-title">「{{ processFilter }}」待采购 {{ processFilterItems.length }} 项</span>
        <el-button link type="primary" @click="clearProcessFilter">返回待处理</el-button>
      </div>

      <div v-if="processMaterialNames.length" class="filter-group">
        <h4 class="filter-group-title">主材</h4>
        <MaterialSection :name-order="processMaterialNames" />
      </div>

      <div
        v-for="group in processProcurementGroups"
        :key="group.key"
        class="filter-group"
      >
        <h4 class="filter-group-title">{{ group.label }}</h4>
        <ProcurementSection
          :items="group.items"
          :category-label="group.label"
          :budget-category="group.budgetCategory"
          :sync-tip="`填写实际花了多少后，会同步至「预算 · ${group.budgetCategory}」`"
          @save="(item) => saveProcurementItem(group.key, item)"
        />
      </div>

      <EmptyState v-if="!processFilterItems.length" text="该工序暂无待采购项" />
    </section>

    <section v-else-if="warningFilter" ref="filterSectionRef" class="warning-filter-view">
      <div class="filter-toolbar">
        <span class="filter-title">「{{ warningFilter }}」共 {{ warningFilterItems.length }} 项</span>
        <el-button link type="primary" @click="clearWarningFilter">返回待处理</el-button>
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
          :budget-category="group.budgetCategory"
          :sync-tip="`填写实际花了多少后，会同步至「预算 · ${group.budgetCategory}」`"
          @save="(item) => saveProcurementItem(group.key, item)"
        />
      </div>
    </section>

    <section v-else-if="pageMode === 'urgency'" class="urgency-view">
      <div class="filter-toolbar">
        <span class="filter-title">待处理 {{ urgencyItems.length }} 项</span>
        <el-button link type="primary" @click="switchToCategoryView">按分类查看</el-button>
      </div>

      <button
        v-for="entry in urgencyItems"
        :key="`${entry.type}-${entry.item.id}`"
        type="button"
        class="urgency-item"
        @click="onUrgencyItemSelect(entry)"
      >
        <div class="urgency-item-head">
          <span class="urgency-item-name">{{ entry.item.name }}</span>
          <el-tag :type="warningTagType(entry.item.warningStatus)" size="small">
            {{ entry.item.warningStatus }}
          </el-tag>
        </div>
        <p class="urgency-item-meta">
          {{ entry.categoryLabel }}
          <template v-if="entry.item.processName"> · {{ entry.item.processName }}</template>
          <template v-if="entry.item.latestOrderDate"> · 最晚 {{ entry.item.latestOrderDate }}</template>
        </p>
      </button>

      <EmptyState v-if="!urgencyItems.length" text="暂无待处理采购项，一切正常" />
    </section>

    <section v-else class="category-view">
      <div class="filter-toolbar">
        <span class="filter-title">按分类查看</span>
        <el-button link type="primary" @click="switchToUrgencyView">返回待处理</el-button>
      </div>

      <div class="dimension-filter-bar">
        <el-radio-group v-model="dimensionFilter" size="small">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button
            v-for="dim in PROCUREMENT_DIMENSION_OPTIONS"
            :key="dim"
            :label="dim"
          >
            {{ dim }}
          </el-radio-button>
        </el-radio-group>
      </div>

    <el-tabs v-model="activeTab" class="procurement-tabs">
      <el-tab-pane v-if="showMaterialTab" label="主材" name="material">
        <MaterialSection :name-order="materialNameOrder" :highlight-id="materialHighlightId" />
      </el-tab-pane>
      <el-tab-pane
        v-for="category in filteredCategories"
        :key="category.key"
        :label="categoryTabLabel(category)"
        :name="category.key"
      >
        <ProcurementSection
          :items="sortedItems(category.key)"
          :category-label="category.label"
          :budget-category="category.budgetCategory"
          :highlight-id="procurementHighlightId"
          :sync-tip="`填写实际花了多少后，会同步至「预算 · ${category.budgetCategory}」`"
          @save="(item) => saveProcurementItem(category.key, item)"
        />
      </el-tab-pane>
    </el-tabs>
    <EmptyState v-if="!filteredCategories.length && !showMaterialTab" text="该大类下暂无采购分类" />
    </section>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PROCUREMENT_CATEGORIES, PROCUREMENT_CATEGORY_TEMPLATES, PROCUREMENT_DIMENSION_OPTIONS, PROCUREMENT_DIMENSIONS, resolveBudgetDimension } from '../constants'
import { useAppStore } from '../composables/useAppStore'
import { getMaterialNameOrder, sortProcurementItems } from '../utils/procurementSequence'
import {
  listProcurementWarningItems,
  listUrgencyProcurementItems,
  listProcurementItemsForProcess,
  resolveWarningFilterFromQuery,
  warningFilterToQuery,
} from '../utils/procurementWarning'
import { warningTagType } from '../utils/phaseProcurement'
import MaterialSection from '../components/MaterialSection.vue'
import ProcurementSection from '../components/ProcurementSection.vue'
import ProcurementWarningBar from '../components/ProcurementWarningBar.vue'
import PhaseProcurementPanel from '../components/PhaseProcurementPanel.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const { state, updateProcurementItem, refreshWarningsIfNeeded, procurementWarningStats, importUserQuoteEstimates } =
  useAppStore()

const materialNameOrder = getMaterialNameOrder()
const materialHighlightId = ref('')
const procurementHighlightId = ref('')
const warningFilter = ref('')
const processFilter = ref('')
const pageMode = ref('urgency')
const filterSectionRef = ref(null)

onMounted(() => {
  refreshWarningsIfNeeded()
  applyFiltersFromQuery()
  // 自动导入静默执行：不再弹出自动导入提示
  importUserQuoteEstimates()
})

function handleImportQuoteEstimates() {
  const { filledCount } = importUserQuoteEstimates()
  if (filledCount > 0) {
    ElMessage.success(`已导入 ${filledCount} 项预估报价到规划单价`)
  } else {
    ElMessage.info('没有可导入的项（已有规划价或记账的不会覆盖）')
  }
}

watch(
  () => [route.query.warning, route.query.process, route.query.tab],
  () => {
    applyFiltersFromQuery()
  }
)

const visibleCategories = PROCUREMENT_CATEGORIES.filter(
  (category) => (PROCUREMENT_CATEGORY_TEMPLATES[category.key] || []).length > 0
)

const dimensionFilter = ref('')

const filteredCategories = computed(() => {
  if (!dimensionFilter.value) return visibleCategories
  return visibleCategories.filter(
    (category) => resolveBudgetDimension(category.budgetCategory) === dimensionFilter.value
  )
})

const showMaterialTab = computed(
  () =>
    state.materials.length > 0 &&
    (!dimensionFilter.value || dimensionFilter.value === PROCUREMENT_DIMENSIONS.HARD)
)

const TAB_NAMES = computed(() => [
  ...(showMaterialTab.value ? ['material'] : []),
  ...filteredCategories.value.map((item) => item.key),
])

const LEGACY_TAB_MAP = {
  living: 'soft',
  balcony: 'laundry',
  base: 'doors',
  appliance: 'laundry',
  material: 'doors',
}

function resolveTab(tab) {
  const mapped = LEGACY_TAB_MAP[tab] || tab
  if (TAB_NAMES.value.includes(mapped)) return mapped
  return filteredCategories.value[0]?.key || (showMaterialTab.value ? 'material' : 'doors')
}

function categoryTabLabel(category) {
  return `${resolveBudgetDimension(category.budgetCategory)} · ${category.label}`
}

const activeTab = ref(resolveTab(route.query.tab))

watch(dimensionFilter, () => {
  const resolved = resolveTab(activeTab.value)
  if (resolved !== activeTab.value) {
    activeTab.value = resolved
  }
})

watch(activeTab, (tab) => {
  if (warningFilter.value || processFilter.value || pageMode.value === 'urgency') return
  if (route.query.tab === tab) return
  router.replace({ query: { ...route.query, tab } })
})

watch(
  () => route.query.tab,
  (tab) => {
    if (warningFilter.value || processFilter.value || pageMode.value === 'urgency') return
    const resolved = resolveTab(tab)
    if (resolved !== activeTab.value) {
      activeTab.value = resolved
    }
  }
)

const urgencyItems = computed(() => listUrgencyProcurementItems(state))

const warningFilterItems = computed(() =>
  warningFilter.value ? listProcurementWarningItems(warningFilter.value, state) : []
)

const processFilterItems = computed(() =>
  processFilter.value ? listProcurementItemsForProcess(state, processFilter.value) : []
)

const filteredMaterialNames = computed(() =>
  warningFilterItems.value.filter((entry) => entry.type === 'material').map((entry) => entry.item.name)
)

const processMaterialNames = computed(() =>
  processFilterItems.value.filter((entry) => entry.type === 'material').map((entry) => entry.item.name)
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

const processProcurementGroups = computed(() =>
  visibleCategories
    .map((category) => ({
      key: category.key,
      label: category.label,
      budgetCategory: category.budgetCategory,
      items: sortProcurementItems(
        category.key,
        processFilterItems.value
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

function applyFiltersFromQuery() {
  const processName = typeof route.query.process === 'string' ? route.query.process : ''
  if (processName) {
    processFilter.value = processName
    warningFilter.value = ''
    pageMode.value = 'process'
    scrollToFilterSection()
    return
  }

  processFilter.value = ''
  const status = resolveWarningFilterFromQuery(route.query.warning)
  if (status && listProcurementWarningItems(status, state).length) {
    warningFilter.value = status
    pageMode.value = 'warning'
    scrollToFilterSection()
    return
  }

  warningFilter.value = ''
  if (route.query.tab) {
    pageMode.value = 'category'
    activeTab.value = resolveTab(route.query.tab)
    return
  }

  pageMode.value = 'urgency'
}

function clearWarningFilter() {
  warningFilter.value = ''
  pageMode.value = 'urgency'
  const nextQuery = { ...route.query }
  delete nextQuery.warning
  router.replace({ query: nextQuery })
}

function clearProcessFilter() {
  processFilter.value = ''
  pageMode.value = 'urgency'
  const nextQuery = { ...route.query }
  delete nextQuery.process
  router.replace({ query: nextQuery })
}

function switchToCategoryView() {
  pageMode.value = 'category'
  activeTab.value = 'material'
  router.replace({ query: { tab: 'material' } })
}

function switchToUrgencyView() {
  pageMode.value = 'urgency'
  const nextQuery = { ...route.query }
  delete nextQuery.tab
  router.replace({ query: nextQuery })
  nextTick(() => {
    document.querySelector('.urgency-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function syncWarningQuery(status) {
  const nextQuery = { ...route.query }
  delete nextQuery.process
  if (status) {
    nextQuery.warning = warningFilterToQuery(status)
    delete nextQuery.tab
  } else {
    delete nextQuery.warning
  }
  if (route.query.warning !== nextQuery.warning || route.query.process) {
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

function onPhaseItemSelect(entry) {
  if (warningFilter.value) clearWarningFilter()
  if (processFilter.value) clearProcessFilter()

  pageMode.value = 'category'
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
  delete nextQuery.process
  router.replace({ query: nextQuery })

  nextTick(() => {
    const anchorId =
      entry.type === 'material' ? `material-${entry.item.id}` : `procurement-${entry.item.id}`
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function onUrgencyItemSelect(entry) {
  onPhaseItemSelect(entry)
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
  pageMode.value = 'warning'
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
.procurement-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.procurement-toolbar :deep(.procurement-warning-bar) {
  flex: 1;
  min-width: 0;
}
.warning-filter-view,
.urgency-view,
.category-view {
  scroll-margin-top: 88px;
}
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #faf6f2;
  border: 1px solid rgba(184, 115, 74, 0.15);
  border-radius: 8px;
}
.dimension-filter-bar {
  margin-bottom: 12px;
  overflow-x: auto;
}
.dimension-filter-bar :deep(.el-radio-group) {
  display: flex;
  flex-wrap: nowrap;
  width: max-content;
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
.urgency-item {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid var(--reno-border-light);
  border-radius: 12px;
  background: var(--reno-surface);
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.urgency-item:last-child {
  margin-bottom: 0;
}
.urgency-item:hover {
  box-shadow: var(--reno-shadow);
}
.urgency-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.urgency-item-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--reno-text);
}
.urgency-item-meta {
  margin: 0;
  font-size: 12px;
  color: var(--reno-text-muted);
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
