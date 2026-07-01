<template>
  <div class="app-layout">
    <nav class="app-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-tab"
      >
        <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { HomeFilled, Calendar, ShoppingBag, Wallet } from '@element-plus/icons-vue'
import { ROUTES } from './constants'

const navItems = [
  { label: '首页', path: ROUTES.HOME, icon: HomeFilled },
  { label: '工序', path: ROUTES.PROCESS, icon: Calendar },
  { label: '采购', path: ROUTES.PROCUREMENT, icon: ShoppingBag },
  { label: '预算', path: ROUTES.BUDGET, icon: Wallet },
]
</script>

<style scoped>
.app-nav {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 4px;
  padding: 10px 16px 14px;
  background: var(--reno-surface);
  border-bottom: 1px solid var(--reno-border-light);
}

.nav-tab {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 72px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--reno-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-icon {
  font-size: 18px;
  transition: color 0.2s;
}

.nav-label {
  line-height: 1.2;
  font-weight: 500;
}

.nav-tab:hover {
  color: var(--reno-primary);
  background: var(--reno-primary-light);
}

.nav-tab.router-link-active {
  color: var(--reno-primary);
  background: var(--reno-primary-light);
  font-weight: 600;
}

.nav-tab.router-link-active .nav-icon {
  color: var(--reno-primary);
}

@media (max-width: 640px) {
  .app-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    justify-content: space-around;
    gap: 0;
    padding: 4px 2px;
    padding-bottom: max(4px, env(safe-area-inset-bottom));
    padding-left: max(2px, env(safe-area-inset-left));
    padding-right: max(2px, env(safe-area-inset-right));
    border-bottom: none;
    border-top: 1px solid var(--reno-border-light);
    box-shadow: 0 -4px 20px rgba(61, 54, 48, 0.08);
    background: rgba(255, 252, 248, 0.96);
    backdrop-filter: blur(8px);
  }

  .nav-tab {
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 6px 2px;
    border-radius: 6px;
    font-size: 11px;
    background: transparent;
  }

  .nav-icon {
    font-size: 22px;
    color: var(--reno-text-muted);
  }

  .nav-label {
    font-size: 11px;
    font-weight: 500;
  }

  .nav-tab:hover {
    background: transparent;
  }

  .nav-tab.router-link-active {
    color: var(--reno-primary);
    background: transparent;
  }

  .nav-tab.router-link-active .nav-icon {
    color: var(--reno-primary);
  }

  .nav-tab.router-link-active .nav-label {
    font-weight: 600;
  }
}
</style>
