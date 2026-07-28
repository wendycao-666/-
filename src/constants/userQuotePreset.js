/**
 * 鼎盛锦城项目报价预估（来自预算截图）
 * 分类维度对齐：硬装二级分类 + 软装家电空间/分组。
 */
export const USER_QUOTE_VERSION = 6

export const USER_QUOTE_PRESET = {
  label: '鼎盛锦城报价预估',
  semiPackage: {
    name: '半包工程款',
    unitPrice: 60000,
    quantity: 1,
    note: '半包整体付费（含人工及施工方辅材等），不按工序拆分',
  },
  materials: {},
  procurement: {
    doors: {
      封窗: { unitPrice: 6600, quantity: 1 },
      室内木门: { unitPrice: 850, quantity: 3 },
      厨房平开门: { unitPrice: 1500, quantity: 1 },
      卫生间平开门: { unitPrice: 850, quantity: 1 },
      智能锁: { unitPrice: 1000, quantity: 1 },
    },
    floor: {
      瓷砖: { unitPrice: 35, quantity: 230 },
    },
    grout: {
      美缝: { unitPrice: 4500, quantity: 1 },
    },
    kitchenHard: {
      水槽: { unitPrice: 2000, quantity: 1 },
    },
    bathroom: {
      浴室盆: { unitPrice: 2000, quantity: 1 },
      浴具: { unitPrice: 1800, quantity: 1 },
      马桶: { unitPrice: 1500, quantity: 1 },
      淋浴房: { unitPrice: 100, quantity: 1 },
    },
    custom: {
      全屋定制: { unitPrice: 26000, quantity: 1 },
    },
    aux: {
      五金: { unitPrice: 1000, quantity: 1 },
      窗台石: { unitPrice: 300, quantity: 1 },
      开关插座: { unitPrice: 20, quantity: 85 },
      踢脚线: { unitPrice: 15, quantity: 82 },
      铝扣板: { unitPrice: 1500, quantity: 1 },
    },
    soft: {
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
    curtain: {
      窗帘: { unitPrice: 750, quantity: 4 },
    },
    kitchen: {
      烟灶: { unitPrice: 5500, quantity: 1 },
      洗碗机: { unitPrice: 6000, quantity: 1 },
      燃气热水器: { unitPrice: 1800, quantity: 1 },
      净水器: { unitPrice: 600, quantity: 1 },
    },
    laundry: {
      平嵌冰箱: { unitPrice: 6500, quantity: 1 },
      洗衣机: { unitPrice: 5000, quantity: 1 },
    },
    ac: {
      风管机: { unitPrice: 6000, quantity: 1 },
      主卧空调: { unitPrice: 2000, quantity: 1 },
      次卧1空调: { unitPrice: 2000, quantity: 1 },
    },
    av: {
      电视机: { unitPrice: 5000, quantity: 1 },
    },
    clean: {
      扫地机器人: { unitPrice: 4399, quantity: 1 },
    },
    lighting: {
      风扇灯: { unitPrice: 500, quantity: 5 },
      其他灯具: { unitPrice: 500, quantity: 1 },
    },
    personal: {
      猫眼: { unitPrice: 400, quantity: 1 },
      摄像头: { unitPrice: 400, quantity: 1 },
    },
  },
}
