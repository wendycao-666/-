import { reactive, computed } from 'vue'
import {
  PROCESS_NAMES,
  MATERIAL_TEMPLATES,
  SEMI_PACKAGE_AUXILIARY_MATERIALS,
  PROCUREMENT_CATEGORIES,
  PROCUREMENT_CATEGORY_TEMPLATES,
  PROCUREMENT_ORDER_RULES,
  MISC_BUDGET_TEMPLATES,
  ACCEPTANCE_STATUS,
  ACCEPTANCE_RESULT,
  PURCHASE_STATUS,
  TODO_STATUS,
  PROCESS_WORKDAYS,
  PROJECT_START_DATE,
  SCHEDULE_VERSION,
  DATA_VERSION,
  LABOR_BUDGET_CATEGORY,
  LABOR_BUDGET_TEMPLATES,
  OVERALL_BUDGET,
} from '../constants'
import { loadData, saveData } from '../utils/storage'
import { todayStr } from '../utils/date'
import { buildProcessSchedule } from '../utils/workday'
import {
  calcConstructionDays,
  refreshAllMaterials,
  refreshAllProcurementLists,
  calcBudgetSummary,
  calcProgress,
  calcMaterialStats,
} from '../utils/calc'
import { calcProcurementWarningStats } from '../utils/procurementWarning'
import {
  syncAllProcurementBudgets,
  syncBudgetToProcurement,
  cleanupAllProcurementBudgets,
  findProcurementItemByBudget,
} from '../utils/materialBudgetSync'
import { fetchProjectData, upsertProjectData } from '../utils/cloudStorage'
import {
  applySemiPackageBudgetTemplate as applySemiPackageTemplate,
  clearSemiPackageBudgetTemplate as clearSemiPackageTemplate,
  applyQuoteImportFromRows,
} from '../utils/applySemiPackageTemplate'
import {
  isCloudConfigured,
  getProjectIdFromUrl,
  buildShareUrl,
  setProjectIdInUrl,
} from '../utils/projectSync'

function createDefaultProcesses() {
  const schedule = buildProcessSchedule(PROJECT_START_DATE, PROCESS_NAMES, PROCESS_WORKDAYS)
  return schedule.map((item, index) => ({
    id: String(index + 1),
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    note: '',
    acceptanceStatus: ACCEPTANCE_STATUS.NONE,
  }))
}

function applyScheduleToProcesses(processes) {
  const schedule = buildProcessSchedule(PROJECT_START_DATE, PROCESS_NAMES, PROCESS_WORKDAYS)
  const scheduleMap = Object.fromEntries(schedule.map((item) => [item.name, item]))
  return processes.map((process) => {
    const planned = scheduleMap[process.name]
    if (!planned) return process
    return {
      ...process,
      startDate: planned.startDate,
      endDate: planned.endDate,
    }
  })
}

function createDefaultMaterials() {
  return MATERIAL_TEMPLATES.map((item, index) => ({
    id: String(index + 1),
    name: item.name,
    processName: item.processName,
    advanceDays: item.advanceDays,
    note: item.note || '',
    actualOrderDate: '',
    expectedArrivalDate: '',
    unitPrice: 0,
    quantity: 1,
    cost: 0,
    paidAmount: 0,
    purchaseStatus: PURCHASE_STATUS.PENDING,
    latestOrderDate: '',
    warningStatus: '正常',
  }))
}

function alignMaterialsWithTemplates(savedMaterials) {
  const defaults = createDefaultMaterials()
  if (!Array.isArray(savedMaterials) || savedMaterials.length === 0) return defaults
  const byName = Object.fromEntries(savedMaterials.map((item) => [item.name, item]))
  return defaults.map((def) => {
    const matched = byName[def.name]
    if (!matched) return { ...def }
    return { ...def, ...matched, name: def.name }
  })
}

function buildProcurementItemDefaults(template, prefix, index) {
  const rule = PROCUREMENT_ORDER_RULES[template.name] || {}
  return {
    id: `${prefix}-${index + 1}`,
    name: template.name,
    note: template.note || '',
    processName: rule.processName || '',
    advanceDays: rule.advanceDays ?? 0,
    actualOrderDate: '',
    expectedArrivalDate: '',
    unitPrice: 0,
    quantity: 1,
    cost: 0,
    paidAmount: 0,
    purchaseStatus: PURCHASE_STATUS.PENDING,
    latestOrderDate: '',
    warningStatus: '正常',
  }
}

function createDefaultProcurementItems(templates, prefix) {
  return templates.map((item, index) => buildProcurementItemDefaults(item, prefix, index))
}

function createDefaultProcurementLists() {
  return Object.fromEntries(
    PROCUREMENT_CATEGORIES.map(({ key }) => [
      key,
      createDefaultProcurementItems(PROCUREMENT_CATEGORY_TEMPLATES[key] || [], key),
    ])
  )
}

function loadProcurementLists(saved) {
  const defaults = createDefaultProcurementLists()
  let migrated = !saved?.procurementLists

  if (saved?.procurementLists) {
    PROCUREMENT_CATEGORIES.forEach(({ key }) => {
      const merged = mergeProcurementLists(saved.procurementLists[key], defaults[key])
      defaults[key] = merged.items
      migrated = migrated || merged.migrated
    })
  }

  if (saved?.softFurnishings?.length) {
    const merged = mergeProcurementLists(saved.softFurnishings, defaults.soft)
    defaults.soft = merged.items
    migrated = true
  }

  if (saved?.appliances?.length) {
    const merged = mergeProcurementLists(saved.appliances, defaults.appliance)
    defaults.appliance = merged.items
    migrated = true
  }

  if (!saved?.procurementLists && !saved?.softFurnishings?.length && !saved?.appliances?.length) {
    migrated = true
  }

  return { lists: defaults, migrated }
}

function createDefaultMiscBudgets() {
  return MISC_BUDGET_TEMPLATES.map((item, index) => ({
    id: `misc-init-${index + 1}`,
    category: '杂项',
    name: item.name,
    note: item.note || '',
    unitPrice: 0,
    quantity: 1,
    actualAmount: 0,
    paidAmount: 0,
    miscInit: true,
  }))
}

function createDefaultLaborBudgets() {
  return LABOR_BUDGET_TEMPLATES.map((item, index) => ({
    id: `labor-init-${index + 1}`,
    category: LABOR_BUDGET_CATEGORY,
    name: item.name,
    note: item.note || '',
    processName: item.processName,
    unitPrice: 0,
    quantity: 1,
    actualAmount: 0,
    paidAmount: 0,
    laborInit: true,
  }))
}

function createDefaultBudgets() {
  return [...createDefaultMiscBudgets(), ...createDefaultLaborBudgets()]
}

function mergeLaborBudgetInit(budgets) {
  const next = [...budgets]

  LABOR_BUDGET_TEMPLATES.forEach((template, index) => {
    let budget = next.find(
      (item) =>
        item.category === LABOR_BUDGET_CATEGORY &&
        (item.processName === template.processName || item.name === template.name)
    )

    if (budget) {
      budget.laborInit = true
      budget.processName = template.processName
      budget.category = LABOR_BUDGET_CATEGORY
      budget.name = budget.name || template.name
      budget.note = budget.note || template.note || ''
      if (budget.quantity === undefined || budget.quantity === null) budget.quantity = 1
      delete budget.paymentRatio
      return
    }

    next.push({
      id: `labor-init-${index + 1}`,
      category: LABOR_BUDGET_CATEGORY,
      name: template.name,
      note: template.note || '',
      processName: template.processName,
      unitPrice: 0,
      quantity: 1,
      actualAmount: 0,
      paidAmount: 0,
      laborInit: true,
    })
  })

  return next
}

function normalizeBudgets(budgets) {
  return budgets.map((item) => {
    let next = { ...item }
    if (item.name === '设计费' && item.category === '杂项') {
      next.category = '设计'
    }
    if (next.actualAmount === undefined || next.actualAmount === null) {
      next.actualAmount = Number(item.paidAmount || 0)
    }
    if (next.category === LABOR_BUDGET_CATEGORY) {
      delete next.paymentRatio
    }
    return next
  })
}

function applyLaborBudgetPayload(item) {
  if (item.category !== LABOR_BUDGET_CATEGORY) return item
  return {
    ...item,
    processName: item.processName || '',
  }
}

function createDefaultState() {
  const processes = createDefaultProcesses()
  const materials = refreshAllMaterials(createDefaultMaterials(), processes)
  const procurementLists = refreshAllProcurementLists(createDefaultProcurementLists(), processes)
  return {
    house: { area: '', address: '', overallBudget: OVERALL_BUDGET },
    processes,
    materials,
    procurementLists,
    acceptances: [],
    todos: [],
    budgets: createDefaultBudgets(),
    lastWarningRefreshDate: todayStr(),
  }
}

const state = reactive(createDefaultState())

const syncMeta = reactive({
  projectId: getProjectIdFromUrl() || '',
  cloudReady: isCloudConfigured(),
  syncing: false,
  syncError: '',
  initialized: false,
})

let cloudSaveTimer = null

function serializeState() {
  return {
    dataVersion: DATA_VERSION,
    scheduleVersion: SCHEDULE_VERSION,
    house: { ...state.house },
    processes: state.processes.map((p) => ({ ...p })),
    materials: state.materials.map((m) => ({ ...m })),
    procurementLists: Object.fromEntries(
      Object.entries(state.procurementLists).map(([key, items]) => [key, items.map((item) => ({ ...item }))])
    ),
    acceptances: state.acceptances.map((a) => ({
      ...a,
      images: [...a.images],
      failItems: [...(a.failItems || [])],
    })),
    todos: state.todos.map((t) => ({ ...t })),
    budgets: state.budgets.map((b) => ({ ...b })),
    lastWarningRefreshDate: state.lastWarningRefreshDate,
  }
}

function mergeProcurementLists(saved, defaults) {
  if (!Array.isArray(saved) || saved.length === 0) return { items: defaults, migrated: true }
  const byName = Object.fromEntries(saved.map((item) => [item.name, item]))
  const byId = Object.fromEntries(saved.map((item) => [item.id, item]))
  let migrated = saved.length !== defaults.length
  const items = defaults.map((def) => {
    const matched = byName[def.name] || byId[def.id]
    if (!matched) {
      migrated = true
      return { ...def }
    }
    if (matched.note === undefined) migrated = true
    if (!matched.processName && def.processName) migrated = true
    return {
      ...def,
      ...matched,
      name: def.name,
      note: matched.note ?? def.note ?? '',
      processName: def.processName,
      advanceDays: def.advanceDays,
    }
  })
  return { items, migrated }
}

function collectSavedProcurementByName(savedLists) {
  const byName = {}
  if (!savedLists) return byName
  Object.values(savedLists).forEach((items) => {
    if (!Array.isArray(items)) return
    items.forEach((item) => {
      byName[item.name] = item
    })
  })
  return byName
}

function migrateProcurementListsV4(savedLists) {
  const defaults = createDefaultProcurementLists()
  const savedByName = collectSavedProcurementByName(savedLists)
  const lists = {}

  PROCUREMENT_CATEGORIES.forEach(({ key }) => {
    const defaultItems = defaults[key] || []
    const savedItems = defaultItems.map((def) => savedByName[def.name]).filter(Boolean)
    lists[key] = mergeProcurementLists(savedItems, defaultItems).items
  })

  return lists
}

const BUDGET_CATEGORY_MIGRATION_V4 = {
  厨房: '厨电',
  卫浴: '卫浴洁具',
  客厅: '家电',
  阳台: '家电',
}

const PROCUREMENT_KEY_MIGRATION_V4 = {
  living: 'appliance',
  balcony: 'appliance',
}

function migrateBudgetsV4(budgets, procurementLists) {
  const itemKeyById = {}
  Object.entries(procurementLists).forEach(([key, items]) => {
    items.forEach((item) => {
      itemKeyById[item.id] = key
    })
  })

  return budgets.map((budget) => {
    const next = { ...budget }
    if (BUDGET_CATEGORY_MIGRATION_V4[next.category]) {
      next.category = BUDGET_CATEGORY_MIGRATION_V4[next.category]
    }
    if (next.procurementKey && PROCUREMENT_KEY_MIGRATION_V4[next.procurementKey]) {
      next.procurementKey = PROCUREMENT_KEY_MIGRATION_V4[next.procurementKey]
    }
    if (next.procurementId && itemKeyById[next.procurementId]) {
      next.procurementKey = itemKeyById[next.procurementId]
    }
    return next
  })
}

const NON_PROCUREMENT_NAMES = new Set(MISC_BUDGET_TEMPLATES.map((item) => item.name))

function mergeMiscBudgetInit(budgets, savedLists) {
  const procByName = savedLists ? collectSavedProcurementByName(savedLists) : {}
  const next = budgets.filter(
    (budget) => !(budget.procurementKey === 'base' && NON_PROCUREMENT_NAMES.has(budget.name))
  )

  MISC_BUDGET_TEMPLATES.forEach((template, index) => {
    const oldProc = procByName[template.name]
    let budget = next.find((item) => item.category === '杂项' && item.name === template.name)

    if (budget) {
      budget.miscInit = true
      budget.note = budget.note || template.note || ''
      if (oldProc) {
        if (Number(oldProc.unitPrice || 0) > 0) budget.unitPrice = Number(oldProc.unitPrice)
        if (Number(oldProc.cost || 0) > 0) budget.actualAmount = Number(oldProc.cost)
        if (Number(oldProc.paidAmount || 0) > 0) budget.paidAmount = Number(oldProc.paidAmount)
        if (oldProc.note) budget.note = oldProc.note
      }
      delete budget.procurementKey
      delete budget.procurementId
      return
    }

    next.push({
      id: `misc-init-${index + 1}`,
      category: '杂项',
      name: template.name,
      note: oldProc?.note || template.note || '',
      unitPrice: Number(oldProc?.unitPrice || 0),
      quantity: Number(oldProc?.quantity || 1) || 1,
      actualAmount: Number(oldProc?.cost || 0),
      paidAmount: Number(oldProc?.paidAmount || 0),
      miscInit: true,
    })
  })

  return next
}

function applySavedData(saved) {
  if (!saved) return false
  let migrated = !saved.dataVersion || saved.dataVersion < DATA_VERSION

  Object.assign(state.house, saved.house || { area: '', address: '', overallBudget: OVERALL_BUDGET })
  if (!state.house.overallBudget) {
    state.house.overallBudget = OVERALL_BUDGET
    migrated = true
  }
  state.processes = saved.processes || createDefaultProcesses()
  if (!saved.scheduleVersion || saved.scheduleVersion < SCHEDULE_VERSION) {
    state.processes = applyScheduleToProcesses(state.processes)
    migrated = true
  }
  state.materials = refreshAllMaterials(
    alignMaterialsWithTemplates(saved.materials),
    state.processes
  )
  if (!saved.materials?.length || !saved.dataVersion || saved.dataVersion < 7) migrated = true

  const rawSavedLists = saved.procurementLists
  const procurement = loadProcurementLists(saved)
  if (!saved.dataVersion || saved.dataVersion < 4) {
    state.procurementLists = migrateProcurementListsV4(rawSavedLists || procurement.lists)
    migrated = true
  } else {
    state.procurementLists = procurement.lists
  }
  state.procurementLists = refreshAllProcurementLists(state.procurementLists, state.processes)
  if (!saved.dataVersion || saved.dataVersion < DATA_VERSION) {
    migrated = true
  }
  migrated = migrated || procurement.migrated || !saved.dataVersion || saved.dataVersion < DATA_VERSION

  state.acceptances = (saved.acceptances || []).map((a) => ({
    ...a,
    failItems: a.failItems || [],
  }))
  state.todos = normalizeTodos(saved.todos || [])
  migrateFailAcceptancesToTodos()
  resyncAllProcessAcceptance()
  state.budgets = saved.budgets?.length ? normalizeBudgets(saved.budgets) : createDefaultBudgets()
  if (!saved.dataVersion || saved.dataVersion < 4) {
    state.budgets = migrateBudgetsV4(state.budgets, state.procurementLists)
    migrated = true
  }
  const miscSourceLists = !saved.dataVersion || saved.dataVersion < 5 ? rawSavedLists : null
  const mergedBudgets = mergeMiscBudgetInit(state.budgets, miscSourceLists)
  if (mergedBudgets !== state.budgets || miscSourceLists) {
    state.budgets = mergedBudgets
    if (!saved.dataVersion || saved.dataVersion < 5) migrated = true
  }
  const mergedLaborBudgets = mergeLaborBudgetInit(state.budgets)
  if (!saved.dataVersion || saved.dataVersion < 13) {
    state.budgets = normalizeBudgets(mergedLaborBudgets)
    migrated = true
  }
  state.lastWarningRefreshDate = saved.lastWarningRefreshDate || todayStr()
  if (!saved.dataVersion || saved.dataVersion < 7) {
    const removedMaterialIds = new Set(
      (saved.materials || [])
        .filter((item) => SEMI_PACKAGE_AUXILIARY_MATERIALS.includes(item.name))
        .map((item) => item.id)
    )
    if (removedMaterialIds.size) {
      state.budgets = state.budgets.filter((budget) => !removedMaterialIds.has(budget.materialId))
      migrated = true
    }
  }
  syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
  cleanupAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
  return migrated
}

function persistLocal() {
  saveData(serializeState())
}

async function persistCloudNow() {
  if (!syncMeta.projectId || !syncMeta.cloudReady) return
  syncMeta.syncing = true
  syncMeta.syncError = ''
  try {
    await upsertProjectData(syncMeta.projectId, serializeState())
  } catch (error) {
    syncMeta.syncError = error.message || '云端保存失败'
  } finally {
    syncMeta.syncing = false
  }
}

function persist() {
  persistLocal()
  if (!syncMeta.projectId || !syncMeta.cloudReady) return
  clearTimeout(cloudSaveTimer)
  cloudSaveTimer = setTimeout(() => {
    persistCloudNow()
  }, 600)
}

async function initStore() {
  syncMeta.cloudReady = isCloudConfigured()
  syncMeta.projectId = getProjectIdFromUrl() || syncMeta.projectId
  let migrated = false

  if (syncMeta.projectId && syncMeta.cloudReady) {
    syncMeta.syncing = true
    try {
      const remote = await fetchProjectData(syncMeta.projectId)
      if (remote) {
        migrated = applySavedData(remote) || migrated
      } else {
        migrated = applySavedData(loadData()) || migrated
        await persistCloudNow()
      }
      setProjectIdInUrl(syncMeta.projectId)
    } catch (error) {
      syncMeta.syncError = error.message || '云端加载失败，已使用本地数据'
      migrated = applySavedData(loadData()) || migrated
    } finally {
      syncMeta.syncing = false
    }
  } else {
    migrated = applySavedData(loadData()) || migrated
  }

  refreshWarningsIfNeeded()
  if (migrated) {
    persist()
  }
  syncMeta.initialized = true
}

function refreshProcurementSchedule() {
  state.materials = refreshAllMaterials(state.materials, state.processes)
  state.procurementLists = refreshAllProcurementLists(state.procurementLists, state.processes)
}

function refreshWarningsIfNeeded() {
  const today = todayStr()
  refreshProcurementSchedule()
  state.lastWarningRefreshDate = today
  persist()
}

function normalizeTodo(todo) {
  const status = todo.status || (todo.done ? TODO_STATUS.DONE : TODO_STATUS.PENDING)
  return {
    ...todo,
    status,
    completedAt: todo.completedAt || (status === TODO_STATUS.DONE ? todo.date : ''),
  }
}

function normalizeTodos(todos) {
  return todos.map(normalizeTodo)
}

function isTodoPending(todo) {
  return todo.status === TODO_STATUS.PENDING
}

function migrateFailAcceptancesToTodos() {
  state.acceptances.forEach((acceptance) => {
    if (acceptance.result !== ACCEPTANCE_RESULT.FAIL) return
    if (state.todos.some((t) => t.acceptanceId === acceptance.id)) return

    const items = acceptance.failItems?.length
      ? acceptance.failItems
      : acceptance.comment
        ? [acceptance.comment]
        : []

    items.filter(Boolean).forEach((content) => {
      state.todos.push({
        id: crypto.randomUUID(),
        acceptanceId: acceptance.id,
        processName: acceptance.processName,
        content,
        date: acceptance.date,
        status: TODO_STATUS.PENDING,
        completedAt: '',
      })
    })

    if (!acceptance.failItems?.length && items.length) {
      acceptance.failItems = [...items]
    }
  })
}

function createTodosFromAcceptance(acceptanceId, record) {
  const items = record.failItems.filter(Boolean)
  items.forEach((content) => {
    state.todos.unshift({
      id: crypto.randomUUID(),
      acceptanceId,
      processName: record.processName,
      content,
      date: record.date,
      status: TODO_STATUS.PENDING,
      completedAt: '',
    })
  })
}

function syncProcessAcceptance(processName) {
  const process = state.processes.find((p) => p.name === processName)
  if (!process) return
  const records = state.acceptances.filter((a) => a.processName === processName)
  if (!records.length) {
    process.acceptanceStatus = ACCEPTANCE_STATUS.NONE
    return
  }
  const hasFail = records.some((a) => a.result === ACCEPTANCE_RESULT.FAIL)
  process.acceptanceStatus = hasFail ? ACCEPTANCE_STATUS.FAIL : ACCEPTANCE_STATUS.DONE
}

function resyncAllProcessAcceptance() {
  state.processes.forEach((process) => syncProcessAcceptance(process.name))
}

function recalcMaterialsForProcess(processName) {
  refreshProcurementSchedule()
}

export function useAppStore() {
  const progress = computed(() => calcProgress(state.processes))
  const overallBudget = computed(() => Number(state.house.overallBudget) || OVERALL_BUDGET)
  const budgetSummary = computed(() => calcBudgetSummary(state.budgets, overallBudget.value))
  const materialStats = computed(() => calcMaterialStats(state.materials))
  const procurementWarningStats = computed(() =>
    calcProcurementWarningStats(state.materials, state.procurementLists)
  )
  const shareLink = computed(() => (syncMeta.projectId ? buildShareUrl(syncMeta.projectId) : ''))
  const pendingTodoCount = computed(() => state.todos.filter((t) => isTodoPending(t)).length)
  const todos = computed(() =>
    [...state.todos].sort((a, b) => {
      const aPending = isTodoPending(a)
      const bPending = isTodoPending(b)
      if (aPending !== bPending) return aPending ? -1 : 1
      const aTime = a.completedAt || a.date
      const bTime = b.completedAt || b.date
      return bTime.localeCompare(aTime)
    })
  )

  async function createCloudProject() {
    if (!syncMeta.cloudReady) {
      throw new Error('未配置云端数据库，请先按 README 配置 Supabase')
    }
    syncMeta.projectId = crypto.randomUUID()
    setProjectIdInUrl(syncMeta.projectId)
    await persistCloudNow()
  }

  async function openCloudProject(projectId) {
    if (!syncMeta.cloudReady) {
      throw new Error('未配置云端数据库，请先按 README 配置 Supabase')
    }
    syncMeta.projectId = projectId
    setProjectIdInUrl(projectId)
    syncMeta.syncing = true
    syncMeta.syncError = ''
    try {
      const remote = await fetchProjectData(projectId)
      if (remote) {
        applySavedData(remote)
      } else {
        applySavedData(loadData())
        await persistCloudNow()
      }
    } finally {
      syncMeta.syncing = false
    }
    refreshWarningsIfNeeded()
  }

  function updateHouse(data) {
    state.house.area = data.area
    state.house.address = data.address
    if (data.overallBudget !== undefined) {
      state.house.overallBudget = Number(data.overallBudget) || OVERALL_BUDGET
    }
    persist()
  }

  function updateProcess(id, data) {
    const process = state.processes.find((p) => p.id === id)
    if (!process) return false
    const startChanged = data.startDate !== undefined && data.startDate !== process.startDate
    if (data.startDate !== undefined) process.startDate = data.startDate
    if (data.endDate !== undefined) process.endDate = data.endDate
    if (data.note !== undefined) process.note = data.note
    if (data.acceptanceStatus !== undefined) process.acceptanceStatus = data.acceptanceStatus
    if (startChanged) recalcMaterialsForProcess(process.name)
    persist()
    return true
  }

  function updateMaterial(id, data) {
    const material = state.materials.find((m) => m.id === id)
    if (!material) return
    Object.assign(material, data)
    state.materials = refreshAllMaterials(state.materials, state.processes)
    syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
    persist()
  }

  function updateProcurementItem(listKey, id, data) {
    const items = state.procurementLists[listKey]
    if (!items) return
    const item = items.find((entry) => entry.id === id)
    if (!item) return
    Object.assign(item, data)
    syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
    persist()
  }

  function updateSoftFurnishing(id, data) {
    updateProcurementItem('soft', id, data)
  }

  function updateAppliance(id, data) {
    updateProcurementItem('appliance', id, data)
  }

  function addAcceptance(record) {
    const id = crypto.randomUUID()
    const failItems =
      record.result === ACCEPTANCE_RESULT.FAIL ? record.failItems.filter(Boolean) : []

    state.acceptances.unshift({
      id,
      processName: record.processName,
      date: record.date,
      result: record.result,
      comment: record.comment,
      images: record.images || [],
      failItems,
    })

    if (failItems.length) {
      createTodosFromAcceptance(id, { ...record, failItems })
    }

    syncProcessAcceptance(record.processName)
    persist()
  }

  function deleteAcceptance(id) {
    const index = state.acceptances.findIndex((a) => a.id === id)
    if (index === -1) return
    const processName = state.acceptances[index].processName
    state.acceptances.splice(index, 1)
    state.todos = state.todos.filter((t) => t.acceptanceId !== id)
    syncProcessAcceptance(processName)
    persist()
  }

  function completeTodo(id) {
    const todo = state.todos.find((t) => t.id === id)
    if (!todo || !isTodoPending(todo)) return
    todo.status = TODO_STATUS.DONE
    todo.completedAt = todayStr()
    persist()
  }

  function reopenTodo(id) {
    const todo = state.todos.find((t) => t.id === id)
    if (!todo || isTodoPending(todo)) return
    todo.status = TODO_STATUS.PENDING
    todo.completedAt = ''
    persist()
  }

  function deleteTodo(id) {
    const index = state.todos.findIndex((t) => t.id === id)
    if (index === -1) return
    state.todos.splice(index, 1)
    persist()
  }

  function addBudget(item) {
    const payload = applyLaborBudgetPayload(item)
    state.budgets.unshift({
      id: crypto.randomUUID(),
      category: payload.category,
      name: payload.name,
      note: payload.note || '',
      processName: payload.processName || '',
      unitPrice: payload.unitPrice,
      quantity: payload.quantity,
      actualAmount: payload.actualAmount ?? 0,
      paidAmount: payload.paidAmount,
    })
    persist()
  }

  function updateBudget(id, item) {
    const budget = state.budgets.find((b) => b.id === id)
    if (!budget) return
    let payload = applyLaborBudgetPayload({ ...item })
    const procurementItem = findProcurementItemByBudget(budget, state)
    if (procurementItem) {
      syncBudgetToProcurement({ ...budget, ...payload }, procurementItem)
      payload.actualAmount = Number(procurementItem.cost || 0)
      payload.unitPrice = procurementItem.unitPrice
      payload.quantity = procurementItem.quantity
      payload.paidAmount = procurementItem.paidAmount
    }
    Object.assign(budget, payload)
    persist()
  }

  function deleteBudget(id) {
    const budget = state.budgets.find((b) => b.id === id)
    if (findProcurementItemByBudget(budget, state)) return false
    const index = state.budgets.findIndex((b) => b.id === id)
    if (index !== -1) {
      state.budgets.splice(index, 1)
      persist()
    }
    return true
  }

  function applySemiPackageBudgetTemplate(options, template) {
    const result = applySemiPackageTemplate(state, template, options)
    persist()
    return result
  }

  function clearSemiPackageBudgetTemplate(template) {
    const result = clearSemiPackageTemplate(state, template)
    persist()
    return result
  }

  function importSemiPackageQuote(parsed) {
    const result = applyQuoteImportFromRows(state, parsed)
    persist()
    return result
  }

  function getProcessDays(process) {
    return calcConstructionDays(process.startDate, process.endDate)
  }

  return {
    state,
    syncMeta,
    progress,
    overallBudget,
    budgetSummary,
    materialStats,
    procurementWarningStats,
    shareLink,
    pendingTodoCount,
    todos,
    initStore,
    refreshWarningsIfNeeded,
    createCloudProject,
    openCloudProject,
    updateHouse,
    updateProcess,
    updateMaterial,
    updateProcurementItem,
    updateSoftFurnishing,
    updateAppliance,
    addAcceptance,
    deleteAcceptance,
    completeTodo,
    reopenTodo,
    deleteTodo,
    addBudget,
    updateBudget,
    deleteBudget,
    applySemiPackageBudgetTemplate,
    clearSemiPackageBudgetTemplate,
    importSemiPackageQuote,
    getProcessDays,
  }
}
