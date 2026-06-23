import { useEffect } from "react";
import { useVaultStore } from "@/stores/vaultStore";
import { FileTree } from "@/components/FileTree";
import { Editor } from "@/components/Editor";
import { SearchDialog } from "@/components/SearchDialog";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Toolbar } from "@/components/Toolbar";

function App() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const loadTree = useVaultStore((s) => s.loadTree);

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
    if (vaultPath) loadTree();
  }, [vaultPath]);

  if (!vaultPath) {
    return (
      <div className="h-full font-body text-ink noise-bg">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-body text-ink noise-bg select-none">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0 border-r border-paper-deep/30 bg-paper/40 overflow-hidden">
          <FileTree />
        </div>
        <div className="flex-1 overflow-hidden bg-transparent">
          <Editor />
        </div>
      </div>
      <SearchDialog />
    </div>
  );
}

export default App;
