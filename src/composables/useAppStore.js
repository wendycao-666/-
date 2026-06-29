import { reactive, computed } from 'vue'
import {
  PROCESS_NAMES,
  MATERIAL_TEMPLATES,
  SOFT_FURNISHING_TEMPLATES,
  APPLIANCE_TEMPLATES,
  ACCEPTANCE_STATUS,
  ACCEPTANCE_RESULT,
  PURCHASE_STATUS,
  TODO_STATUS,
  PROCESS_WORKDAYS,
  PROJECT_START_DATE,
  SCHEDULE_VERSION,
  DATA_VERSION,
} from '../constants'
import { loadData, saveData } from '../utils/storage'
import { todayStr } from '../utils/date'
import { buildProcessSchedule } from '../utils/workday'
import {
  calcConstructionDays,
  refreshAllMaterials,
  calcBudgetSummary,
  calcProgress,
  calcMaterialStats,
} from '../utils/calc'
import {
  syncAllProcurementBudgets,
  syncBudgetToProcurement,
  cleanupAllProcurementBudgets,
  findProcurementItemByBudget,
} from '../utils/materialBudgetSync'
import { fetchProjectData, upsertProjectData } from '../utils/cloudStorage'
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

function createDefaultProcurementItems(templates, prefix) {
  return templates.map((item, index) => ({
    id: `${prefix}-${index + 1}`,
    name: item.name,
    actualOrderDate: '',
    expectedArrivalDate: '',
    unitPrice: 0,
    quantity: 1,
    cost: 0,
    paidAmount: 0,
    purchaseStatus: PURCHASE_STATUS.PENDING,
  }))
}

function createDefaultSoftFurnishings() {
  return createDefaultProcurementItems(SOFT_FURNISHING_TEMPLATES, 'soft')
}

function createDefaultAppliances() {
  return createDefaultProcurementItems(APPLIANCE_TEMPLATES, 'appliance')
}

function createDefaultBudgets() {
  return []
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
    return next
  })
}

function createDefaultState() {
  const processes = createDefaultProcesses()
  const materials = refreshAllMaterials(createDefaultMaterials(), processes)
  return {
    house: { area: '', address: '' },
    processes,
    materials,
    softFurnishings: createDefaultSoftFurnishings(),
    appliances: createDefaultAppliances(),
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
    softFurnishings: state.softFurnishings.map((item) => ({ ...item })),
    appliances: state.appliances.map((item) => ({ ...item })),
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
    return { ...def, ...matched, name: def.name }
  })
  return { items, migrated }
}

function applySavedData(saved) {
  if (!saved) return false
  let migrated = !saved.dataVersion || saved.dataVersion < DATA_VERSION

  Object.assign(state.house, saved.house || { area: '', address: '' })
  state.processes = saved.processes || createDefaultProcesses()
  if (!saved.scheduleVersion || saved.scheduleVersion < SCHEDULE_VERSION) {
    state.processes = applyScheduleToProcesses(state.processes)
    migrated = true
  }
  state.materials = refreshAllMaterials(saved.materials || createDefaultMaterials(), state.processes)
  if (!saved.materials?.length) migrated = true

  const soft = mergeProcurementLists(saved.softFurnishings, createDefaultSoftFurnishings())
  state.softFurnishings = soft.items
  migrated = migrated || soft.migrated

  const appliances = mergeProcurementLists(saved.appliances, createDefaultAppliances())
  state.appliances = appliances.items
  migrated = migrated || appliances.migrated

  state.acceptances = (saved.acceptances || []).map((a) => ({
    ...a,
    failItems: a.failItems || [],
  }))
  state.todos = normalizeTodos(saved.todos || [])
  migrateFailAcceptancesToTodos()
  state.budgets = saved.budgets?.length ? normalizeBudgets(saved.budgets) : createDefaultBudgets()
  state.lastWarningRefreshDate = saved.lastWarningRefreshDate || todayStr()
  syncAllProcurementBudgets(state.materials, state.softFurnishings, state.appliances, state.budgets)
  cleanupAllProcurementBudgets(state.materials, state.softFurnishings, state.appliances, state.budgets)
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

function refreshWarningsIfNeeded() {
  const today = todayStr()
  state.materials = refreshAllMaterials(state.materials, state.processes)
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
  if (records.length === 0) {
    process.acceptanceStatus = ACCEPTANCE_STATUS.NONE
  } else if (process.acceptanceStatus !== ACCEPTANCE_STATUS.DONE) {
    process.acceptanceStatus = ACCEPTANCE_STATUS.PARTIAL
  }
}

function recalcMaterialsForProcess(processName) {
  state.materials = refreshAllMaterials(state.materials, state.processes)
}

export function useAppStore() {
  const progress = computed(() => calcProgress(state.processes))
  const budgetSummary = computed(() => calcBudgetSummary(state.budgets))
  const materialStats = computed(() => calcMaterialStats(state.materials))
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
    syncAllProcurementBudgets(state.materials, state.softFurnishings, state.appliances, state.budgets)
    persist()
  }

  function updateSoftFurnishing(id, data) {
    const item = state.softFurnishings.find((entry) => entry.id === id)
    if (!item) return
    Object.assign(item, data)
    syncAllProcurementBudgets(state.materials, state.softFurnishings, state.appliances, state.budgets)
    persist()
  }

  function updateAppliance(id, data) {
    const item = state.appliances.find((entry) => entry.id === id)
    if (!item) return
    Object.assign(item, data)
    syncAllProcurementBudgets(state.materials, state.softFurnishings, state.appliances, state.budgets)
    persist()
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
    state.budgets.unshift({
      id: crypto.randomUUID(),
      category: item.category,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      actualAmount: item.actualAmount ?? 0,
      paidAmount: item.paidAmount,
    })
    persist()
  }

  function updateBudget(id, item) {
    const budget = state.budgets.find((b) => b.id === id)
    if (!budget) return
    const payload = { ...item }
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

  function getProcessDays(process) {
    return calcConstructionDays(process.startDate, process.endDate)
  }

  return {
    state,
    syncMeta,
    progress,
    budgetSummary,
    materialStats,
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
    getProcessDays,
  }
}
