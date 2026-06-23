# 速记 FastNote

> 极简本地 Markdown 笔记工具 · A minimal local Markdown note-taking app

[![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-1.95-000000?logo=rust)](https://www.rust-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## 中文

### 为什么选择速记

| 维度 | 速记 | Obsidian | Notion | Typora |
|------|------|----------|--------|--------|
| 体积 | **~10MB** | ~200MB | Web | ~80MB |
| 启动速度 | **< 1s** | 3-5s | 5-10s | 1-2s |
| 离线 | ✅ 纯本地 | ✅ | ❌ 需联网 | ✅ |
| 数据库 | ❌ 无 | ❌ 无 | ✅ | ❌ 无 |
| 所见即所得 | ✅ Milkdown | ✅ | ✅ | ✅ |
| 开源 | ✅ MIT | ❌ | ❌ | ❌ |
| 跨平台 | ✅ Win/Mac/Linux | ✅ | Web | ✅ |
| 数据归属 | **你的硬盘** | 你的硬盘 | Notion 服务器 | 你的硬盘 |

### 核心优势

- **零锁定** — 笔记就是 `.md` 文件，任何编辑器都能打开，随时迁移
- **无数据库** — 不需要索引缓存、不产生 `.obsidian/` 目录污染
- **Tauri 2 原生** — 不是 Electron 套壳，内存占用 < 50MB
- **Milkdown 编辑器** — 输入 `# 标题` 实时渲染，所见即所得
- **Rust 后端** — 文件操作、全文搜索全部走原生性能
- **全局搜索** — Ctrl+K 即时扫描所有笔记的标题和内容
- **自动保存** — 800ms 防抖，停止输入即刻保存
- **MIT 开源** — 无任何商业限制

### 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri 2 |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS 4 |
| 编辑器 | Milkdown (WYSIWYG Markdown) |
| 状态管理 | Zustand |
| 后端 | Rust (walkdir, serde) |

### 开发

```bash
npm install          # 安装依赖
npm run tauri dev    # 启动开发模式
npm run tauri build  # 生产构建
```

### 项目结构

```
FastNote/
├── src/                    # React 前端
├── src-tauri/              # Tauri + Rust 后端
│   ├── src/lib.rs          # Rust 命令
│   ├── tauri.conf.json     # Tauri 配置
│   └── capabilities/       # 权限声明
└── package.json
```

### License

MIT

---

## English

### Why FastNote

| Dimension | FastNote | Obsidian | Notion | Typora |
|-----------|----------|----------|--------|--------|
| Size | **~10MB** | ~200MB | Web | ~80MB |
| Startup | **< 1s** | 3-5s | 5-10s | 1-2s |
| Offline | ✅ Fully local | ✅ | ❌ | ✅ |
| Database | ❌ None | ❌ None | ✅ | ❌ None |
| WYSIWYG | ✅ Milkdown | ✅ | ✅ | ✅ |
| Open Source | ✅ MIT | ❌ | ❌ | ❌ |
| Cross-platform | ✅ | ✅ | Web | ✅ |
| Data ownership | **Your disk** | Your disk | Notion servers | Your disk |

### Key Advantages

- **Zero lock-in** — Notes are plain `.md` files openable by any editor
- **No database** — No index cache, no `.obsidian/` clutter
- **Tauri 2 native** — Not Electron, RAM < 50MB
- **Milkdown editor** — Type `# Heading` and see it rendered live
- **Rust backend** — File I/O and full-text search at native speed
- **Global search** — Ctrl+K scans all notes instantly
- **Auto-save** — 800ms debounce, saves as you pause typing
- **MIT licensed** — No commercial restrictions

### Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri 2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| Editor | Milkdown (WYSIWYG Markdown) |
| State | Zustand |
| Backend | Rust (walkdir, serde) |

### Development

```bash
npm install          # Install dependencies
npm run tauri dev    # Start dev mode
npm run tauri build  # Production build
```

### License

MIT
