export const MATERIAL_BUDGET_CATEGORY = '主材'
export const SOFT_FURNISHING_BUDGET_CATEGORY = '软装'
export const APPLIANCE_BUDGET_CATEGORY = '家电'

const PROCUREMENT_CONFIGS = [
  { idField: 'materialId', category: MATERIAL_BUDGET_CATEGORY },
  { idField: 'softFurnishingId', category: SOFT_FURNISHING_BUDGET_CATEGORY },
  { idField: 'applianceId', category: APPLIANCE_BUDGET_CATEGORY },
]

export function getProcurementBudgetSource(budget) {
  if (!budget) return null
  if (budget.materialId) {
    return { idField: 'materialId', category: MATERIAL_BUDGET_CATEGORY, page: '采购' }
  }
  if (budget.softFurnishingId) {
    return { idField: 'softFurnishingId', category: SOFT_FURNISHING_BUDGET_CATEGORY, page: '采购' }
  }
  if (budget.applianceId) {
    return { idField: 'applianceId', category: APPLIANCE_BUDGET_CATEGORY, page: '采购' }
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
  return budgets.find((entry) => entry[config.idField] === item.id)
    || budgets.find(
      (entry) => entry.category === config.category && entry.name === item.name && !entry[config.idField]
    )
}

function normalizeProcurementFields(item, budget) {
  return {
    ...item,
    unitPrice: Number(item.unitPrice ?? budget?.unitPrice ?? 0),
    quantity: Number(item.quantity ?? budget?.quantity ?? 1) || 1,
    cost: Number(item.cost ?? budget?.actualAmount ?? 0),
    paidAmount: Number(item.paidAmount ?? budget?.paidAmount ?? 0),
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
        [config.idField]: item.id,
        category: config.category,
        name: item.name,
        unitPrice: normalized.unitPrice,
        quantity: normalized.quantity,
        actualAmount: normalized.cost,
        paidAmount: normalized.paidAmount,
      })
      return
    }

    budget[config.idField] = item.id
    budget.category = config.category
    budget.name = item.name
    budget.unitPrice = normalized.unitPrice
    budget.quantity = normalized.quantity
    budget.actualAmount = normalized.cost
    budget.paidAmount = normalized.paidAmount
  })
}

export function syncMaterialBudgets(materials, budgets) {
  syncProcurementBudgets(materials, budgets, PROCUREMENT_CONFIGS[0])
}

export function syncSoftFurnishingBudgets(items, budgets) {
  syncProcurementBudgets(items, budgets, PROCUREMENT_CONFIGS[1])
}

export function syncApplianceBudgets(items, budgets) {
  syncProcurementBudgets(items, budgets, PROCUREMENT_CONFIGS[2])
}

export function syncAllProcurementBudgets(materials, softFurnishings, appliances, budgets) {
  syncMaterialBudgets(materials, budgets)
  syncSoftFurnishingBudgets(softFurnishings, budgets)
  syncApplianceBudgets(appliances, budgets)
}

export function findMaterialBudget(budgets, material) {
  return findProcurementBudget(budgets, material, PROCUREMENT_CONFIGS[0])
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
    if (!budget[config.idField]) continue
    const item = items.find((entry) => entry.id === budget[config.idField])
    if (!item || Number(item.cost || 0) <= 0) {
      budgets.splice(index, 1)
    }
  }
}

export function cleanupMaterialBudgets(materials, budgets) {
  cleanupProcurementBudgets(materials, budgets, PROCUREMENT_CONFIGS[0])
}

export function cleanupAllProcurementBudgets(materials, softFurnishings, appliances, budgets) {
  cleanupMaterialBudgets(materials, budgets)
  cleanupProcurementBudgets(softFurnishings, budgets, PROCUREMENT_CONFIGS[1])
  cleanupProcurementBudgets(appliances, budgets, PROCUREMENT_CONFIGS[2])
}

export function findProcurementItemByBudget(budget, state) {
  const source = getProcurementBudgetSource(budget)
  if (!source) return null
  if (source.idField === 'materialId') {
    return state.materials.find((item) => item.id === budget.materialId) || null
  }
  if (source.idField === 'softFurnishingId') {
    return state.softFurnishings.find((item) => item.id === budget.softFurnishingId) || null
  }
  return state.appliances.find((item) => item.id === budget.applianceId) || null
}
