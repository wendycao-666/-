<template>
  <div class="page procurement-page">
    <h2 class="page-title">采购台账</h2>

    <el-tabs v-model="activeTab" class="procurement-tabs">
      <el-tab-pane label="主材" name="material">
        <MaterialSection />
      </el-tab-pane>
      <el-tab-pane label="软装" name="soft">
        <ProcurementSection
          :items="state.softFurnishings"
          category-label="软装"
          sync-tip="填写实际费用后同步至「预算 · 软装」"
          @save="saveSoftFurnishing"
        />
      </el-tab-pane>
      <el-tab-pane label="家电" name="appliance">
        <ProcurementSection
          :items="state.appliances"
          category-label="家电"
          sync-tip="填写实际费用后同步至「预算 · 家电」"
          @save="saveAppliance"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../composables/useAppStore'
import MaterialSection from '../components/MaterialSection.vue'
import ProcurementSection from '../components/ProcurementSection.vue'

const route = useRoute()
const router = useRouter()
const { state, updateSoftFurnishing, updateAppliance } = useAppStore()

const TAB_NAMES = ['material', 'soft', 'appliance']
const activeTab = ref(TAB_NAMES.includes(route.query.tab) ? route.query.tab : 'material')

watch(activeTab, (tab) => {
  if (route.query.tab === tab) return
  router.replace({ query: { ...route.query, tab } })
})

watch(
  () => route.query.tab,
  (tab) => {
    if (TAB_NAMES.includes(tab) && tab !== activeTab.value) {
      activeTab.value = tab
    }
  }
)

function saveSoftFurnishing(item) {
  updateSoftFurnishing(item.id, normalizePayload(item))
}

function saveAppliance(item) {
  updateAppliance(item.id, normalizePayload(item))
}

function normalizePayload(item) {
  return {
    actualOrderDate: item.actualOrderDate || '',
    expectedArrivalDate: item.expectedArrivalDate || '',
    unitPrice: Number(item.unitPrice || 0),
    quantity: Number(item.quantity || 1) || 1,
    cost: Number(item.cost || 0),
    paidAmount: Number(item.paidAmount || 0),
    purchaseStatus: item.purchaseStatus,
  }
}
</script>

<style scoped>
.procurement-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
@media (max-width: 640px) {
  .procurement-tabs :deep(.el-tabs__item) {
    padding: 0 14px;
    font-size: 14px;
  }
}
</style>
