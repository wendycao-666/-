import { reactive, computed } from 'vue'
import {
  PROCESS_NAMES,
  MATERIAL_TEMPLATES,
  ACCEPTANCE_STATUS,
  PURCHASE_STATUS,
  PROCESS_WORKDAYS,
  PROJECT_START_DATE,
  SCHEDULE_VERSION,
  BUDGET_TEMPLATES,
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
    cost: 0,
    purchaseStatus: PURCHASE_STATUS.PENDING,
    latestOrderDate: '',
    warningStatus: '正常',
  }))
}

function createDefaultBudgets() {
  return BUDGET_TEMPLATES.map((item, index) => ({
    id: String(index + 1),
    category: item.category,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    paidAmount: item.paidAmount,
  }))
}

function ensureDefaultBudgets(budgets) {
  BUDGET_TEMPLATES.forEach((template) => {
    if (!budgets.some((b) => b.name === template.name)) {
      budgets.unshift({
        id: crypto.randomUUID(),
        category: template.category,
        name: template.name,
        unitPrice: template.unitPrice,
        quantity: template.quantity,
        paidAmount: template.paidAmount,
      })
    }
  })
}

function createDefaultState() {
  const processes = createDefaultProcesses()
  const materials = refreshAllMaterials(createDefaultMaterials(), processes)
  return {
    house: { area: '', address: '' },
    processes,
    materials,
    acceptances: [],
    budgets: createDefaultBudgets(),
    lastWarningRefreshDate: todayStr(),
  }
}

const state = reactive(createDefaultState())

function persist() {
  saveData({
    scheduleVersion: SCHEDULE_VERSION,
    house: { ...state.house },
    processes: state.processes.map((p) => ({ ...p })),
    materials: state.materials.map((m) => ({ ...m })),
    acceptances: state.acceptances.map((a) => ({ ...a, images: [...a.images] })),
    budgets: state.budgets.map((b) => ({ ...b })),
    lastWarningRefreshDate: state.lastWarningRefreshDate,
  })
}

function initStore() {
  const saved = loadData()
  if (saved) {
    Object.assign(state.house, saved.house || { area: '', address: '' })
    state.processes = saved.processes || createDefaultProcesses()
    if (!saved.scheduleVersion || saved.scheduleVersion < SCHEDULE_VERSION) {
      state.processes = applyScheduleToProcesses(state.processes)
    }
    state.materials = refreshAllMaterials(saved.materials || createDefaultMaterials(), state.processes)
    state.acceptances = saved.acceptances || []
    state.budgets = saved.budgets || createDefaultBudgets()
    ensureDefaultBudgets(state.budgets)
    state.lastWarningRefreshDate = saved.lastWarningRefreshDate || todayStr()
  }
  refreshWarningsIfNeeded()
}

function refreshWarningsIfNeeded() {
  const today = todayStr()
  state.materials = refreshAllMaterials(state.materials, state.processes)
  state.lastWarningRefreshDate = today
  persist()
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
    persist()
  }

  function addAcceptance(record) {
    state.acceptances.unshift({
      id: crypto.randomUUID(),
      processName: record.processName,
      date: record.date,
      result: record.result,
      comment: record.comment,
      images: record.images || [],
    })
    syncProcessAcceptance(record.processName)
    persist()
  }

  function deleteAcceptance(id) {
    const index = state.acceptances.findIndex((a) => a.id === id)
    if (index === -1) return
    const processName = state.acceptances[index].processName
    state.acceptances.splice(index, 1)
    syncProcessAcceptance(processName)
    persist()
  }

  function addBudget(item) {
    state.budgets.unshift({
      id: crypto.randomUUID(),
      category: item.category,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      paidAmount: item.paidAmount,
    })
    persist()
  }

  function updateBudget(id, item) {
    const budget = state.budgets.find((b) => b.id === id)
    if (!budget) return
    Object.assign(budget, item)
    persist()
  }

  function deleteBudget(id) {
    const index = state.budgets.findIndex((b) => b.id === id)
    if (index !== -1) {
      state.budgets.splice(index, 1)
      persist()
    }
  }

  function getProcessDays(process) {
    return calcConstructionDays(process.startDate, process.endDate)
  }

  return {
    state,
    progress,
    budgetSummary,
    materialStats,
    initStore,
    refreshWarningsIfNeeded,
    updateHouse,
    updateProcess,
    updateMaterial,
    addAcceptance,
    deleteAcceptance,
    addBudget,
    updateBudget,
    deleteBudget,
    getProcessDays,
  }
}
