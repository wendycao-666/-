<template>
  <div class="app-layout">
    <header class="app-header">
      <router-link to="/" class="logo">毛坯装修管理</router-link>
    </header>

    <nav class="app-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-tab"
      >
        {{ item.label }}
      </router-link>
    </nav>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ROUTES } from './constants'

const navItems = [
  { label: '首页', path: ROUTES.HOME },
  { label: '工序', path: ROUTES.PROCESS },
  { label: '采购', path: ROUTES.PROCUREMENT },
  { label: '验收', path: ROUTES.ACCEPTANCE },
  { label: '待办', path: ROUTES.TODO },
  { label: '预算', path: ROUTES.BUDGET },
]
</script>

<style scoped>
.app-header {
  padding: 16px 16px 0;
  text-align: center;
  background: #fff;
}

.logo {
  display: inline-block;
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
  text-decoration: none;
}

.app-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-tab:hover {
  color: #409EFF;
  background: #ecf5ff;
}

.nav-tab.router-link-active {
  color: #fff;
  background: #409EFF;
  font-weight: 600;
}

@media (max-width: 640px) {
  .app-header {
    padding: 12px 12px 10px;
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
    border-bottom: 1px solid #ebeef5;
  }

  .logo {
    font-size: 16px;
  }

  .app-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    justify-content: space-around;
    flex-wrap: nowrap;
    overflow-x: visible;
    gap: 0;
    padding: 6px 4px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
    padding-left: max(4px, env(safe-area-inset-left));
    padding-right: max(4px, env(safe-area-inset-right));
    border-bottom: none;
    border-top: 1px solid #ebeef5;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  }

  .nav-tab {
    flex: 1;
    min-width: 0;
    padding: 4px 2px;
    font-size: 11px;
    line-height: 1.2;
    border-radius: 4px;
    white-space: nowrap;
  }

  .nav-tab:hover {
    background: transparent;
  }

  .nav-tab.router-link-active {
    color: #409EFF;
    background: #ecf5ff;
    font-weight: 600;
  }
}
</style>
