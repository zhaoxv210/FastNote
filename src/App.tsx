import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { I18nProvider } from "@/i18n/context";
import { useVaultStore } from "@/stores/vaultStore";
import { FileTree } from "@/components/FileTree";
import { Editor } from "@/components/Editor";
import { SearchDialog } from "@/components/SearchDialog";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Toolbar } from "@/components/Toolbar";

function AppInner() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const loadTree = useVaultStore((s) => s.loadTree);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Init theme
  useEffect(() => {
    const saved = localStorage.getItem("fastnote-theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  // Restore vault
  useEffect(() => {
    const saved = localStorage.getItem("fastnote-vault-path");
    if (saved) setVaultPath(saved);
  }, []);

  useEffect(() => {
    if (vaultPath) {
      loadTree();
      invoke("start_watcher", { vaultPath }).catch(console.error);
    }
  }, [vaultPath]);

  // Listen for external file changes
  useEffect(() => {
    const unlisten = listen("fs-change", () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        loadTree();
      }, 500);
    });
    return () => {
      unlisten.then((fn) => fn());
      clearTimeout(timerRef.current);
    };
  }, [loadTree]);

  if (!vaultPath) {
    return (
      <div className="h-full font-body text-ink">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-body text-ink select-none">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[220px] shrink-0 border-r border-paper-deep overflow-hidden">
          <FileTree />
        </div>
        <div className="flex-1 overflow-hidden bg-paper">
          <Editor />
        </div>
      </div>
      <SearchDialog />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

export default App;
