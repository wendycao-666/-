import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import { useAppStore } from './composables/useAppStore'
import './style.css'

async function bootstrap() {
  const app = createApp(App)
  app.use(ElementPlus, { locale: zhCn })
  app.use(router)

  const { initStore } = useAppStore()
  await initStore()

  app.mount('#app')
}

bootstrap()
