# 毛坯装修管理小工具

Vue3 + Vite + Element Plus 纯前端项目。

## 本地开发

```bash
npm install
npm run dev
```

## GitHub Pages 部署

站点地址：https://wendycao-666.github.io/-/

### 首次配置（必做）

打开仓库 **Settings → Pages**，设置：

| 选项 | 值 |
|------|-----|
| Source | Deploy from a branch |
| Branch | `main` |
| Folder | **`/docs`**（不要选 / root） |

保存后等待 1～2 分钟刷新页面。

### 自动更新

每次 push 到 `main` 分支，GitHub Actions 会自动构建并更新 `docs/` 目录。
