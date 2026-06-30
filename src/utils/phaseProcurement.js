import {
  PROCESS_NAMES,
  PROCUREMENT_CATEGORIES,
  PROCUREMENT_ENTRY_SEQUENCE,
  PURCHASE_STATUS,
  WARNING_STATUS,
} from '../constants'
import { getCurrentProcessInfo } from './calc'
import { todayStr } from './date'

function getEntryOrder(entry) {
  return PROCUREMENT_ENTRY_SEQUENCE.findIndex((row) => {
    if (entry.type === 'material') {
      return row.type === 'material' && row.name === entry.name
    }
    return row.type === 'procurement' && row.listKey === entry.listKey && row.name === entry.name
  })
}

export function resolveFocusProcesses(processes, today = todayStr()) {
  if (!processes.length) {
    return { current: null, next: null, phaseInfo: getCurrentProcessInfo(processes, today) }
  }

  const sorted = [...processes].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const phaseInfo = getCurrentProcessInfo(processes, today)
  let current = null
  let next = null

  if (phaseInfo.phase === 'active') {
    current = phaseInfo.process
    const index = sorted.findIndex((process) => process.id === current.id)
    next = sorted[index + 1] || null
  } else if (phaseInfo.phase === 'pending') {
    next = sorted[0] || null
  } else if (phaseInfo.phase === 'upcoming') {
    next = phaseInfo.process
    const index = sorted.findIndex((process) => process.id === next.id)
    current = index > 0 ? sorted[index - 1] : null
  } else if (phaseInfo.phase === 'finished') {
    current = sorted[sorted.length - 1] || null
  }

  return { current, next, phaseInfo }
}

function collectProcurementEntriesByProcess(state) {
  const byProcess = Object.fromEntries(PROCESS_NAMES.map((name) => [name, []]))

  const push = (item, meta) => {
    if (!item.processName || !byProcess[item.processName]) return
    byProcess[item.processName].push({ ...meta, item })
  }

  state.materials.forEach((item) => {
    push(item, { type: 'material', tab: 'material', listKey: null, categoryLabel: '主材' })
  })

  PROCUREMENT_CATEGORIES.forEach((category) => {
    state.procurementLists[category.key]?.forEach((item) => {
      push(item, {
        type: 'procurement',
        tab: category.key,
        listKey: category.key,
        categoryLabel: category.label,
      })
    })
  })

  return byProcess
}

function isPendingProcurement(item) {
  return item.purchaseStatus !== PURCHASE_STATUS.ARRIVED
}

function sortPhaseItems(entries) {
  return [...entries].sort((a, b) => {
    const pendingA = isPendingProcurement(a.item) ? 0 : 1
    const pendingB = isPendingProcurement(b.item) ? 0 : 1
    if (pendingA !== pendingB) return pendingA - pendingB

    const dateA = a.item.latestOrderDate || '9999-99-99'
    const dateB = b.item.latestOrderDate || '9999-99-99'
    if (dateA !== dateB) return dateA.localeCompare(dateB)

    const orderA = getEntryOrder(a)
    const orderB = getEntryOrder(b)
    if (orderA === -1 && orderB === -1) return 0
    if (orderA === -1) return 1
    if (orderB === -1) return -1
    return orderA - orderB
  })
}

function buildProcessGroup(role, label, process, items) {
  return {
    role,
    label,
    processName: process.name,
    dateRange: `${process.startDate} ~ ${process.endDate}`,
    items: sortPhaseItems(items.filter(({ item }) => isPendingProcurement(item))),
  }
}

export function buildPhaseProcurementGroups(state, today = todayStr()) {
  const { current, next, phaseInfo } = resolveFocusProcesses(state.processes, today)
  const byProcess = collectProcurementEntriesByProcess(state)
  const groups = []

  if (phaseInfo.phase === 'pending' && next) {
    groups.push(buildProcessGroup('next', '即将开工', next, byProcess[next.name] || []))
    return groups
  }

  if (phaseInfo.phase === 'finished') {
    if (current) {
      const items = byProcess[current.name] || []
      const pending = items.filter(({ item }) => isPendingProcurement(item))
      if (pending.length) {
        groups.push(buildProcessGroup('current', '末道工序', current, items))
      }
    }
    return groups
  }

  if (current) {
    groups.push(buildProcessGroup('current', '当前工序', current, byProcess[current.name] || []))
  }

  if (next && next.name !== current?.name) {
    groups.push(buildProcessGroup('next', '下一工序', next, byProcess[next.name] || []))
  }

  return groups
}

export function countPhasePendingItems(groups) {
  return groups.reduce((sum, group) => sum + group.items.length, 0)
}

export function warningTagType(status) {
  if (status === WARNING_STATUS.OVERDUE) return 'danger'
  if (status === WARNING_STATUS.EXPIRING) return 'warning'
  return 'success'
}
