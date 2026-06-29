export const STORAGE_KEY = 'decoration_tool_data'

/** 排期版本：变更后自动刷新工序默认日期 */
export const SCHEDULE_VERSION = 1

/** 数据结构版本：升级后自动补全采购等字段并写回本地/云端 */
export const DATA_VERSION = 2

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

export const MATERIAL_TEMPLATES = [
  { name: '水管管件', processName: '水电改造', advanceDays: 10 },
  { name: '电线底盒', processName: '水电改造', advanceDays: 7 },
  { name: '墙地砖', processName: '泥瓦工程', advanceDays: 15 },
  { name: '板材五金', processName: '木作工程', advanceDays: 20 },
  { name: '室内木门', processName: '安装阶段', advanceDays: 45 },
  { name: '橱柜洁具', processName: '安装阶段', advanceDays: 30 },
]

export const SOFT_FURNISHING_TEMPLATES = [
  { name: '沙发' },
  { name: '床垫' },
  { name: '床架' },
  { name: '窗帘' },
  { name: '地毯' },
  { name: '餐桌椅' },
  { name: '茶几' },
  { name: '灯具' },
  { name: '挂画装饰' },
]

export const APPLIANCE_TEMPLATES = [
  { name: '冰箱' },
  { name: '洗衣机' },
  { name: '空调' },
  { name: '热水器' },
  { name: '油烟机' },
  { name: '燃气灶' },
  { name: '洗碗机' },
  { name: '电视' },
  { name: '净水器' },
  { name: '微波炉' },
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

export const BUDGET_CATEGORIES = ['设计', '人工', '主材', '辅材', '软装', '家电', '杂项']

/** 预算页可手动新增的分类（主材/软装/家电由采购台账同步） */
export const MANUAL_BUDGET_CATEGORIES = ['设计', '人工', '辅材', '杂项']

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
