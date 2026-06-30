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
