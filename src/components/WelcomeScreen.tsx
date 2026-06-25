import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, FileText, Search, Database } from "lucide-react";
import { useVaultStore } from "@/stores/vaultStore";
import { useI18n } from "@/i18n/context";

const features = {
  zh: [
    { icon: FileText, label: "纯文本", desc: "本地 Markdown" },
    { icon: Search, label: "极速搜索", desc: "Ctrl+K 即搜" },
    { icon: Database, label: "零配置", desc: "无数据库" },
  ],
  en: [
    { icon: FileText, label: "Plain Text", desc: "Local Markdown" },
    { icon: Search, label: "Fast Search", desc: "Ctrl+K to search" },
    { icon: Database, label: "Zero Config", desc: "No database" },
  ],
};

export function WelcomeScreen() {
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const [error, setError] = useState("");
  const { t, lang } = useI18n();

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: lang === "zh" ? "选择笔记库文件夹" : "Select vault folder",
      });
      if (selected && typeof selected === "string") {
        setVaultPath(selected);
        setError("");
      }
    } catch (err) {
      setError(lang === "zh" ? "无法打开文件夹选择器" : "Failed to open folder picker");
    }
  };

  const slogan = lang === "zh" ? "极简本地 Markdown 笔记工具" : "A minimal local Markdown note-taking app";
  const cta = lang === "zh" ? "打开笔记库" : "Open Vault";

  return (
    <div className="flex items-center justify-center h-full animate-fade-up">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-paper-warm border border-paper-deep mb-10">
          <FolderOpen size={30} className="text-accent" />
        </div>

        {/* Brand */}
        <h1 className="text-[28px] font-display font-semibold text-ink tracking-tight mb-2">
          FastNote
        </h1>
        <p className="text-[13px] text-ink-faint font-body mb-10 leading-relaxed">
          {slogan}
        </p>

        {/* CTA button */}
        <button
          onClick={handleSelectFolder}
          className="inline-flex items-center gap-2 px-8 py-2.5 rounded-lg bg-bamboo text-white text-[14px] font-medium font-body
            hover:opacity-90 transition-all duration-150
            shadow-[0_2px_8px_rgba(0,113,227,0.2)] hover:shadow-[0_4px_16px_rgba(0,113,227,0.3)]
            active:scale-[0.98]"
        >
          <FolderOpen size={17} />
          {cta}
        </button>

        {error && (
          <p className="mt-4 text-[12px] text-red-400 font-body">{error}</p>
        )}

        {/* Feature pills */}
        <div className="mt-12 grid grid-cols-3 gap-2.5">
          {features[lang].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-paper-warm border border-paper-deep/30 hover:border-accent/30 transition-all duration-150"
            >
              <Icon size={15} className="text-ink-ghost/60" />
              <span className="text-[12px] font-medium text-ink-soft font-body">
                {label}
              </span>
              <span className="text-[10px] text-ink-ghost/70 font-body">
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
