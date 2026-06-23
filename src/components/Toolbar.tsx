import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useVaultStore } from "@/stores/vaultStore";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export function Toolbar() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const activeFile = useVaultStore((s) => s.activeFile);
  const search = useVaultStore((s) => s.search);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setQuery("");
        useVaultStore.getState().clearSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) search(value.trim());
    else useVaultStore.getState().clearSearch();
  };

  // Drag via Tauri API (like floral-notepaper)
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input")) return;
    if (e.button !== 0) return;
    if (e.detail === 2) {
      void appWindow.toggleMaximize();
      return;
    }
    void appWindow.startDragging();
  };

  const vaultName = vaultPath?.split(/[/\\]/).pop() ?? "笔记库";
  const fileName = activeFile?.split("/").pop()?.replace(/\.md$/, "") ?? "";

  return (
    <div
      className="relative z-10 flex items-center justify-between h-11 px-5 bg-paper/55 backdrop-blur-[1px] border-b border-paper-deep/30 shrink-0 select-none cursor-default"
      onMouseDown={handleTitleBarMouseDown}
    >
      {/* Brand + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[15px] font-serif font-medium text-ink-soft tracking-wide leading-none">
          速记
        </span>
        <span className="text-[11px] text-ink-ghost font-body leading-none translate-y-px">
          /
        </span>
        <span className="text-[11px] text-ink-faint font-body truncate max-w-[200px] leading-none">
          {vaultName}
        </span>
        {fileName && (
          <>
            <span className="text-[11px] text-ink-ghost font-body leading-none translate-y-px">
              /
            </span>
            <span className="text-[12px] text-ink-soft font-body truncate max-w-[160px] leading-none">
              {fileName}
            </span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-2.5 h-8 rounded-lg bg-paper-warm/80 border border-paper-deep/40 focus-within:border-bamboo/30 focus-within:bg-cloud transition-all duration-200 mr-3">
        <Search size={13} className="text-ink-ghost/60 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索..."
          className="w-36 bg-transparent border-none outline-none text-[12px] font-body text-ink placeholder:text-ink-ghost/60"
        />
        {!query && (
          <kbd className="text-[10px] text-ink-ghost/50 font-mono ml-1">
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* Window Controls */}
      <div className="flex items-center -mr-2">
        <button
          onClick={() => void appWindow.minimize()}
          className="w-11 h-11 flex items-center justify-center text-ink-ghost hover:text-ink-faint hover:bg-paper-warm transition-all cursor-pointer"
          title="最小化"
        >
          <svg width="15" height="15" viewBox="0 0 15 15">
            <rect x="2" y="7" width="11" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => void appWindow.toggleMaximize()}
          className="w-11 h-11 flex items-center justify-center text-ink-ghost hover:text-ink-faint hover:bg-paper-warm transition-all cursor-pointer"
          title="最大化"
        >
          <svg width="15" height="15" viewBox="0 0 15 15">
            <rect x="2.5" y="2.5" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={() => void appWindow.close()}
          className="w-11 h-11 flex items-center justify-center text-ink-ghost hover:text-red-400 hover:bg-danger-bg transition-all cursor-pointer"
          title="关闭"
        >
          <svg width="15" height="15" viewBox="0 0 15 15">
            <line x1="3.5" y1="3.5" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11.5" y1="3.5" x2="3.5" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
