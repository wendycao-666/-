/**
 * 中国大陆法定节假日放假日与调休上班日（国务院安排）
 * 用于工序排期：周末与放假日不可施工，调休上班日可施工。
 * 2027 年依据《放假办法》及农历推算，正式通知发布后请核对更新。
 */

/** @typedef {{ holidays: string[], extraWorkdays: string[] }} YearHolidayConfig */

/** @type {Record<number, YearHolidayConfig>} */
export const CHINA_PUBLIC_HOLIDAYS_BY_YEAR = {
  2026: {
    holidays: [
      '2026-01-01', '2026-01-02', '2026-01-03',
      '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
      '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
      '2026-04-04', '2026-04-05', '2026-04-06',
      '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
      '2026-06-19', '2026-06-20', '2026-06-21',
      '2026-09-25', '2026-09-26', '2026-09-27',
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
      '2026-10-05', '2026-10-06', '2026-10-07',
    ],
    extraWorkdays: [
      '2026-01-04', '2026-02-14', '2026-02-28',
      '2026-05-09', '2026-09-20', '2026-10-10',
    ],
  },
  2027: {
    holidays: [
      '2027-01-01', '2027-01-02', '2027-01-03',
      '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09',
      '2027-02-10', '2027-02-11', '2027-02-12', '2027-02-13',
      '2027-04-04', '2027-04-05', '2027-04-06',
      '2027-05-01', '2027-05-02', '2027-05-03', '2027-05-04', '2027-05-05',
      '2027-06-09',
      '2027-09-15',
      '2027-10-01', '2027-10-02', '2027-10-03', '2027-10-04',
      '2027-10-05', '2027-10-06', '2027-10-07',
    ],
    extraWorkdays: [
      '2027-01-04', '2027-02-04', '2027-02-20',
      '2027-04-30', '2027-05-06',
      '2027-09-26', '2027-10-09',
    ],
  },
}

const holidaySetCache = new Map()
const extraWorkdaySetCache = new Map()

function getHolidaySet(year) {
  if (!holidaySetCache.has(year)) {
    const config = CHINA_PUBLIC_HOLIDAYS_BY_YEAR[year]
    holidaySetCache.set(year, new Set(config?.holidays || []))
  }
  return holidaySetCache.get(year)
}

function getExtraWorkdaySet(year) {
  if (!extraWorkdaySetCache.has(year)) {
    const config = CHINA_PUBLIC_HOLIDAYS_BY_YEAR[year]
    extraWorkdaySetCache.set(year, new Set(config?.extraWorkdays || []))
  }
  return extraWorkdaySetCache.get(year)
}

/** 是否为国务院安排的放假日（含调休形成的连休） */
export function isPublicHoliday(dateStr) {
  const year = Number(String(dateStr).slice(0, 4))
  return getHolidaySet(year).has(dateStr)
}

/** 是否为调休上班日（本为周末但需上班） */
export function isExtraWorkday(dateStr) {
  const year = Number(String(dateStr).slice(0, 4))
  return getExtraWorkdaySet(year).has(dateStr)
}
