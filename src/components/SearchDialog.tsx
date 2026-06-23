import { useVaultStore } from "@/stores/vaultStore";
import { FileText, Hash } from "lucide-react";

export function SearchDialog() {
  const searchResults = useVaultStore((s) => s.searchResults);
  const isSearchOpen = useVaultStore((s) => s.isSearchOpen);
  const clearSearch = useVaultStore((s) => s.clearSearch);
  const openFile = useVaultStore((s) => s.openFile);

  if (!isSearchOpen) return null;

  const totalMatches = searchResults.reduce((acc, r) => acc + r.matches.length, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-ink/15 backdrop-blur-sm"
      onClick={clearSearch}
    >
      <div
        className="w-[560px] max-h-[460px] bg-cloud/95 backdrop-blur-sm border border-paper-deep/50 rounded-xl shadow-[0_6px_32px_var(--shadow-deep)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-paper-deep/25 shrink-0">
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-ink-ghost/60" />
            <span className="text-[13px] font-medium text-ink-soft font-body">搜索结果</span>
            {searchResults.length > 0 && (
              <span className="text-[11px] text-ink-ghost/70 font-mono">
                {searchResults.length} 文件 &middot; {totalMatches} 匹配
              </span>
            )}
          </div>
          <kbd className="text-[10px] text-ink-ghost/50 font-mono bg-paper-warm/80 px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-2 space-y-0.5">
          {searchResults.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[13px] text-ink-ghost font-body">没有找到匹配的结果</p>
            </div>
          ) : (
            searchResults.map((result) => (
              <div key={result.file_path}>
                {/* File header */}
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg hover:bg-paper-warm transition-colors group text-left"
                  onClick={() => { openFile(result.file_path); clearSearch(); }}
                >
                  <FileText size={13} className="text-ink-ghost/50 group-hover:text-bamboo transition-colors shrink-0" />
                  <span className="text-[13px] font-medium text-ink-soft group-hover:text-bamboo transition-colors truncate font-body">
                    {result.file_name.replace(/\.md$/, "")}
                  </span>
                  <span className="text-[10px] text-ink-ghost/60 font-mono ml-auto shrink-0 tabular-nums">
                    {result.matches.length}
                  </span>
                </button>

                {/* Match lines */}
                <div className="ml-7 space-y-0.5 mb-1">
                  {result.matches.slice(0, 5).map((match, idx) => (
                    <button
                      key={`${result.file_path}-${idx}`}
                      className="w-full text-left px-3 py-1 rounded-md hover:bg-paper-warm/60 transition-colors group flex items-start gap-2"
                      onClick={() => { openFile(result.file_path); clearSearch(); }}
                    >
                      <span className="text-[10px] text-ink-ghost/50 font-mono mt-0.5 shrink-0 tabular-nums">
                        {match.line_number}
                      </span>
                      <span className="text-[12px] text-ink-soft/80 truncate group-hover:text-ink-soft transition-colors font-body leading-relaxed">
                        {match.line_content}
                      </span>
                    </button>
                  ))}
                  {result.matches.length > 5 && (
                    <p className="text-[10px] text-ink-ghost/40 font-body pl-5">
                      还有 {result.matches.length - 5} 处匹配...
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-paper-deep/20 shrink-0 flex items-center gap-4 text-[10px] text-ink-ghost/50 font-body">
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}
