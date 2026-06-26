import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { ROUTES } from '../constants'
import Home from '../views/Home.vue'
import Process from '../views/Process.vue'
import Material from '../views/Material.vue'
import Acceptance from '../views/Acceptance.vue'
import Budget from '../views/Budget.vue'

const routes = [
  { path: ROUTES.HOME, name: 'Home', component: Home },
  { path: ROUTES.PROCESS, name: 'Process', component: Process },
  { path: ROUTES.MATERIAL, name: 'Material', component: Material },
  { path: ROUTES.ACCEPTANCE, name: 'Acceptance', component: Acceptance },
  { path: ROUTES.BUDGET, name: 'Budget', component: Budget },
]

// GitHub Pages 使用 hash 路由，避免仓库名「-」导致 history 模式白屏
const isGitHubPages = import.meta.env.BASE_URL === './'

const router = createRouter({
  history: isGitHubPages ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
