import { ACCEPTANCE_STATUS, WARNING_STATUS, OVERALL_BUDGET, LABOR_BUDGET_CATEGORY } from '../constants'
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

export function isLaborBudgetItem(item) {
  return item?.category === LABOR_BUDGET_CATEGORY
}

/** 计入明细总预算的计划金额 */
export function calcBudgetItemPlanningAmount(item) {
  return calcBudgetItemTotal(item.unitPrice, item.quantity)
}

export function calcBudgetItemTotal(unitPrice, quantity) {
  return Number(unitPrice || 0) * Number(quantity || 0)
}

/** 预算金额或实际费用大于 0，或杂项/人工默认项时在预算管理页展示 */
export function isBudgetItemVisible(item) {
  if (item.miscInit || item.laborInit) return true
  const budget = calcBudgetItemPlanningAmount(item)
  const actual = Number(item.actualAmount || 0)
  return budget > 0 || actual > 0
}

export function calcBudgetSummary(budgets, overallBudget = OVERALL_BUDGET) {
  const totalBudget = budgets.reduce((sum, item) => sum + calcBudgetItemPlanningAmount(item), 0)
  const totalActual = budgets.reduce((sum, item) => sum + Number(item.actualAmount || 0), 0)
  const totalPaid = budgets.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
  const variance = totalBudget - totalPaid
  const overallRemaining = overallBudget - totalPaid
  return {
    totalBudget,
    totalActual,
    totalPaid,
    variance,
    remaining: totalBudget - totalPaid,
    unpaid: totalBudget - totalPaid,
    overallBudget,
    overallRemaining,
    isOverBudget: totalPaid > totalBudget,
    isOverOverallBudget: totalPaid > overallBudget,
  }
}

export function calcBudgetItemVariance(item) {
  const budget = calcBudgetItemPlanningAmount(item)
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
        .reduce((sum, item) => sum + calcBudgetItemPlanningAmount(item), 0),
    }))
    .filter((item) => item.amount > 0)
}

/** 单项实际支出：优先已支付，否则取实际费用 */
export function getBudgetItemActualSpend(item) {
  const paid = Number(item.paidAmount || 0)
  if (paid > 0) return paid
  return Number(item.actualAmount || 0)
}

/** 分类实际支出统计（用于占比图） */
export function calcBudgetCategoryActualStats(budgets, categories) {
  return categories
    .map((category) => ({
      category,
      amount: budgets
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + getBudgetItemActualSpend(item), 0),
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

export function getCurrentProcessInfo(processes, today = todayStr()) {
  if (!processes.length) {
    return {
      phase: 'pending',
      phaseLabel: '待开工',
      tagType: 'info',
      process: null,
      processName: '-',
      dateRange: '',
      days: 0,
      hint: '暂无工序数据',
    }
  }

  const sorted = [...processes].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const inProgress = sorted.find(
    (process) => process.startDate && process.endDate && today >= process.startDate && today <= process.endDate
  )

  if (inProgress) {
    const days = calcConstructionDays(inProgress.startDate, inProgress.endDate)
    const accepted = inProgress.acceptanceStatus === ACCEPTANCE_STATUS.DONE
    return {
      phase: 'active',
      phaseLabel: accepted ? '当前阶段已验收' : '进行中',
      tagType: accepted ? 'success' : 'primary',
      process: inProgress,
      processName: inProgress.name,
      dateRange: `${inProgress.startDate} ~ ${inProgress.endDate}`,
      days,
      hint: `今天 ${today}，当前处于 ${inProgress.name}`,
    }
  }

  if (today < first.startDate) {
    const days = calcConstructionDays(first.startDate, first.endDate)
    return {
      phase: 'pending',
      phaseLabel: '待开工',
      tagType: 'warning',
      process: first,
      processName: first.name,
      dateRange: `${first.startDate} ~ ${first.endDate}`,
      days,
      hint: `今天 ${today}，首期工序 ${first.startDate} 开工`,
    }
  }

  if (today > last.endDate) {
    const days = calcConstructionDays(last.startDate, last.endDate)
    return {
      phase: 'finished',
      phaseLabel: '已全部结束',
      tagType: 'success',
      process: last,
      processName: last.name,
      dateRange: `${last.startDate} ~ ${last.endDate}`,
      days,
      hint: `今天 ${today}，全部工序已于 ${last.endDate} 结束`,
    }
  }

  const upcoming = sorted.find((process) => process.startDate > today)
  const nextProcess = upcoming || last
  const days = calcConstructionDays(nextProcess.startDate, nextProcess.endDate)
  return {
    phase: 'upcoming',
    phaseLabel: '即将开始',
    tagType: 'info',
    process: nextProcess,
    processName: nextProcess.name,
    dateRange: `${nextProcess.startDate} ~ ${nextProcess.endDate}`,
    days,
    hint: `今天 ${today}，下一道工序 ${nextProcess.name} ${nextProcess.startDate} 开工`,
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

export function refreshAllProcurementLists(procurementLists, processes) {
  const processMap = Object.fromEntries(processes.map((p) => [p.name, p]))
  return Object.fromEntries(
    Object.entries(procurementLists).map(([key, items]) => [
      key,
      items.map((item) => {
        if (!item.processName) {
          return { ...item, latestOrderDate: '', warningStatus: WARNING_STATUS.NORMAL }
        }
        return refreshMaterialFields(item, processMap)
      }),
    ])
  )
}
