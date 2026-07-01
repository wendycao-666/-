import { PROCUREMENT_CATEGORIES, PURCHASE_STATUS, WARNING_STATUS } from '../constants'
import { calcMaterialStats } from './calc'
import { buildPhaseProcurementGroups } from './phaseProcurement'

function collectProcurementWarningItems(materials, procurementLists) {
  const listItems = Object.values(procurementLists || {}).flat()
  return [...materials, ...listItems].filter((item) => item.processName)
}

export function calcProcurementWarningStats(materials, procurementLists) {
  return calcMaterialStats(collectProcurementWarningItems(materials, procurementLists))
}

export function findProcurementWarningTarget(status, state) {
  const items = listProcurementWarningItems(status, state)
  if (!items.length) return null
  const target = items[0]
  if (target.type === 'material') {
    return { tab: 'material', type: 'material', id: target.item.id, name: target.item.name }
  }
  return {
    tab: target.listKey,
    type: 'procurement',
    id: target.item.id,
    name: target.item.name,
    listKey: target.listKey,
  }
}

export function listProcurementWarningItems(status, state) {
  const results = []

  state.materials
    .filter((item) => item.warningStatus === status)
    .forEach((item) => {
      results.push({ type: 'material', tab: 'material', listKey: null, categoryLabel: '主材', item })
    })

  PROCUREMENT_CATEGORIES.forEach((category) => {
    state.procurementLists[category.key]
      ?.filter((item) => item.warningStatus === status)
      .forEach((item) => {
        results.push({
          type: 'procurement',
          tab: category.key,
          listKey: category.key,
          categoryLabel: category.label,
          item,
        })
      })
  })

  return results
}

const WARNING_QUERY_MAP = {
  overdue: WARNING_STATUS.OVERDUE,
  expiring: WARNING_STATUS.EXPIRING,
  normal: WARNING_STATUS.NORMAL,
}

export function resolveWarningFilterFromQuery(queryValue) {
  return WARNING_QUERY_MAP[queryValue] || ''
}

export function warningFilterToQuery(status) {
  const entry = Object.entries(WARNING_QUERY_MAP).find(([, value]) => value === status)
  return entry?.[0] || ''
}

function collectPendingProcurementEntries(state) {
  const results = []

  state.materials.forEach((item) => {
    if (item.purchaseStatus === PURCHASE_STATUS.ARRIVED) return
    results.push({
      type: 'material',
      tab: 'material',
      listKey: null,
      categoryLabel: '主材',
      budgetCategory: '主材',
      item,
    })
  })

  PROCUREMENT_CATEGORIES.forEach((category) => {
    state.procurementLists[category.key]?.forEach((item) => {
      if (item.purchaseStatus === PURCHASE_STATUS.ARRIVED) return
      results.push({
        type: 'procurement',
        tab: category.key,
        listKey: category.key,
        categoryLabel: category.label,
        budgetCategory: category.budgetCategory,
        item,
      })
    })
  })

  return results
}

function urgencyRank(item, isPhaseProcess) {
  if (item.warningStatus === WARNING_STATUS.OVERDUE) return 0
  if (item.warningStatus === WARNING_STATUS.EXPIRING) return 1
  if (isPhaseProcess) return 2
  return 3
}

function compareProcurementEntries(a, b, phaseProcessNames) {
  const rankA = urgencyRank(a.item, phaseProcessNames.has(a.item.processName))
  const rankB = urgencyRank(b.item, phaseProcessNames.has(b.item.processName))
  if (rankA !== rankB) return rankA - rankB

  const dateA = a.item.latestOrderDate || '9999-99-99'
  const dateB = b.item.latestOrderDate || '9999-99-99'
  if (dateA !== dateB) return dateA.localeCompare(dateB)

  return a.item.name.localeCompare(b.item.name, 'zh-CN')
}

export function listUrgencyProcurementItems(state) {
  const phaseProcessNames = new Set(buildPhaseProcurementGroups(state).map((group) => group.processName))
  return collectPendingProcurementEntries(state).sort((a, b) =>
    compareProcurementEntries(a, b, phaseProcessNames)
  )
}

export function listProcurementItemsForProcess(state, processName) {
  if (!processName) return []
  const phaseProcessNames = new Set([processName])
  return collectPendingProcurementEntries(state)
    .filter((entry) => entry.item.processName === processName)
    .sort((a, b) => compareProcurementEntries(a, b, phaseProcessNames))
}

export { WARNING_STATUS }
