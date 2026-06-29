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
import { HomeFilled, Calendar, ShoppingBag, User } from '@element-plus/icons-vue'
import { ROUTES } from './constants'

const navItems = [
  { label: '首页', path: ROUTES.HOME, icon: HomeFilled },
  { label: '工序', path: ROUTES.PROCESS, icon: Calendar },
  { label: '采购', path: ROUTES.PROCUREMENT, icon: ShoppingBag },
  { label: '我的', path: ROUTES.BUDGET, icon: User },
]
</script>

<style scoped>
.app-header {
  padding: 16px 16px 12px;
  text-align: center;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
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
  align-items: stretch;
  gap: 4px;
  padding: 10px 16px 14px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.nav-tab {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 72px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
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
  color: #409EFF;
  background: #ecf5ff;
}

.nav-tab.router-link-active {
  color: #409EFF;
  background: #ecf5ff;
  font-weight: 600;
}

.nav-tab.router-link-active .nav-icon {
  color: #409EFF;
}

@media (max-width: 640px) {
  .app-header {
    padding: 12px 12px 10px;
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
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
    gap: 0;
    padding: 4px 2px;
    padding-bottom: max(4px, env(safe-area-inset-bottom));
    padding-left: max(2px, env(safe-area-inset-left));
    padding-right: max(2px, env(safe-area-inset-right));
    border-bottom: none;
    border-top: 1px solid #ebeef5;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.98);
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
    color: #909399;
  }

  .nav-label {
    font-size: 11px;
    font-weight: 500;
  }

  .nav-tab:hover {
    background: transparent;
  }

  .nav-tab.router-link-active {
    color: #409EFF;
    background: transparent;
  }

  .nav-tab.router-link-active .nav-icon {
    color: #409EFF;
  }

  .nav-tab.router-link-active .nav-label {
    font-weight: 600;
  }
}
</style>
