import { LABOR_BUDGET_CATEGORY, LABOR_BUDGET_TEMPLATES, OVERALL_BUDGET } from '../constants'
import { SEMI_PACKAGE_BUDGET_TEMPLATE } from '../constants/semiPackageBudgetTemplate.js'
import { syncAllProcurementBudgets } from './materialBudgetSync.js'
import { CATEGORY_TO_PROCUREMENT_KEY } from './semiPackageQuoteExcel.js'

function hasSpend(actual = 0, paid = 0) {
  return Number(actual || 0) > 0 || Number(paid || 0) > 0
}

function isUnsetPlanning(unitPrice, actual = 0, paid = 0) {
  return Number(unitPrice || 0) === 0 && !hasSpend(actual, paid)
}

function matchesRefPrice(unitPrice, ref) {
  return Number(unitPrice || 0) === Number(ref.unitPrice || 0)
}

function shouldTreatAsTemplateRef(entity, ref, actualField = 'actualAmount', paidField = 'paidAmount') {
  const actual = entity[actualField] ?? entity.cost ?? 0
  const paid = entity[paidField] ?? 0
  if (hasSpend(actual, paid)) return false
  return Boolean(entity.semiPackageRef) || matchesRefPrice(entity.unitPrice, ref)
}

function markSemiPackageRef(target) {
  target.semiPackageRef = true
}

function applyDesignReference(budgets, designItems) {
  let filled = 0
  designItems.forEach((item) => {
    const budget = budgets.find((b) => b.category === '设计' && b.name === item.name)
    if (budget) {
      if (isUnsetPlanning(budget.unitPrice, budget.actualAmount, budget.paidAmount)) {
        budget.unitPrice = item.unitPrice
        budget.quantity = item.quantity ?? 1
        budget.note = budget.note || item.note || ''
        markSemiPackageRef(budget)
        filled += 1
      } else if (shouldTreatAsTemplateRef(budget, item)) {
        markSemiPackageRef(budget)
      }
      return
    }
    budgets.push({
      id: crypto.randomUUID(),
      category: '设计',
      name: item.name,
      note: item.note || '',
      unitPrice: item.unitPrice,
      quantity: item.quantity ?? 1,
      actualAmount: 0,
      paidAmount: 0,
      semiPackageRef: true,
    })
    filled += 1
  })
  return filled
}

function applyLaborReference(budgets, laborItems) {
  let filled = 0
  laborItems.forEach((item) => {
    const templateName = LABOR_BUDGET_TEMPLATES.find((t) => t.processName === item.processName)?.name
    const budget = budgets.find(
      (b) =>
        b.category === LABOR_BUDGET_CATEGORY &&
        (b.processName === item.processName || (templateName && b.name === templateName))
    )
    if (!budget) return
    if (isUnsetPlanning(budget.unitPrice, budget.actualAmount, budget.paidAmount)) {
      budget.unitPrice = item.unitPrice
      markSemiPackageRef(budget)
      filled += 1
    } else if (shouldTreatAsTemplateRef(budget, item)) {
      markSemiPackageRef(budget)
    }
  })
  return filled
}

function applyMiscReference(budgets, miscItems) {
  let filled = 0
  miscItems.forEach((item) => {
    const budget = budgets.find((b) => b.category === '杂项' && b.name === item.name)
    if (!budget) return
    if (isUnsetPlanning(budget.unitPrice, budget.actualAmount, budget.paidAmount)) {
      budget.unitPrice = item.unitPrice
      markSemiPackageRef(budget)
      filled += 1
    } else if (shouldTreatAsTemplateRef(budget, item)) {
      markSemiPackageRef(budget)
    }
  })
  return filled
}

function applyMaterialReference(materials, materialPrices) {
  let filled = 0
  materials.forEach((material) => {
    const ref = materialPrices[material.name]
    if (!ref) return
    if (isUnsetPlanning(material.unitPrice, material.cost, material.paidAmount)) {
      material.unitPrice = ref.unitPrice
      material.quantity = ref.quantity ?? material.quantity ?? 1
      markSemiPackageRef(material)
      filled += 1
    } else if (shouldTreatAsTemplateRef(material, ref, 'cost', 'paidAmount')) {
      markSemiPackageRef(material)
    }
  })
  return filled
}

function applyProcurementReference(procurementLists, procurementPrices) {
  let filled = 0
  Object.entries(procurementPrices).forEach(([listKey, priceMap]) => {
    const items = procurementLists[listKey] || []
    items.forEach((item) => {
      const ref = priceMap[item.name]
      if (!ref) return
      if (isUnsetPlanning(item.unitPrice, item.cost, item.paidAmount)) {
        item.unitPrice = ref.unitPrice
        item.quantity = ref.quantity ?? item.quantity ?? 1
        markSemiPackageRef(item)
        filled += 1
      } else if (shouldTreatAsTemplateRef(item, ref, 'cost', 'paidAmount')) {
        markSemiPackageRef(item)
      }
    })
  })
  return filled
}

function clearDesignReference(budgets, designItems) {
  let cleared = 0
  for (let index = budgets.length - 1; index >= 0; index -= 1) {
    const budget = budgets[index]
    if (budget.category !== '设计') continue
    const ref = designItems.find((item) => item.name === budget.name)
    if (!ref || !shouldTreatAsTemplateRef(budget, ref)) continue
    budgets.splice(index, 1)
    cleared += 1
  }
  return cleared
}

function clearLaborReference(budgets, laborItems) {
  let cleared = 0
  laborItems.forEach((item) => {
    const templateName = LABOR_BUDGET_TEMPLATES.find((t) => t.processName === item.processName)?.name
    const budget = budgets.find(
      (b) =>
        b.category === LABOR_BUDGET_CATEGORY &&
        (b.processName === item.processName || (templateName && b.name === templateName))
    )
    if (!budget || !shouldTreatAsTemplateRef(budget, item)) return
    budget.unitPrice = 0
    delete budget.semiPackageRef
    cleared += 1
  })
  return cleared
}

function clearMiscReference(budgets, miscItems) {
  let cleared = 0
  miscItems.forEach((item) => {
    const budget = budgets.find((b) => b.category === '杂项' && b.name === item.name)
    if (!budget || !shouldTreatAsTemplateRef(budget, item)) return
    budget.unitPrice = 0
    delete budget.semiPackageRef
    cleared += 1
  })
  return cleared
}

function clearMaterialReference(materials, materialPrices) {
  let cleared = 0
  materials.forEach((material) => {
    const ref = materialPrices[material.name]
    if (!ref || !shouldTreatAsTemplateRef(material, ref, 'cost', 'paidAmount')) return
    material.unitPrice = 0
    delete material.semiPackageRef
    cleared += 1
  })
  return cleared
}

function clearProcurementReference(procurementLists, procurementPrices) {
  let cleared = 0
  Object.entries(procurementPrices).forEach(([listKey, priceMap]) => {
    const items = procurementLists[listKey] || []
    items.forEach((item) => {
      const ref = priceMap[item.name]
      if (!ref || !shouldTreatAsTemplateRef(item, ref, 'cost', 'paidAmount')) return
      item.unitPrice = 0
      delete item.semiPackageRef
      cleared += 1
    })
  })
  return cleared
}

function countClearableDesign(budgets, designItems) {
  return designItems.filter((ref) => {
    const budget = budgets.find((b) => b.category === '设计' && b.name === ref.name)
    return budget && shouldTreatAsTemplateRef(budget, ref)
  }).length
}

function countClearableLabor(budgets, laborItems) {
  return laborItems.filter((item) => {
    const templateName = LABOR_BUDGET_TEMPLATES.find((t) => t.processName === item.processName)?.name
    const budget = budgets.find(
      (b) =>
        b.category === LABOR_BUDGET_CATEGORY &&
        (b.processName === item.processName || (templateName && b.name === templateName))
    )
    return budget && shouldTreatAsTemplateRef(budget, item)
  }).length
}

function countClearableMisc(budgets, miscItems) {
  return miscItems.filter((item) => {
    const budget = budgets.find((b) => b.category === '杂项' && b.name === item.name)
    return budget && shouldTreatAsTemplateRef(budget, item)
  }).length
}

function countClearableMaterials(materials, materialPrices) {
  return materials.filter((material) => {
    const ref = materialPrices[material.name]
    return ref && shouldTreatAsTemplateRef(material, ref, 'cost', 'paidAmount')
  }).length
}

function countClearableProcurement(procurementLists, procurementPrices) {
  let count = 0
  Object.entries(procurementPrices).forEach(([listKey, priceMap]) => {
    const items = procurementLists[listKey] || []
    items.forEach((item) => {
      const ref = priceMap[item.name]
      if (ref && shouldTreatAsTemplateRef(item, ref, 'cost', 'paidAmount')) count += 1
    })
  })
  return count
}

/** 是否仍有可清除的参考价 */
export function hasSemiPackageReference(state, template = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  if (state.house?.semiPackageOverallRef) return true
  return countClearableSemiPackageRefs(state, template) > 0
}

/** 统计可清除的参考价项数 */
export function countClearableSemiPackageRefs(state, template = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  let count = 0
  if (state.house?.semiPackageOverallRef) count += 1
  count += countClearableDesign(state.budgets, template.design)
  count += countClearableLabor(state.budgets, template.labor)
  count += countClearableMisc(state.budgets, template.misc)
  count += countClearableMaterials(state.materials, template.materials)
  count += countClearableProcurement(state.procurementLists, template.procurement)
  return count
}

/** 将半包参考价填入当前项目（仅空白项） */
export function applySemiPackageBudgetTemplate(
  state,
  template = SEMI_PACKAGE_BUDGET_TEMPLATE,
  { updateOverallBudget = true } = {}
) {
  let filledCount = 0
  let overallBudgetUpdated = false

  if (updateOverallBudget && template.overallBudget) {
    if (!state.house.semiPackageOverallRef) {
      state.house.overallBudgetBeforeSemiRef = Number(state.house.overallBudget) || OVERALL_BUDGET
    }
    state.house.overallBudget = template.overallBudget
    state.house.semiPackageOverallRef = true
    overallBudgetUpdated = true
  }

  filledCount += applyDesignReference(state.budgets, template.design)
  filledCount += applyLaborReference(state.budgets, template.labor)
  filledCount += applyMiscReference(state.budgets, template.misc)
  filledCount += applyMaterialReference(state.materials, template.materials)
  filledCount += applyProcurementReference(state.procurementLists, template.procurement)

  syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
  propagateSemiPackageRefToBudgets(state)

  return { filledCount, overallBudgetUpdated }
}

/** 同步采购/主材标记到预算明细，便于识别与清除 */
function propagateSemiPackageRefToBudgets(state) {
  state.budgets.forEach((budget) => {
    if (budget.materialId) {
      const material = state.materials.find((item) => item.id === budget.materialId)
      if (material?.semiPackageRef) budget.semiPackageRef = true
      else delete budget.semiPackageRef
      return
    }
    if (budget.procurementKey && budget.procurementId) {
      const item = state.procurementLists[budget.procurementKey]?.find(
        (entry) => entry.id === budget.procurementId
      )
      if (item?.semiPackageRef) budget.semiPackageRef = true
      else delete budget.semiPackageRef
    }
  })
}

/** 从 Excel 报价行导入半包预算（不含已记账项） */
export function applyQuoteImportFromRows(state, { rows = [], overallBudget = null } = {}) {
  let importedCount = 0
  let skippedCount = 0

  if (overallBudget !== null && overallBudget > 0) {
    if (!state.house.semiPackageOverallRef) {
      state.house.overallBudgetBeforeSemiRef = Number(state.house.overallBudget) || OVERALL_BUDGET
    }
    state.house.overallBudget = overallBudget
    state.house.semiPackageOverallRef = true
    importedCount += 1
  }

  rows.forEach((row) => {
    const result = applyQuoteRow(state, row)
    if (result === 'imported') importedCount += 1
    else if (result === 'skipped') skippedCount += 1
  })

  syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
  propagateSemiPackageRefToBudgets(state)

  return { importedCount, skippedCount }
}

function applyQuoteRow(state, row) {
  if (row.unitPrice === null || row.unitPrice === undefined) return 'ignored'

  if (row.category === '设计') {
    return applyQuoteToDesign(state.budgets, row)
  }
  if (row.category === '人工') {
    return applyQuoteToLabor(state.budgets, row)
  }
  if (row.category === '杂项') {
    return applyQuoteToMisc(state.budgets, row)
  }
  if (row.category === '主材') {
    return applyQuoteToMaterial(state.materials, row)
  }
  return applyQuoteToProcurement(state.procurementLists, row)
}

function applyQuoteToDesign(budgets, row) {
  let budget = budgets.find((b) => b.category === '设计' && b.name === row.name)
  if (budget) {
    if (hasSpend(budget.actualAmount, budget.paidAmount)) return 'skipped'
    budget.unitPrice = row.unitPrice
    budget.quantity = row.quantity
    if (row.note) budget.note = row.note
    markSemiPackageRef(budget)
    return 'imported'
  }
  budgets.push({
    id: crypto.randomUUID(),
    category: '设计',
    name: row.name,
    note: row.note || '',
    unitPrice: row.unitPrice,
    quantity: row.quantity,
    actualAmount: 0,
    paidAmount: 0,
    semiPackageRef: true,
  })
  return 'imported'
}

function applyQuoteToLabor(budgets, row) {
  const templateName = LABOR_BUDGET_TEMPLATES.find((t) => t.processName === row.processName)?.name
  const budget = budgets.find(
    (b) =>
      b.category === LABOR_BUDGET_CATEGORY &&
      (b.processName === row.processName ||
        b.name === row.name ||
        (templateName && b.name === templateName))
  )
  if (!budget) return 'ignored'
  if (hasSpend(budget.actualAmount, budget.paidAmount)) return 'skipped'
  budget.unitPrice = row.unitPrice
  budget.quantity = row.quantity
  if (row.note) budget.note = row.note
  markSemiPackageRef(budget)
  return 'imported'
}

function applyQuoteToMisc(budgets, row) {
  const budget = budgets.find((b) => b.category === '杂项' && b.name === row.name)
  if (!budget) return 'ignored'
  if (hasSpend(budget.actualAmount, budget.paidAmount)) return 'skipped'
  budget.unitPrice = row.unitPrice
  budget.quantity = row.quantity
  if (row.note) budget.note = row.note
  markSemiPackageRef(budget)
  return 'imported'
}

function applyQuoteToMaterial(materials, row) {
  const material = materials.find((entry) => entry.name === row.name)
  if (!material) return 'ignored'
  if (hasSpend(material.cost, material.paidAmount)) return 'skipped'
  material.unitPrice = row.unitPrice
  material.quantity = row.quantity
  if (row.note) material.note = row.note
  markSemiPackageRef(material)
  return 'imported'
}

function applyQuoteToProcurement(procurementLists, row) {
  const listKey = CATEGORY_TO_PROCUREMENT_KEY[row.category]
  if (!listKey) return 'ignored'
  const item = procurementLists[listKey]?.find((entry) => entry.name === row.name)
  if (!item) return 'ignored'
  if (hasSpend(item.cost, item.paidAmount)) return 'skipped'
  item.unitPrice = row.unitPrice
  item.quantity = row.quantity
  if (row.note) item.note = row.note
  markSemiPackageRef(item)
  return 'imported'
}

/** 清除由参考模版填入的规划单价（不含已记账项） */
export function clearSemiPackageBudgetTemplate(state, template = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  let clearedCount = 0

  if (state.house.semiPackageOverallRef) {
    state.house.overallBudget =
      Number(state.house.overallBudgetBeforeSemiRef) || OVERALL_BUDGET
    delete state.house.semiPackageOverallRef
    delete state.house.overallBudgetBeforeSemiRef
    clearedCount += 1
  }

  clearedCount += clearDesignReference(state.budgets, template.design)
  clearedCount += clearLaborReference(state.budgets, template.labor)
  clearedCount += clearMiscReference(state.budgets, template.misc)
  clearedCount += clearMaterialReference(state.materials, template.materials)
  clearedCount += clearProcurementReference(state.procurementLists, template.procurement)

  syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)

  return { clearedCount }
}
