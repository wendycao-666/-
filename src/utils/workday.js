import { addDays, formatDate } from './date'
import { isExtraWorkday, isPublicHoliday } from '../constants/chinaPublicHolidays'

/**
 * 是否为施工工作日（工序排期用）
 * 排除周末与法定节假日；调休上班日视为可施工。
 * 未配置年份仅按周末判断。
 */
export function isWorkday(dateStr) {
  if (isExtraWorkday(dateStr)) return true
  if (isPublicHoliday(dateStr)) return false
  const day = new Date(`${dateStr}T12:00:00`).getDay()
  return day !== 0 && day !== 6
}

export function nextWorkday(dateStr) {
  let current = dateStr
  while (!isWorkday(current)) {
    current = addDays(current, 1)
  }
  return current
}

/** 从 startDate 起连续 workdayCount 个工作日，返回结束日期 */
export function calcEndByWorkdays(startDate, workdayCount) {
  let current = nextWorkday(startDate)
  let counted = 0
  while (counted < workdayCount) {
    if (isWorkday(current)) {
      counted += 1
      if (counted === workdayCount) return current
    }
    current = addDays(current, 1)
  }
  return current
}

/** 按 PRD 固定工序顺序，串行计算各工序起止日期 */
export function buildProcessSchedule(startDate, processNames, workdayMap) {
  let cursor = startDate
  return processNames.map((name) => {
    const workdays = workdayMap[name] || 1
    const processStart = nextWorkday(cursor)
    const processEnd = calcEndByWorkdays(processStart, workdays)
    cursor = addDays(processEnd, 1)
    return { name, startDate: processStart, endDate: processEnd }
  })
}

/** 在工序起止范围内，按子项工作日串行排期 */
export function buildSubtaskSchedule(parentStart, subtasks) {
  let cursor = parentStart
  return subtasks.map(({ name, workdays }) => {
    const startDate = nextWorkday(cursor)
    const endDate = calcEndByWorkdays(startDate, workdays)
    cursor = addDays(endDate, 1)
    return { name, startDate, endDate }
  })
}

export function todayStrSafe() {
  return formatDate(new Date())
}

/** 起止日之间（含首尾）的施工工作日数 */
export function countWorkdaysInclusive(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0
  let count = 0
  let current = startDate
  while (current <= endDate) {
    if (isWorkday(current)) count += 1
    current = addDays(current, 1)
  }
  return count
}
