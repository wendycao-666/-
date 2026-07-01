/** 整数部分超过 4 位（≥1 万）时按 w（万）展示，保留完整小数精度 */
const WAN_THRESHOLD = 10000

function countDecimals(val) {
  const str = String(val ?? '')
  const dot = str.indexOf('.')
  return dot === -1 ? 0 : str.length - dot - 1
}

function stripTrailingZeros(numStr) {
  if (!numStr.includes('.')) return numStr
  return numStr.replace(/\.?0+$/, '')
}

function formatPlain(abs, val) {
  const decimals = countDecimals(val)
  if (decimals > 0) return stripTrailingZeros(abs.toFixed(decimals))
  return stripTrailingZeros(String(abs))
}

export function formatMoney(val) {
  const num = Number(val || 0)
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (abs >= WAN_THRESHOLD) {
    const w = abs / 10000
    const wText = stripTrailingZeros(w.toFixed(countDecimals(val) + 4))
    return `${sign}${wText}w`
  }

  return `${sign}${formatPlain(abs, val)}`
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
