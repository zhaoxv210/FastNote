import { Search, Languages } from "lucide-react";
import { useVaultStore } from "@/stores/vaultStore";
import { useI18n } from "@/i18n/context";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";

const appWindow = getCurrentWindow();

export function Toolbar() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const switchVault = useVaultStore((s) => s.switchVault);
  const loadTree = useVaultStore((s) => s.loadTree);
  const setSearchOpen = useVaultStore((s) => s.setSearchOpen);
  const { t, toggleLang, lang } = useI18n();

  const handleSwitchVault = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("switch_vault"),
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

  const vaultName = vaultPath?.split(/[/\\]/).pop() ?? "vault";

  return (
    <div
      className="relative z-10 flex items-center justify-between h-11 px-5 bg-paper/80 border-b border-paper-deep shrink-0 select-none cursor-default"
      onMouseDown={handleTitleBarMouseDown}
    >
      <div className="flex items-center min-w-0 flex-1 gap-2">
        <button
          onClick={handleSwitchVault}
          className="text-[13px] font-body text-ink-soft truncate max-w-[180px] hover:text-bamboo transition-colors cursor-pointer"
          title={t("switch_vault")}
        >
          {vaultName}
        </button>
      </div>

      <div className="flex items-center gap-1 mr-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-ink-secondary hover:bg-paper-warm transition-all duration-150 cursor-pointer"
          title={t("search_placeholder")}
        >
          <Search size={15} />
        </button>
        <button
          onClick={toggleLang}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-ink-secondary hover:bg-paper-warm transition-all duration-150 cursor-pointer"
          title={t("language")}
        >
          <span className="text-[11px] font-semibold font-body">{lang === "zh" ? "EN" : "中"}</span>
        </button>
        <button
          onClick={() => void appWindow.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-ink-secondary hover:bg-paper-warm transition-all duration-150 cursor-pointer"
          title={t("minimize")}
        >
          <svg width="13" height="13" viewBox="0 0 15 15">
            <rect x="2" y="7" width="11" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => void appWindow.toggleMaximize()}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-ink-secondary hover:bg-paper-warm transition-all duration-150 cursor-pointer"
          title={t("maximize")}
        >
          <svg width="13" height="13" viewBox="0 0 15 15">
            <rect x="2.5" y="2.5" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={() => void appWindow.close()}
          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-ghost hover:text-danger hover:bg-danger-bg transition-all duration-150 cursor-pointer"
          title={t("close")}
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
