import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { ROUTES } from '../constants'
import Home from '../views/Home.vue'
import Process from '../views/Process.vue'
import Procurement from '../views/Procurement.vue'
import Budget from '../views/Budget.vue'

const routes = [
  { path: ROUTES.HOME, name: 'Home', component: Home },
  { path: ROUTES.PROCESS, name: 'Process', component: Process },
  { path: ROUTES.PROCUREMENT, name: 'Procurement', component: Procurement },
  { path: '/material', redirect: { path: ROUTES.PROCUREMENT, query: { tab: 'material' } } },
  { path: '/furnishing', redirect: (to) => ({ path: ROUTES.PROCUREMENT, query: { tab: to.query.tab || 'soft' } }) },
  { path: ROUTES.ACCEPTANCE, redirect: { path: ROUTES.PROCESS, query: { tab: 'acceptance' } } },
  { path: ROUTES.TODO, redirect: ROUTES.BUDGET },
  { path: ROUTES.BUDGET, name: 'Budget', component: Budget },
]

// GitHub Pages 使用 hash 路由，避免仓库名「-」导致 history 模式白屏
const isGitHubPages = import.meta.env.BASE_URL === './'

const router = createRouter({
  history: isGitHubPages ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
