import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, FileText, Search, Database } from "lucide-react";
import { useVaultStore } from "@/stores/vaultStore";

export function WelcomeScreen() {
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const [error, setError] = useState("");

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择笔记库文件夹",
      });
      if (selected && typeof selected === "string") {
        setVaultPath(selected);
        setError("");
      }
    } catch (err) {
      setError("无法打开文件夹选择器");
    }
  };

  return (
    <div className="flex items-center justify-center h-full animate-fade-up">
      <div className="text-center max-w-sm">
        {/* Logo - paper aesthetic */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-paper-warm/80 border border-paper-deep/30 mb-8 animate-float-gentle">
          <FolderOpen size={36} className="text-bamboo/60" />
        </div>

        {/* Brand */}
        <h1 className="text-2xl font-serif font-medium text-ink tracking-wide mb-2">
          速记
        </h1>
        <p className="text-[13px] text-ink-faint font-body mb-10 leading-relaxed">
          极简本地 Markdown 笔记工具
        </p>

        {/* CTA button */}
        <button
          onClick={handleSelectFolder}
          className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-bamboo text-white text-[14px] font-medium font-body
            hover:bg-bamboo-light transition-all duration-200
            shadow-[0_2px_12px_rgba(45,90,61,0.15)] hover:shadow-[0_4px_20px_rgba(45,90,61,0.25)]
            active:scale-[0.98]"
        >
          <FolderOpen size={17} />
          打开笔记库
        </button>

        {error && (
          <p className="mt-4 text-[12px] text-red-400 font-body">{error}</p>
        )}

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-3 gap-3">
          {[
            {
              icon: FileText,
              label: "纯文本",
              desc: "本地 Markdown",
            },
            {
              icon: Search,
              label: "极速搜索",
              desc: "Ctrl+K 即搜",
            },
            {
              icon: Database,
              label: "零配置",
              desc: "无数据库",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl bg-paper-warm/50 border border-paper-deep/20 hover:border-bamboo/20 hover:bg-bamboo-mist/30 transition-all duration-200"
            >
              <Icon size={16} className="text-ink-ghost/60" />
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
