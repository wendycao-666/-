import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目站：https://wendycao-666.github.io/-/（仓库名含特殊字符，用相对路径更稳）
const base = process.env.GITHUB_PAGES === 'true' ? './' : '/'

export default defineConfig({
  base,
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: true,
  },
})
