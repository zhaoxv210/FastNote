import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useVaultStore } from "@/stores/vaultStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";

const appWindow = getCurrentWindow();

export function Toolbar() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const activeFile = useVaultStore((s) => s.activeFile);
  const search = useVaultStore((s) => s.search);
  const switchVault = useVaultStore((s) => s.switchVault);
  const loadTree = useVaultStore((s) => s.loadTree);
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

  const handleSwitchVault = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "切换笔记库",
      });
      if (selected && typeof selected === "string") {
        switchVault(selected);
        loadTree();
      }
    } catch (err) {
      console.error("切换笔记库失败:", err);
    }
  };

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
      className="relative z-10 flex items-center justify-between h-11 px-5 bg-paper/80 border-b border-paper-deep shrink-0 select-none cursor-default"
      onMouseDown={handleTitleBarMouseDown}
    >
      <div className="flex items-center min-w-0 flex-1 gap-2">
        <span className="text-[15px] font-display font-semibold text-ink tracking-tight leading-none shrink-0">
          FastNote
        </span>
        <button
          onClick={handleSwitchVault}
          className="text-[12px] font-body text-ink-faint truncate max-w-[140px] hover:text-bamboo transition-colors cursor-pointer shrink-0"
          title="点击切换笔记库"
        >
          {vaultName}
        </button>
        {fileName && (
          <>
            <span className="text-[11px] text-ink-ghost font-body shrink-0">/</span>
            <span className="text-[12px] text-ink-soft font-body truncate max-w-[100px] shrink-0">
              {fileName}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-2 h-7 rounded-md bg-paper-warm border border-paper-deep focus-within:border-bamboo/40 focus-within:bg-cloud transition-all duration-150 mr-4">
        <Search size={12} className="text-ink-ghost/60 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索..."
          className="w-32 bg-transparent border-none outline-none text-[12px] font-body text-ink placeholder:text-ink-ghost/60"
        />
        {!query && (
          <kbd className="text-[10px] text-ink-ghost/50 font-mono ml-auto">⌘K</kbd>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => void appWindow.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-ink-secondary hover:bg-paper-warm transition-all duration-150 cursor-pointer"
          title="最小化"
        >
          <svg width="13" height="13" viewBox="0 0 15 15">
            <rect x="2" y="7" width="11" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => void appWindow.toggleMaximize()}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-ink-secondary hover:bg-paper-warm transition-all duration-150 cursor-pointer"
          title="最大化"
        >
          <svg width="13" height="13" viewBox="0 0 15 15">
            <rect x="2.5" y="2.5" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={() => void appWindow.close()}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-danger hover:bg-danger-bg transition-all duration-150 cursor-pointer"
          title="关闭"
        >
          <svg width="13" height="13" viewBox="0 0 15 15">
            <line x1="3.5" y1="3.5" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11.5" y1="3.5" x2="3.5" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
