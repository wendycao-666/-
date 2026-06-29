import { ACCEPTANCE_STATUS, WARNING_STATUS } from '../constants'
import { addDays, diffDaysInclusive, todayStr, daysBetween } from './date'

export function calcConstructionDays(startDate, endDate) {
  return diffDaysInclusive(startDate, endDate)
}

export function calcLatestOrderDate(processStartDate, advanceDays) {
  if (!processStartDate) return ''
  return addDays(processStartDate, -advanceDays)
}

export function calcWarningStatus(latestOrderDate, currentDate = todayStr()) {
  if (!latestOrderDate) return WARNING_STATUS.NORMAL
  const remain = daysBetween(currentDate, latestOrderDate)
  if (remain === null) return WARNING_STATUS.NORMAL
  if (remain < 0) return WARNING_STATUS.OVERDUE
  if (remain <= 7) return WARNING_STATUS.EXPIRING
  return WARNING_STATUS.NORMAL
}

export function calcBudgetItemTotal(unitPrice, quantity) {
  return Number(unitPrice || 0) * Number(quantity || 0)
}

/** 预算金额或实际费用任一大于 0 时在预算管理页展示 */
export function isBudgetItemVisible(item) {
  const budget = calcBudgetItemTotal(item.unitPrice, item.quantity)
  const actual = Number(item.actualAmount || 0)
  return budget > 0 || actual > 0
}

export function calcBudgetSummary(budgets) {
  const totalBudget = budgets.reduce(
    (sum, item) => sum + calcBudgetItemTotal(item.unitPrice, item.quantity),
    0
  )
  const totalActual = budgets.reduce((sum, item) => sum + Number(item.actualAmount || 0), 0)
  const totalPaid = budgets.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
  const variance = totalBudget - totalPaid
  return {
    totalBudget,
    totalActual,
    totalPaid,
    variance,
    remaining: totalBudget - totalPaid,
    unpaid: totalBudget - totalPaid,
    isOverBudget: totalPaid > totalBudget,
  }
}

export function calcBudgetItemVariance(item) {
  const budget = calcBudgetItemTotal(item.unitPrice, item.quantity)
  const actual = Number(item.actualAmount || 0)
  const paid = Number(item.paidAmount || 0)
  return {
    budget,
    actual,
    paid,
    variance: budget - paid,
  }
}

export function calcBudgetCategoryStats(budgets, categories) {
  return categories
    .map((category) => ({
      category,
      amount: budgets
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + calcBudgetItemTotal(item.unitPrice, item.quantity), 0),
    }))
    .filter((item) => item.amount > 0)
}

export function calcProgress(processes) {
  const doneCount = processes.filter((p) => p.acceptanceStatus === ACCEPTANCE_STATUS.DONE).length
  const total = processes.length || 7
  return {
    percent: Math.round((doneCount / total) * 100),
    doneCount,
    totalCount: total,
  }
}

export function calcMaterialStats(materials) {
  let overdue = 0
  let expiring = 0
  let normal = 0
  materials.forEach((m) => {
    if (m.warningStatus === WARNING_STATUS.OVERDUE) overdue += 1
    else if (m.warningStatus === WARNING_STATUS.EXPIRING) expiring += 1
    else normal += 1
  })
  return { overdue, expiring, normal }
}

export function refreshMaterialFields(material, processMap) {
  const process = processMap[material.processName]
  const latestOrderDate = calcLatestOrderDate(process?.startDate, material.advanceDays)
  return {
    ...material,
    latestOrderDate,
    warningStatus: calcWarningStatus(latestOrderDate),
  }
}

export function refreshAllMaterials(materials, processes) {
  const processMap = Object.fromEntries(processes.map((p) => [p.name, p]))
  return materials.map((m) => refreshMaterialFields(m, processMap))
}
