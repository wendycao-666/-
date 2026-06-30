import { PROCUREMENT_CATEGORIES, WARNING_STATUS } from '../constants'
import { calcMaterialStats } from './calc'

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

export { WARNING_STATUS }
