export const STORAGE_KEY = 'decoration_tool_data'

/** 排期版本：变更后自动刷新工序默认日期 */
export const SCHEDULE_VERSION = 1

/** 计划开工日 */
export const PROJECT_START_DATE = '2026-07-06'

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

export const MATERIAL_TEMPLATES = [
  { name: '水管管件', processName: '水电改造', advanceDays: 10 },
  { name: '电线底盒', processName: '水电改造', advanceDays: 7 },
  { name: '墙地砖', processName: '泥瓦工程', advanceDays: 15 },
  { name: '板材五金', processName: '木作工程', advanceDays: 20 },
  { name: '室内木门', processName: '安装阶段', advanceDays: 45 },
  { name: '橱柜洁具', processName: '安装阶段', advanceDays: 30 },
]

export const ACCEPTANCE_STATUS = {
  NONE: '未验收',
  PARTIAL: '部分验收',
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

export const BUDGET_CATEGORIES = ['人工', '主材', '辅材', '杂项']

export const EMPTY_TEXT = '暂无数据，请添加对应内容'

export const ROUTES = {
  HOME: '/',
  PROCESS: '/process',
  MATERIAL: '/material',
  ACCEPTANCE: '/acceptance',
  BUDGET: '/budget',
}
