import { PROCUREMENT_CATEGORIES } from '../constants'

export const MATERIAL_BUDGET_CATEGORY = '主材'

const LEGACY_PROCUREMENT_FIELDS = [
  { idField: 'softFurnishingId', category: '软装', listKey: 'soft' },
  { idField: 'applianceId', category: '家电', listKey: 'appliance' },
]

function getProcurementCategoryConfig(listKey) {
  return PROCUREMENT_CATEGORIES.find((item) => item.key === listKey)
}

export function getProcurementBudgetSource(budget) {
  if (!budget) return null
  if (budget.materialId) {
    return { idField: 'materialId', category: MATERIAL_BUDGET_CATEGORY, page: '采购', listKey: null }
  }
  if (budget.procurementKey && budget.procurementId) {
    const config = getProcurementCategoryConfig(budget.procurementKey)
    return {
      idField: 'procurementId',
      category: config?.budgetCategory || budget.category,
      page: '采购',
      listKey: budget.procurementKey,
    }
  }
  const legacy = LEGACY_PROCUREMENT_FIELDS.find((item) => budget[item.idField])
  if (legacy) {
    return { idField: legacy.idField, category: legacy.category, page: '采购', listKey: legacy.listKey }
  }
  return null
}

export function isMaterialBudgetItem(budget) {
  return Boolean(budget.materialId)
}

export function isProcurementBudgetItem(budget) {
  return Boolean(getProcurementBudgetSource(budget))
}

function findProcurementBudget(budgets, item, config) {
  if (config.listKey) {
    return (
      budgets.find((entry) => entry.procurementKey === config.listKey && entry.procurementId === item.id)
      || budgets.find(
        (entry) => entry.category === config.category && entry.name === item.name && !entry.procurementId
      )
    )
  }
  return (
    budgets.find((entry) => entry[config.idField] === item.id)
    || budgets.find(
      (entry) => entry.category === config.category && entry.name === item.name && !entry[config.idField]
    )
  )
}

function normalizeProcurementFields(item, budget) {
  return {
    ...item,
    unitPrice: Number(item.unitPrice ?? budget?.unitPrice ?? 0),
    quantity: Number(item.quantity ?? budget?.quantity ?? 1) || 1,
    cost: Number(item.cost ?? budget?.actualAmount ?? 0),
    paidAmount: Number(item.paidAmount ?? budget?.paidAmount ?? 0),
    note: item.note ?? '',
  }
}

function syncProcurementBudgets(items, budgets, config) {
  items.forEach((item) => {
    const linkedBudget = findProcurementBudget(budgets, item, config)
    const normalized = normalizeProcurementFields(item, linkedBudget)
    Object.assign(item, normalized)

    const hasActualCost = normalized.cost > 0
    const budget = findProcurementBudget(budgets, item, config)

    if (!hasActualCost) {
      if (budget) {
        const index = budgets.findIndex((entry) => entry.id === budget.id)
        if (index >= 0) budgets.splice(index, 1)
      }
      return
    }

    if (!budget) {
      budgets.push({
        id: crypto.randomUUID(),
        ...(config.listKey
          ? { procurementKey: config.listKey, procurementId: item.id }
          : { [config.idField]: item.id }),
        category: config.category,
        name: item.name,
        unitPrice: normalized.unitPrice,
        quantity: normalized.quantity,
        actualAmount: normalized.cost,
        paidAmount: normalized.paidAmount,
      })
      return
    }

    if (config.listKey) {
      budget.procurementKey = config.listKey
      budget.procurementId = item.id
      delete budget.softFurnishingId
      delete budget.applianceId
    } else {
      budget[config.idField] = item.id
    }
    budget.category = config.category
    budget.name = item.name
    budget.unitPrice = normalized.unitPrice
    budget.quantity = normalized.quantity
    budget.actualAmount = normalized.cost
    budget.paidAmount = normalized.paidAmount
  })
}

export function syncMaterialBudgets(materials, budgets) {
  syncProcurementBudgets(materials, budgets, {
    idField: 'materialId',
    category: MATERIAL_BUDGET_CATEGORY,
    listKey: null,
  })
}

export function syncProcurementListBudgets(listKey, items, budgets) {
  const config = getProcurementCategoryConfig(listKey)
  if (!config) return
  syncProcurementBudgets(items, budgets, {
    idField: 'procurementId',
    category: config.budgetCategory,
    listKey,
  })
}

export function syncAllProcurementBudgets(materials, procurementLists, budgets) {
  syncMaterialBudgets(materials, budgets)
  PROCUREMENT_CATEGORIES.forEach(({ key }) => {
    syncProcurementListBudgets(key, procurementLists[key] || [], budgets)
  })
}

export function findMaterialBudget(budgets, material) {
  return findProcurementBudget(budgets, material, {
    idField: 'materialId',
    category: MATERIAL_BUDGET_CATEGORY,
    listKey: null,
  })
}

export function syncBudgetToProcurement(budget, item) {
  const source = getProcurementBudgetSource(budget)
  if (!source || !item) return
  if (budget.unitPrice !== undefined) item.unitPrice = Number(budget.unitPrice || 0)
  if (budget.quantity !== undefined) item.quantity = Number(budget.quantity || 1) || 1
  if (budget.paidAmount !== undefined) item.paidAmount = Number(budget.paidAmount || 0)
  item.cost = Number(item.cost || budget.actualAmount || 0)
}

export function syncBudgetToMaterial(budget, material) {
  syncBudgetToProcurement(budget, material)
}

function cleanupProcurementBudgets(items, budgets, config) {
  for (let index = budgets.length - 1; index >= 0; index -= 1) {
    const budget = budgets[index]
    const linked =
      config.listKey
        ? budget.procurementKey === config.listKey && budget.procurementId
        : budget[config.idField]
    if (!linked) continue
    const item = items.find((entry) => entry.id === (config.listKey ? budget.procurementId : budget[config.idField]))
    if (!item || Number(item.cost || 0) <= 0) {
      budgets.splice(index, 1)
    }
  }
}

export function cleanupMaterialBudgets(materials, budgets) {
  cleanupProcurementBudgets(materials, budgets, {
    idField: 'materialId',
    category: MATERIAL_BUDGET_CATEGORY,
    listKey: null,
  })
}

export function cleanupAllProcurementBudgets(materials, procurementLists, budgets) {
  cleanupMaterialBudgets(materials, budgets)
  PROCUREMENT_CATEGORIES.forEach(({ key }) => {
    cleanupProcurementBudgets(procurementLists[key] || [], budgets, {
      idField: 'procurementId',
      category: key,
      listKey: key,
    })
  })
}

export function findProcurementItemByBudget(budget, state) {
  const source = getProcurementBudgetSource(budget)
  if (!source) return null
  if (source.listKey === null) {
    return state.materials.find((item) => item.id === budget.materialId) || null
  }
  return state.procurementLists[source.listKey]?.find((item) => item.id === budget.procurementId) || null
}

export function getProcurementSyncLabel(budget) {
  const source = getProcurementBudgetSource(budget)
  if (!source) return ''
  if (!source.listKey) return `采购 · ${source.category}`
  const config = getProcurementCategoryConfig(source.listKey)
  return config ? `采购 · ${config.label}` : `采购 · ${source.category}`
}

// 兼容旧引用
export const SOFT_FURNISHING_BUDGET_CATEGORY = '软装'
export const APPLIANCE_BUDGET_CATEGORY = '家电'

export function syncSoftFurnishingBudgets(items, budgets) {
  syncProcurementListBudgets('soft', items, budgets)
}

export function syncApplianceBudgets(items, budgets) {
  syncProcurementListBudgets('appliance', items, budgets)
}
