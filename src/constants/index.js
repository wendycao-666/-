export const STORAGE_KEY = 'decoration_tool_data'

/** 排期版本：变更后自动刷新工序默认日期 */
export const SCHEDULE_VERSION = 2

/** 数据结构版本：升级后自动补全采购等字段并写回本地/云端 */
export const DATA_VERSION = 8

/** 计划开工日 */
export const PROJECT_START_DATE = '2026-07-13'

/** 各工序施工工作日（不含周末与法定节假日） */
export const PROCESS_WORKDAYS = {
  拆改工程: 3,
  水电改造: 12,
  泥瓦工程: 20,
  木作工程: 16,
  油漆工程: 31,
  安装阶段: 7,
  开荒保洁: 3,
}

export const COLORS = {
  primary: '#409EFF',
  success: '#67C23A',
  warning: '#E6A23C',
  danger: '#F56C6C',
  info: '#909399',
}

export const PROCESS_NAMES = [
  '拆改工程',
  '水电改造',
  '泥瓦工程',
  '木作工程',
  '油漆工程',
  '安装阶段',
  '开荒保洁',
]

/** 甘特图工序配色（一级深色、二级浅色） */
export const PROCESS_GANTT_COLORS = {
  拆改工程: { main: '#409EFF', light: '#79bbff' },
  水电改造: { main: '#67C23A', light: '#95d475' },
  泥瓦工程: { main: '#E6A23C', light: '#eebe77' },
  木作工程: { main: '#9C27B0', light: '#CE93D8' },
  油漆工程: { main: '#F56C6C', light: '#fab6b6' },
  安装阶段: { main: '#00BCD4', light: '#80deea' },
  开荒保洁: { main: '#909399', light: '#c8c9cc' },
}

/** 工序子项（甘特图二级展示，工作日之和等于对应工序） */
export const PROCESS_SUBTASKS = {
  拆改工程: [
    { name: '墙体拆除', workdays: 1 },
    { name: '新建墙体', workdays: 1 },
    { name: '垃圾清运', workdays: 1 },
  ],
  水电改造: [
    { name: '开槽布线', workdays: 4 },
    { name: '水路改造', workdays: 5 },
    { name: '打压验收', workdays: 3 },
  ],
  泥瓦工程: [
    { name: '防水施工', workdays: 5 },
    { name: '墙地砖铺贴', workdays: 10 },
    { name: '找平补缝', workdays: 5 },
  ],
  木作工程: [
    { name: '吊顶施工', workdays: 5 },
    { name: '柜体制作', workdays: 8 },
    { name: '门套基层', workdays: 3 },
  ],
  油漆工程: [
    { name: '批刮腻子', workdays: 10 },
    { name: '底漆施工', workdays: 10 },
    { name: '面漆涂刷', workdays: 11 },
  ],
  安装阶段: [
    { name: '室内木门', workdays: 2 },
    { name: '橱柜洁具', workdays: 3 },
    { name: '开关灯具', workdays: 2 },
  ],
  开荒保洁: [
    { name: '精细保洁', workdays: 1 },
    { name: '竣工验收', workdays: 2 },
  ],
}

/** 半包模式：以下为辅材，由施工方提供，不在采购台账展示 */
export const SEMI_PACKAGE_AUXILIARY_MATERIALS = ['水管管件', '电线底盒', '板材五金']

/** 主材模板（半包：仅业主自购主材，不含辅材） */
export const MATERIAL_TEMPLATES = [
  { name: '墙地砖', processName: '泥瓦工程', advanceDays: 15 },
  { name: '室内木门', processName: '安装阶段', advanceDays: 45 },
  { name: '橱柜洁具', processName: '安装阶段', advanceDays: 30 },
]

/** 采购台账分类 Tab（统一按品类划分，非空间维度） */
export const PROCUREMENT_CATEGORIES = [
  { key: 'base', label: '基装', budgetCategory: '基装' },
  { key: 'custom', label: '定制', budgetCategory: '定制' },
  { key: 'bathroom', label: '卫浴洁具', budgetCategory: '卫浴洁具' },
  { key: 'kitchen', label: '厨电', budgetCategory: '厨电' },
  { key: 'appliance', label: '家电', budgetCategory: '家电' },
  { key: 'soft', label: '软装', budgetCategory: '软装' },
]

/** 非采购项：在预算「杂项」中初始化（施工/服务类，无需下单跟踪） */
export const MISC_BUDGET_TEMPLATES = [
  { name: '拆改', note: '墙皮铲除，厨卫铲到红砖' },
  { name: '水位', note: '' },
  { name: '电', note: '普通照明2.5，大功率4平，电箱留足回路' },
]

/** 各分类采购项目模板（含注意事项，数组顺序即进场顺序） */
export const PROCUREMENT_CATEGORY_TEMPLATES = {
  base: [
    { name: '封窗', note: '' },
    { name: '瓷砖', note: '全屋通铺，需对接全屋排砖图' },
    { name: '美缝', note: '木纹砖，水性环氧彩砂平缝' },
  ],
  custom: [
    { name: '全屋定制', note: '需要找商家要样品，颜色与整体统一' },
    { name: '橱柜', note: '做高低台 83、93' },
    { name: '餐边柜', note: '' },
    { name: '电视柜', note: '需要预留电视尺寸' },
    { name: '水吧台', note: '' },
  ],
  bathroom: [
    { name: '浴室盆', note: '陶瓷一体盆' },
    { name: '浴具', note: '枪灰色' },
    { name: '马桶', note: '轻智能马桶，需座圈加热' },
  ],
  kitchen: [
    { name: '燃气热水器', note: '零冷水，需冷凝管' },
    { name: '水槽', note: '大单槽就够了' },
    { name: '烟灶', note: '' },
    { name: '洗碗机', note: '需带烘干、消毒功能' },
    { name: '净水器', note: '' },
  ],
  appliance: [
    { name: '平嵌冰箱', note: '平嵌深度605，需要了解宽高' },
    { name: '风管机', note: '出风口需要加宽' },
    { name: '洗衣机', note: '预留尺寸625*600*865' },
    { name: '扫地机器人', note: '' },
  ],
  soft: [{ name: '窗帘', note: '' }],
}

/** 各采购项下单时间规则（归属工序 + 提前天数，用于最晚下单与三色预警） */
export const PROCUREMENT_ORDER_RULES = {
  封窗: { processName: '水电改造', advanceDays: 14 },
  瓷砖: { processName: '泥瓦工程', advanceDays: 15 },
  美缝: { processName: '泥瓦工程', advanceDays: 8 },
  全屋定制: { processName: '木作工程', advanceDays: 25 },
  橱柜: { processName: '安装阶段', advanceDays: 30 },
  餐边柜: { processName: '安装阶段', advanceDays: 25 },
  电视柜: { processName: '安装阶段', advanceDays: 25 },
  水吧台: { processName: '安装阶段', advanceDays: 25 },
  燃气热水器: { processName: '水电改造', advanceDays: 10 },
  水槽: { processName: '安装阶段', advanceDays: 14 },
  烟灶: { processName: '安装阶段', advanceDays: 14 },
  洗碗机: { processName: '安装阶段', advanceDays: 14 },
  净水器: { processName: '安装阶段', advanceDays: 14 },
  平嵌冰箱: { processName: '安装阶段', advanceDays: 21 },
  风管机: { processName: '木作工程', advanceDays: 14 },
  洗衣机: { processName: '安装阶段', advanceDays: 14 },
  扫地机器人: { processName: '安装阶段', advanceDays: 7 },
  浴室盆: { processName: '安装阶段', advanceDays: 21 },
  浴具: { processName: '安装阶段', advanceDays: 21 },
  马桶: { processName: '安装阶段', advanceDays: 21 },
  窗帘: { processName: '安装阶段', advanceDays: 7 },
}

/**
 * 采购进场顺序（跨主材与各分类，对齐 7 道工序）
 * type: material | procurement
 */
export const PROCUREMENT_ENTRY_SEQUENCE = [
  { phase: '水电', type: 'procurement', listKey: 'base', name: '封窗' },
  { phase: '泥瓦', type: 'material', name: '墙地砖' },
  { phase: '泥瓦', type: 'procurement', listKey: 'base', name: '瓷砖' },
  { phase: '泥瓦', type: 'procurement', listKey: 'base', name: '美缝' },
  { phase: '木作', type: 'procurement', listKey: 'custom', name: '全屋定制' },
  { phase: '木作', type: 'procurement', listKey: 'appliance', name: '风管机' },
  { phase: '安装', type: 'material', name: '室内木门' },
  { phase: '安装', type: 'material', name: '橱柜洁具' },
  { phase: '安装', type: 'procurement', listKey: 'custom', name: '橱柜' },
  { phase: '安装', type: 'procurement', listKey: 'custom', name: '餐边柜' },
  { phase: '安装', type: 'procurement', listKey: 'custom', name: '电视柜' },
  { phase: '安装', type: 'procurement', listKey: 'custom', name: '水吧台' },
  { phase: '厨电', type: 'procurement', listKey: 'kitchen', name: '燃气热水器' },
  { phase: '厨电', type: 'procurement', listKey: 'kitchen', name: '水槽' },
  { phase: '厨电', type: 'procurement', listKey: 'kitchen', name: '烟灶' },
  { phase: '厨电', type: 'procurement', listKey: 'kitchen', name: '洗碗机' },
  { phase: '厨电', type: 'procurement', listKey: 'kitchen', name: '净水器' },
  { phase: '家电', type: 'procurement', listKey: 'appliance', name: '平嵌冰箱' },
  { phase: '卫浴洁具', type: 'procurement', listKey: 'bathroom', name: '浴室盆' },
  { phase: '卫浴洁具', type: 'procurement', listKey: 'bathroom', name: '浴具' },
  { phase: '卫浴洁具', type: 'procurement', listKey: 'bathroom', name: '马桶' },
  { phase: '家电', type: 'procurement', listKey: 'appliance', name: '扫地机器人' },
  { phase: '家电', type: 'procurement', listKey: 'appliance', name: '洗衣机' },
  { phase: '软装', type: 'procurement', listKey: 'soft', name: '窗帘' },
]

export const ACCEPTANCE_STATUS = {
  NONE: '未验收',
  FAIL: '验收不合格',
  DONE: '已验收',
}

export const PURCHASE_STATUS = {
  PENDING: '待下单',
  ORDERED: '已下单',
  ARRIVED: '已到货',
}

export const WARNING_STATUS = {
  NORMAL: '正常',
  EXPIRING: '即将到期',
  OVERDUE: '已逾期',
}

export const ACCEPTANCE_RESULT = {
  PASS: '合格',
  FAIL: '不合格',
}

export const BUDGET_CATEGORIES = [
  '设计',
  '人工',
  '主材',
  ...PROCUREMENT_CATEGORIES.map((item) => item.budgetCategory),
  '辅材',
  '杂项',
]

/** 预算页可手动新增的分类（主材由采购同步，其余品类与采购 Tab 一致） */
export const MANUAL_BUDGET_CATEGORIES = [
  '设计',
  '人工',
  ...PROCUREMENT_CATEGORIES.map((item) => item.budgetCategory),
  '杂项',
]

/** 整体装修预算上限（元） */
export const OVERALL_BUDGET = 180000

export const EMPTY_TEXT = '暂无数据，请添加对应内容'

export const TODO_EMPTY_TEXT = '暂无待办，验收不合格项会自动出现在这里'

export const TODO_STATUS = {
  PENDING: '待整改',
  DONE: '已整改',
}

export const ROUTES = {
  HOME: '/',
  PROCESS: '/process',
  PROCUREMENT: '/procurement',
  ACCEPTANCE: '/acceptance',
  TODO: '/todo',
  BUDGET: '/budget',
}
