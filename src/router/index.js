import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '../constants'
import Home from '../views/Home.vue'
import Process from '../views/Process.vue'
import Material from '../views/Material.vue'
import Acceptance from '../views/Acceptance.vue'
import Budget from '../views/Budget.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: ROUTES.HOME, name: 'Home', component: Home },
    { path: ROUTES.PROCESS, name: 'Process', component: Process },
    { path: ROUTES.MATERIAL, name: 'Material', component: Material },
    { path: ROUTES.ACCEPTANCE, name: 'Acceptance', component: Acceptance },
    { path: ROUTES.BUDGET, name: 'Budget', component: Budget },
  ],
})

export default router
