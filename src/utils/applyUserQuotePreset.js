import {
  SEMI_PACKAGE_BUDGET_CATEGORY,
  SEMI_PACKAGE_BUDGET_ITEM,
} from '../constants/index.js'
import { USER_QUOTE_PRESET } from '../constants/userQuotePreset.js'
import { syncAllProcurementBudgets } from './materialBudgetSync.js'

function hasSpend(actual = 0, paid = 0) {
  return Number(actual || 0) > 0 || Number(paid || 0) > 0
}

/** 可写入预估价：无规划价，或已是预估导入项 */
function canFillQuotePrice(item) {
  const unitPrice = Number(item.unitPrice || 0)
  if (item.quoteEstimateRef) return true
  if (unitPrice > 0) return false
  return !hasSpend(item.cost ?? item.actualAmount ?? 0, item.paidAmount)
}

function fillQuotePrice(item, ref) {
  if (!ref || Number(ref.unitPrice || 0) <= 0) return false
  if (!canFillQuotePrice(item)) return false
  item.unitPrice = Number(ref.unitPrice)
  item.quantity = Number(ref.quantity ?? item.quantity ?? 1) || 1
  item.quoteEstimateRef = true
  return true
}

function applySemiPackageQuote(budgets, semiPackage) {
  if (!semiPackage) return 0
  const name = semiPackage.name || SEMI_PACKAGE_BUDGET_ITEM.name
  let budget = budgets.find(
    (b) =>
      b.category === SEMI_PACKAGE_BUDGET_CATEGORY &&
      (b.semiPackageInit || b.name === name)
  )
  if (!budget) {
    budgets.unshift({
      id: crypto.randomUUID(),
      category: SEMI_PACKAGE_BUDGET_CATEGORY,
      name,
      note: semiPackage.note || SEMI_PACKAGE_BUDGET_ITEM.note,
      unitPrice: 0,
      quantity: 1,
      actualAmount: 0,
      paidAmount: 0,
      semiPackageInit: true,
    })
    budget = budgets[0]
  }
  if (Number(semiPackage.unitPrice || 0) <= 0) return 0
  if (!canFillQuotePrice(budget)) return 0
  budget.unitPrice = Number(semiPackage.unitPrice)
  budget.quantity = Number(semiPackage.quantity ?? 1) || 1
  budget.quoteEstimateRef = true
  return 1
}

/** 初始导入截图预估价到采购/主材「规划单价」 */
export function applyUserQuotePreset(state) {
  let filledCount = 0
  filledCount += applySemiPackageQuote(state.budgets, USER_QUOTE_PRESET.semiPackage)

  state.materials = state.materials.map((material) => {
    const next = { ...material }
    const ref = USER_QUOTE_PRESET.materials[material.name]
    if (fillQuotePrice(next, ref)) filledCount += 1
    return next
  })

  const nextLists = {}
  Object.entries(state.procurementLists || {}).forEach(([listKey, items]) => {
    const priceMap = USER_QUOTE_PRESET.procurement[listKey] || {}
    nextLists[listKey] = (items || []).map((item) => {
      const next = { ...item }
      const ref = priceMap[item.name]
      if (fillQuotePrice(next, ref)) filledCount += 1
      return next
    })
  })
  Object.keys(USER_QUOTE_PRESET.procurement).forEach((listKey) => {
    if (!nextLists[listKey]) nextLists[listKey] = state.procurementLists[listKey] || []
  })
  state.procurementLists = nextLists

  syncAllProcurementBudgets(state.materials, state.procurementLists, state.budgets)
  return { filledCount }
}
