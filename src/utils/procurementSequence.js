import { PROCUREMENT_ENTRY_SEQUENCE } from '../constants'

function getEntryOrderIndex(entry) {
  return PROCUREMENT_ENTRY_SEQUENCE.findIndex((row) => {
    if (entry.type === 'material') {
      return row.type === 'material' && row.name === entry.name
    }
    return row.type === 'procurement' && row.listKey === entry.listKey && row.name === entry.name
  })
}

export function getMaterialNameOrder() {
  return PROCUREMENT_ENTRY_SEQUENCE.filter((entry) => entry.type === 'material').map((entry) => entry.name)
}

export function sortProcurementItems(listKey, items) {
  return [...items].sort((a, b) => {
    const indexA = getEntryOrderIndex({ type: 'procurement', listKey, name: a.name })
    const indexB = getEntryOrderIndex({ type: 'procurement', listKey, name: b.name })
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}
