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
    padding: 12px 12px 0;
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
  }

  .logo {
    font-size: 16px;
  }

  .app-nav {
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 6px;
    padding: 8px 12px 12px;
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
  }

  .app-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-tab {
    flex-shrink: 0;
    min-width: auto;
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
