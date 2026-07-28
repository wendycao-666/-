/** 金额展示：≥1 万用 w，统一保留 2 位小数 */
const WAN_THRESHOLD = 10000

export function formatMoney(val) {
  const num = Number(val || 0)
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (abs >= WAN_THRESHOLD) {
    return `${sign}${(abs / 10000).toFixed(2)}w`
  }

  if (abs % 1 !== 0) {
    return `${sign}${abs.toFixed(2)}`
  }

  return `${sign}${String(Math.round(abs))}`
}

export function formatVariance(val) {
  const num = Number(val || 0)
  if (num === 0) return '¥ 0'
  const prefix = num > 0 ? '+' : '-'
  return `${prefix}¥ ${formatMoney(Math.abs(num))}`
}

/** 业主视角：规划金额 vs 已付后的结余表述 */
export function formatBudgetBalance(val) {
  const num = Number(val || 0)
  if (num > 0) return `还能花 ¥ ${formatMoney(num)}`
  if (num < 0) return `已超 ¥ ${formatMoney(Math.abs(num))}`
  return '刚好花完'
}

export function budgetBalanceHint(val) {
  const num = Number(val || 0)
  if (num > 0) return '在规划范围内'
  if (num < 0) return '建议核对这类支出'
  return '与规划一致'
}

export function formatOverBudgetMessage(paid, budget, categoryName = '') {
  const over = Number(paid || 0) - Number(budget || 0)
  if (over <= 0) return ''
  const prefix = categoryName ? `${categoryName}已超支，` : '比规划多花了 '
  return `${prefix}¥ ${formatMoney(over)}`
}
