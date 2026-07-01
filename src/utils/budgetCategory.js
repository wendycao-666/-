import { calcBudgetItemPlanningAmount } from './calc'

export function getCategoryBudgetUsage(budgets, categoryName) {
  const items = budgets.filter((item) => item.category === categoryName)
  const budgetTotal = items.reduce((sum, item) => sum + calcBudgetItemPlanningAmount(item), 0)
  const paidTotal = items.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
  return {
    budgetTotal,
    paidTotal,
    remaining: budgetTotal - paidTotal,
  }
}
