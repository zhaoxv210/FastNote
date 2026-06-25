# FastNote

> A minimal local Markdown note-taking app.  
> Built with Tauri 2 + React 19, powered by Rust.

[![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-1.95-000000?logo=rust)](https://www.rust-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## Features

- **Plain Markdown files** — No database, no proprietary format. Your notes are just `.md` files you can open anywhere.
- **WYSIWYG editing** — Milkdown editor: type `# Heading` and see it rendered in real time.
- **Drag & drop** — Organize notes by dragging them between folders or to the vault root.
- **Command palette search** — `Ctrl+K` opens a search panel. Type to scan across all notes instantly.
- **Bilingual UI** — Toggle between English and Chinese with one click.
- **Auto-save** — Saves automatically as you pause typing.
- **Native performance** — Tauri 2 desktop app, not Electron. RAM footprint under 50MB.

## Why FastNote

| | FastNote | Obsidian | Notion | Typora |
|---|---------|---------|--------|--------|
| Size | ~10MB | ~200MB | Web | ~80MB |
| Startup | < 1s | 3–5s | 5–10s | 1–2s |
| Open source | MIT | ❌ | ❌ | ❌ |
| Offline | ✅ | ✅ | ❌ | ✅ |
| Database | ❌ | ❌ | ✅ | ❌ |
| WYSIWYG | ✅ | ✅ | ✅ | ✅ |

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop | Tauri 2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| Editor | Milkdown |
| State | Zustand |
| Backend | Rust |

## Prerequisites

- [Rust](https://rustup.rs) (stable MSVC on Windows)
- [Node.js](https://nodejs.org) 18+
- Windows: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10+)

## Development

```bash
npm install
npm run tauri dev
```

Production build:

```bash
npm run tauri build
```

## Project Structure

```
FastNote/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── stores/           # Zustand state
│   ├── i18n/             # Translations
│   └── lib/              # Utilities
├── src-tauri/            # Tauri + Rust backend
│   ├── src/lib.rs        # File system commands
│   └── tauri.conf.json   # Tauri config
└── package.json
```

## License

MIT
