# 毛坯装修管理小工具

Vue3 + Vite + Element Plus 纯前端项目，支持 **LocalStorage 本地缓存** + **Supabase 云端共享**。

## 本地开发

```bash
npm install
cp .env.example .env   # 填入 Supabase 配置（可选，不填则仅本地模式）
npm run dev
```

## GitHub Pages 部署

站点地址：https://wendycao-666.github.io/-/

### Pages 设置

| 选项 | 值 |
|------|-----|
| Source | Deploy from a branch |
| Branch | `main` |
| Folder | `/docs` |

---

## 云端数据库配置（Supabase，免费）

> 说明：原 PRD 为纯本地方案。应你的需求，已增加云端共享能力，需自行注册 Supabase 免费账号。

### 第 1 步：创建 Supabase 项目

1. 打开 [https://supabase.com](https://supabase.com) 注册并登录
2. 点击 **New Project** 创建项目（Region 选离中国近的，如 Singapore）
3. 等待项目初始化完成

### 第 2 步：建表

1. 进入项目 → **SQL Editor** → **New query**
2. 复制本项目 `supabase/schema.sql` 的全部内容，粘贴并 **Run**

### 第 3 步：获取 API 密钥

1. 进入 **Project Settings → API**
2. 复制：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 第 4 步：本地配置

```bash
cp .env.example .env
```

编辑 `.env`：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 第 5 步：GitHub Pages 线上配置

1. 打开仓库 **Settings → Secrets and variables → Actions**
2. 新增两个 Repository secrets：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 重新 push 代码，等待 Actions 部署完成

---

## 如何使用分享链接

1. 打开网站首页
2. 点击 **「创建云端项目链接」**
3. 复制生成的链接发给家人（例如 `https://wendycao-666.github.io/-/?project=abc-123#/`)
4. 对方打开同一链接，填写/修改的内容会自动同步到云端
5. 任何人编辑后，其他人刷新页面即可看到最新数据

---

## 数据存储说明

| 模式 | 说明 |
|------|------|
| 仅本地 | 未配置 Supabase 时，数据只在当前浏览器 |
| 云端共享 | 配置 Supabase 后，通过链接 `?project=ID` 共享同一份数据 |

**安全提示：** 链接中的 project ID 相当于密码，请勿公开到互联网。
