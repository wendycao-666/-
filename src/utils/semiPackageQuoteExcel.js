import * as XLSX from 'xlsx'
import {
  LABOR_BUDGET_TEMPLATES,
  MISC_BUDGET_TEMPLATES,
  MATERIAL_TEMPLATES,
  PROCUREMENT_CATEGORY_TEMPLATES,
  PROCUREMENT_CATEGORIES,
} from '../constants/index.js'
import { SEMI_PACKAGE_BUDGET_TEMPLATE } from '../constants/semiPackageBudgetTemplate.js'

export const QUOTE_SHEET_HEADERS = ['分类', '项目名称', '归属工序', '规划单价', '数量', '参考单价', '备注']

const CATEGORY_TO_PROCUREMENT_KEY = Object.fromEntries(
  PROCUREMENT_CATEGORIES.map(({ key, budgetCategory }) => [budgetCategory, key])
)

function pickExportPrice(entity, ref) {
  const current = Number(entity?.unitPrice ?? 0)
  if (current > 0) return current
  const reference = Number(ref?.unitPrice ?? ref ?? 0)
  return reference > 0 ? reference : ''
}

function pickReferencePrice(ref) {
  const reference = Number(ref?.unitPrice ?? ref ?? 0)
  return reference > 0 ? reference : ''
}

/** 按当前 App 分类生成报价单行（含全部清单项） */
export function buildQuoteSheetRows(state = null, refTemplate = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  const rows = []

  refTemplate.design.forEach((item) => {
    const budget = state?.budgets?.find((b) => b.category === '设计' && b.name === item.name)
    rows.push({
      category: '设计',
      name: item.name,
      processName: '',
      unitPrice: pickExportPrice(budget, item),
      referencePrice: pickReferencePrice(item),
      quantity: Number(budget?.quantity ?? item.quantity ?? 1) || 1,
      note: budget?.note || item.note || '',
    })
  })

  LABOR_BUDGET_TEMPLATES.forEach((labor) => {
    const ref = refTemplate.labor.find((entry) => entry.processName === labor.processName)
    const budget = state?.budgets?.find(
      (b) => b.category === '人工' && b.processName === labor.processName
    )
    rows.push({
      category: '人工',
      name: labor.name,
      processName: labor.processName,
      unitPrice: pickExportPrice(budget, ref),
      referencePrice: pickReferencePrice(ref),
      quantity: Number(budget?.quantity ?? 1) || 1,
      note: budget?.note || labor.note || '',
    })
  })

  MISC_BUDGET_TEMPLATES.forEach((misc) => {
    const ref = refTemplate.misc.find((entry) => entry.name === misc.name)
    const budget = state?.budgets?.find((b) => b.category === '杂项' && b.name === misc.name)
    rows.push({
      category: '杂项',
      name: misc.name,
      processName: '',
      unitPrice: pickExportPrice(budget, ref),
      referencePrice: pickReferencePrice(ref),
      quantity: Number(budget?.quantity ?? 1) || 1,
      note: budget?.note || misc.note || '',
    })
  })

  MATERIAL_TEMPLATES.forEach((material) => {
    const ref = refTemplate.materials[material.name]
    const saved = state?.materials?.find((entry) => entry.name === material.name)
    rows.push({
      category: '主材',
      name: material.name,
      processName: material.processName || saved?.processName || '',
      unitPrice: pickExportPrice(saved, ref),
      referencePrice: pickReferencePrice(ref),
      quantity: Number(saved?.quantity ?? ref?.quantity ?? 1) || 1,
      note: saved?.note || material.note || '',
    })
  })

  PROCUREMENT_CATEGORIES.forEach(({ key, budgetCategory }) => {
    ;(PROCUREMENT_CATEGORY_TEMPLATES[key] || []).forEach((template) => {
      const ref = refTemplate.procurement[key]?.[template.name]
      const saved = state?.procurementLists?.[key]?.find((entry) => entry.name === template.name)
      rows.push({
        category: budgetCategory,
        name: template.name,
        processName: saved?.processName || '',
        unitPrice: pickExportPrice(saved, ref),
        referencePrice: pickReferencePrice(ref),
        quantity: Number(saved?.quantity ?? ref?.quantity ?? 1) || 1,
        note: saved?.note || template.note || '',
      })
    })
  })

  return rows
}

function buildSheetAoA(rows, refTemplate, { blankPlanning = true, overallBudget = '' } = {}) {
  const aoa = [
    ['半包预算报价单', '', '', '', '', '', ''],
    [
      '填写说明：在「规划单价」「数量」列填入报价后保存，回到 App 导入；已有记账的记录不会被覆盖',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    QUOTE_SHEET_HEADERS,
    ...rows.map((row) => [
      row.category,
      row.name,
      row.processName,
      blankPlanning ? '' : row.unitPrice,
      row.quantity,
      row.referencePrice,
      row.note,
    ]),
    [],
    ['整体规划', '总预算上限', '', overallBudget || refTemplate.overallBudget, 1, '', '可选'],
  ]
  return aoa
}

/** 导出 Excel 报价模版（规划单价留空，参考单价作提示） */
export function exportSemiPackageQuoteTemplate(
  state = null,
  refTemplate = SEMI_PACKAGE_BUDGET_TEMPLATE,
  filename = '半包预算报价模板-100㎡.xlsx'
) {
  const rows = buildQuoteSheetRows(state, refTemplate)
  const sheet = XLSX.utils.aoa_to_sheet(buildSheetAoA(rows, refTemplate, { blankPlanning: true }))
  sheet['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 28 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '半包预算报价')
  XLSX.writeFile(workbook, filename)
}

/** 导出当前已填报价（含规划单价） */
export function exportSemiPackageQuoteFilled(
  state,
  refTemplate = SEMI_PACKAGE_BUDGET_TEMPLATE,
  filename = '半包预算报价-已填写.xlsx'
) {
  const rows = buildQuoteSheetRows(state, refTemplate)
  const sheet = XLSX.utils.aoa_to_sheet(
    buildSheetAoA(rows, refTemplate, {
      blankPlanning: false,
      overallBudget: state?.house?.overallBudget ?? refTemplate.overallBudget,
    })
  )
  sheet['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 28 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '半包预算报价')
  XLSX.writeFile(workbook, filename)
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const num = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(num) ? num : null
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function findHeaderRowIndex(rows) {
  return rows.findIndex(
    (row) => normalizeText(row[0]) === '分类' && normalizeText(row[1]) === '项目名称'
  )
}

/** 解析导入的 Excel 报价单 */
export function parseSemiPackageQuoteFile(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headerIndex = findHeaderRowIndex(rows)
  if (headerIndex < 0) {
    throw new Error('未找到表头行，请使用 App 导出的 Excel 模版')
  }

  const parsedRows = []
  let overallBudget = null
  const errors = []

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] || []
    const category = normalizeText(row[0])
    const name = normalizeText(row[1])
    const processName = normalizeText(row[2])
    const unitPrice = parseNumber(row[3])
    const quantity = parseNumber(row[4])
    const note = normalizeText(row[6])

    if (!category && !name) continue

    if (category === '整体规划') {
      const budget = parseNumber(row[3])
      if (budget !== null && budget > 0) overallBudget = budget
      continue
    }

    if (!category || !name) {
      errors.push(`第 ${index + 1} 行缺少分类或项目名称`)
      continue
    }

    if (unitPrice === null) continue

    parsedRows.push({
      category,
      name,
      processName,
      unitPrice,
      quantity: quantity !== null && quantity > 0 ? quantity : 1,
      note,
    })
  }

  if (!parsedRows.length && overallBudget === null) {
    throw new Error('未读取到有效报价，请检查「规划单价」列是否已填写')
  }

  return { rows: parsedRows, overallBudget, errors }
}

export { CATEGORY_TO_PROCUREMENT_KEY }
