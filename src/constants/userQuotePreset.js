/**
 * 鼎盛锦城项目报价预估（来自预算截图）
 * 半包为整体付费单独一项；主材/软装家电按截图明细。
 */
export const USER_QUOTE_VERSION = 4

export const USER_QUOTE_PRESET = {
  label: '鼎盛锦城报价预估',
  /** 半包整体价，后续有报价再填；当前占位 0 */
  semiPackage: {
    name: '半包工程款',
    unitPrice: 0,
    quantity: 1,
    note: '半包整体付费（含人工及施工方辅材等），不按工序拆分',
  },
  materials: {
    室内木门: { unitPrice: 850, quantity: 3 },
  },
  procurement: {
    base: {
      封窗: { unitPrice: 6600, quantity: 1 },
      瓷砖: { unitPrice: 35, quantity: 230 },
      美缝: { unitPrice: 4500, quantity: 1 },
      厨房平开门: { unitPrice: 1500, quantity: 1 },
      卫生间平开门: { unitPrice: 850, quantity: 1 },
      窗台石: { unitPrice: 300, quantity: 1 },
      开关插座: { unitPrice: 20, quantity: 85 },
      踢脚线: { unitPrice: 15, quantity: 82 },
      铝扣板: { unitPrice: 1500, quantity: 1 },
      五金: { unitPrice: 1000, quantity: 1 },
    },
    custom: {
      全屋定制: { unitPrice: 26000, quantity: 1 },
    },
    bathroom: {
      浴室盆: { unitPrice: 2000, quantity: 1 },
      浴具: { unitPrice: 1800, quantity: 1 },
      马桶: { unitPrice: 1500, quantity: 1 },
      淋浴房: { unitPrice: 100, quantity: 1 },
    },
    kitchen: {
      燃气热水器: { unitPrice: 1800, quantity: 1 },
      水槽: { unitPrice: 2000, quantity: 1 },
      烟灶: { unitPrice: 5500, quantity: 1 },
      洗碗机: { unitPrice: 6000, quantity: 1 },
      净水器: { unitPrice: 600, quantity: 1 },
    },
    appliance: {
      平嵌冰箱: { unitPrice: 6500, quantity: 1 },
      风管机: { unitPrice: 6000, quantity: 1 },
      洗衣机: { unitPrice: 5000, quantity: 1 },
      扫地机器人: { unitPrice: 4399, quantity: 1 },
      电视机: { unitPrice: 5000, quantity: 1 },
      主卧空调: { unitPrice: 2000, quantity: 1 },
      次卧1空调: { unitPrice: 2000, quantity: 1 },
      风扇灯: { unitPrice: 500, quantity: 5 },
      其他灯具: { unitPrice: 500, quantity: 1 },
      智能锁: { unitPrice: 1000, quantity: 1 },
      猫眼: { unitPrice: 400, quantity: 1 },
      摄像头: { unitPrice: 400, quantity: 1 },
    },
    soft: {
      窗帘: { unitPrice: 750, quantity: 4 },
      沙发: { unitPrice: 4500, quantity: 1 },
      茶几: { unitPrice: 500, quantity: 1 },
      地毯: { unitPrice: 200, quantity: 1 },
      装饰画: { unitPrice: 100, quantity: 1 },
      餐桌餐椅: { unitPrice: 2500, quantity: 1 },
      床品垫子: { unitPrice: 3500, quantity: 2 },
      床头柜: { unitPrice: 200, quantity: 3 },
      浴室收纳: { unitPrice: 100, quantity: 1 },
      洗衣收纳篮: { unitPrice: 50, quantity: 2 },
    },
  },
}
