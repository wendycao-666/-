import { addDays, formatDate } from './date'

/** 2026年法定节假日（国务院安排） */
const HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
  '2026-10-05', '2026-10-06', '2026-10-07',
])

/** 2026年调休上班日 */
const EXTRA_WORKDAYS_2026 = new Set([
  '2026-01-04', '2026-02-14', '2026-02-28',
  '2026-05-09', '2026-09-20', '2026-10-10',
])

export function isWorkday(dateStr) {
  if (EXTRA_WORKDAYS_2026.has(dateStr)) return true
  if (HOLIDAYS_2026.has(dateStr)) return false
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

export function todayStrSafe() {
  return formatDate(new Date())
}
