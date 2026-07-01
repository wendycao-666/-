import {
  LABOR_BUDGET_TEMPLATES,
  MISC_BUDGET_TEMPLATES,
  MATERIAL_TEMPLATES,
  PROCUREMENT_CATEGORY_TEMPLATES,
} from './index.js'

/** 半包预算参考模版（100㎡，仅供规划参考，可按实际报价调整） */
export const SEMI_PACKAGE_BUDGET_TEMPLATE = {
  id: 'semi-package-ref-100sqm-v1',
  label: '半包预算参考',
  areaSqm: 100,
  areaHint: '100㎡',
  description:
    '按 100㎡ 半包常见行情估算：人工由施工方负责，主材与采购项由业主自购。仅填充尚未填写的规划单价，不会覆盖已有花费记录。',
  overallBudget: 200000,
  design: [
    {
      name: '设计费',
      note: '100㎡ 全案设计参考，可按面积或固定价议价',
      unitPrice: 5000,
      quantity: 1,
    },
  ],
  labor: [
    { processName: '拆改工程', unitPrice: 6500 },
    { processName: '水电改造', unitPrice: 13000 },
    { processName: '泥瓦工程', unitPrice: 20000 },
    { processName: '木作工程', unitPrice: 15500 },
    { processName: '油漆工程', unitPrice: 10000 },
    { processName: '安装阶段', unitPrice: 6500 },
    { processName: '开荒保洁', unitPrice: 1500 },
  ],
  misc: [
    { name: '拆改', unitPrice: 2200 },
    { name: '水位', unitPrice: 4200 },
    { name: '电', unitPrice: 4600 },
  ],
  materials: {
    墙地砖: { unitPrice: 12000, quantity: 1 },
    室内木门: { unitPrice: 8500, quantity: 1 },
    橱柜洁具: { unitPrice: 5500, quantity: 1 },
  },
  procurement: {
    base: {
      封窗: { unitPrice: 9000, quantity: 1 },
      美缝: { unitPrice: 2800, quantity: 1 },
    },
    custom: {
      全屋定制: { unitPrice: 16000, quantity: 1 },
      餐边柜: { unitPrice: 4500, quantity: 1 },
      电视柜: { unitPrice: 3000, quantity: 1 },
      水吧台: { unitPrice: 2500, quantity: 1 },
    },
    bathroom: {
      浴室盆: { unitPrice: 1800, quantity: 1 },
      浴具: { unitPrice: 2500, quantity: 1 },
      马桶: { unitPrice: 2200, quantity: 1 },
    },
    kitchen: {
      燃气热水器: { unitPrice: 3800, quantity: 1 },
      水槽: { unitPrice: 700, quantity: 1 },
      烟灶: { unitPrice: 4200, quantity: 1 },
      洗碗机: { unitPrice: 3800, quantity: 1 },
      净水器: { unitPrice: 1800, quantity: 1 },
    },
    appliance: {
      平嵌冰箱: { unitPrice: 6500, quantity: 1 },
      风管机: { unitPrice: 8000, quantity: 1 },
      洗衣机: { unitPrice: 2500, quantity: 1 },
      扫地机器人: { unitPrice: 2800, quantity: 1 },
    },
    soft: {
      窗帘: { unitPrice: 3500, quantity: 1 },
    },
  },
}

/** 基准面积（㎡），模版单价均按此面积测算 */
export const SEMI_PACKAGE_BASE_AREA_SQM = 100

/** 不随面积等比放大的项（家电、洁具等按套计） */
const FIXED_QUOTE_ITEM_NAMES = new Set([
  '燃气热水器',
  '水槽',
  '烟灶',
  '洗碗机',
  '净水器',
  '平嵌冰箱',
  '洗衣机',
  '扫地机器人',
  '浴室盆',
  '浴具',
  '马桶',
  '开荒保洁',
])

export function normalizeQuoteAreaSqm(area) {
  const num = Number(String(area ?? '').replace(/[^\d.]/g, ''))
  if (!Number.isFinite(num) || num <= 0) return SEMI_PACKAGE_BASE_AREA_SQM
  return Math.min(300, Math.max(40, Math.round(num)))
}

export function resolveQuoteAreaSqm(houseArea) {
  if (houseArea === undefined || houseArea === null || houseArea === '') {
    return SEMI_PACKAGE_BASE_AREA_SQM
  }
  return normalizeQuoteAreaSqm(houseArea)
}

function scaleUnitPrice(unitPrice, ratio, itemName = '') {
  const base = Number(unitPrice || 0)
  if (!base) return 0
  if (FIXED_QUOTE_ITEM_NAMES.has(itemName)) return base
  return Math.round(base * ratio)
}

function scalePriceMap(priceMap, ratio) {
  return Object.fromEntries(
    Object.entries(priceMap).map(([name, item]) => [
      name,
      {
        ...item,
        unitPrice: scaleUnitPrice(item.unitPrice, ratio, name),
      },
    ])
  )
}

/** 按用户输入面积生成缩放后的半包参考模版 */
export function buildSemiPackageTemplateForArea(
  areaSqm,
  base = SEMI_PACKAGE_BUDGET_TEMPLATE
) {
  const area = normalizeQuoteAreaSqm(areaSqm)
  const ratio = area / (base.areaSqm || SEMI_PACKAGE_BASE_AREA_SQM)

  return {
    ...base,
    areaSqm: area,
    areaHint: `${area}㎡`,
    description: `按 ${area}㎡ 半包常见行情估算：人工由施工方负责，主材与采购项由业主自购。仅填充尚未填写的规划单价，不会覆盖已有花费记录。`,
    overallBudget: Math.round(Number(base.overallBudget || 0) * ratio),
    design: base.design.map((item) => ({
      ...item,
      unitPrice: scaleUnitPrice(item.unitPrice, ratio, item.name),
      note: item.note?.replace(/\d+㎡/, `${area}㎡`) || item.note,
    })),
    labor: base.labor.map((item) => ({
      ...item,
      unitPrice: scaleUnitPrice(item.unitPrice, ratio, item.processName),
    })),
    misc: base.misc.map((item) => ({
      ...item,
      unitPrice: scaleUnitPrice(item.unitPrice, ratio, item.name),
    })),
    materials: scalePriceMap(base.materials, ratio),
    procurement: Object.fromEntries(
      Object.entries(base.procurement).map(([key, group]) => [key, scalePriceMap(group, ratio)])
    ),
  }
}

function sumEntries(entries, pickPrice) {
  return Object.values(entries).reduce((sum, item) => {
    const price = typeof pickPrice === 'function' ? pickPrice(item) : Number(item.unitPrice || 0)
    const qty = Number(item.quantity || 1) || 1
    return sum + price * qty
  }, 0)
}

/** 模版规划合计（用于展示） */
export function calcSemiPackageTemplateTotal(template = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  const designTotal = template.design.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 1),
    0
  )
  const laborTotal = template.labor.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0)
  const miscTotal = template.misc.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0)
  const materialTotal = sumEntries(template.materials)
  const procurementTotal = Object.values(template.procurement).reduce(
    (sum, group) => sum + sumEntries(group),
    0
  )
  return designTotal + laborTotal + miscTotal + materialTotal + procurementTotal
}

/** 按分类汇总，供明细弹窗展示 */
export function getSemiPackageTemplateBreakdown(template = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  const procurementByCategory = {}
  Object.entries(template.procurement).forEach(([listKey, items]) => {
    const label =
      Object.keys(PROCUREMENT_CATEGORY_TEMPLATES).includes(listKey)
        ? listKey
        : listKey
    const categoryLabel =
      {
        base: '基装',
        custom: '定制',
        bathroom: '卫浴洁具',
        kitchen: '厨电',
        appliance: '家电',
        soft: '软装',
      }[listKey] || label
    procurementByCategory[categoryLabel] = sumEntries(items)
  })

  return [
    { category: '设计', amount: template.design.reduce((s, i) => s + i.unitPrice * (i.quantity || 1), 0) },
    { category: '人工', amount: template.labor.reduce((s, i) => s + i.unitPrice, 0) },
    { category: '杂项', amount: template.misc.reduce((s, i) => s + i.unitPrice, 0) },
    { category: '主材', amount: sumEntries(template.materials) },
    ...Object.entries(procurementByCategory).map(([category, amount]) => ({ category, amount })),
  ].filter((row) => row.amount > 0)
}

/** 校验模版与现有清单项名称对齐（开发期自检） */
export function validateSemiPackageTemplateNames(template = SEMI_PACKAGE_BUDGET_TEMPLATE) {
  const laborNames = new Set(LABOR_BUDGET_TEMPLATES.map((i) => i.processName))
  const miscNames = new Set(MISC_BUDGET_TEMPLATES.map((i) => i.name))
  const materialNames = new Set(MATERIAL_TEMPLATES.map((i) => i.name))

  template.labor.forEach((item) => {
    if (!laborNames.has(item.processName)) {
      console.warn('[semiPackageTemplate] unknown labor process:', item.processName)
    }
  })
  template.misc.forEach((item) => {
    if (!miscNames.has(item.name)) {
      console.warn('[semiPackageTemplate] unknown misc item:', item.name)
    }
  })
  Object.keys(template.materials).forEach((name) => {
    if (!materialNames.has(name)) {
      console.warn('[semiPackageTemplate] unknown material:', name)
    }
  })
  Object.entries(template.procurement).forEach(([listKey, items]) => {
    const defaults = PROCUREMENT_CATEGORY_TEMPLATES[listKey] || []
    const defaultNames = new Set(defaults.map((i) => i.name))
    Object.keys(items).forEach((name) => {
      if (!defaultNames.has(name)) {
        console.warn('[semiPackageTemplate] unknown procurement item:', listKey, name)
      }
    })
  })
}
