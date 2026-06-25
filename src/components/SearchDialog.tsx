import { useState, useRef, useEffect } from "react";
import { useVaultStore } from "@/stores/vaultStore";
import { useI18n } from "@/i18n/context";
import { FileText, Search as SearchIcon } from "lucide-react";

export function SearchDialog() {
  const searchResults = useVaultStore((s) => s.searchResults);
  const isSearchOpen = useVaultStore((s) => s.isSearchOpen);
  const search = useVaultStore((s) => s.search);
  const clearSearch = useVaultStore((s) => s.clearSearch);
  const openFile = useVaultStore((s) => s.openFile);
  const setSearchOpen = useVaultStore((s) => s.setSearchOpen);
  const { t } = useI18n();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Open dialog and focus with Ctrl+K, close with Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && isSearchOpen) {
        clearSearch();
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isSearchOpen) {
      // Small delay to ensure the DOM is ready after state change
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isSearchOpen]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      search(value.trim());
    } else {
      clearSearch();
    }
  };

  const handleClose = () => {
    clearSearch();
    setQuery("");
  };

  const handleSelect = (filePath: string) => {
    openFile(filePath);
    handleClose();
  };

  if (!isSearchOpen) return null;

  const totalMatches = searchResults.reduce((acc, r) => acc + r.matches.length, 0);
  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-ink/10"
      onClick={handleClose}
    >
      <div
        className="w-[560px] max-h-[480px] bg-paper border border-paper-deep rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-paper-deep/25 shrink-0">
          <SearchIcon size={15} className="text-ink-ghost/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t("search_placeholder")}
            className="flex-1 bg-transparent border-none outline-none text-[14px] font-body text-ink placeholder:text-ink-ghost/50"
          />
          {query && (
            <span className="text-[11px] text-ink-ghost/50 font-mono shrink-0">
              {searchResults.length > 0
                ? `${searchResults.length} ${t("files")} · ${totalMatches} ${t("matches")}`
                : t("no_results")}
            </span>
          )}
          <kbd className="text-[10px] text-ink-ghost/40 font-mono bg-paper-warm/80 px-1.5 py-0.5 rounded shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-2 space-y-0.5">
          {!hasQuery ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[13px] text-ink-ghost/40 font-body">
                {t("search_placeholder")}
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[13px] text-ink-ghost font-body">{t("no_results")}</p>
            </div>
          ) : (
            searchResults.map((result) => (
              <div key={result.file_path}>
                {/* File header */}
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg hover:bg-paper-warm transition-colors group text-left"
                  onClick={() => handleSelect(result.file_path)}
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
                      onClick={() => handleSelect(result.file_path)}
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
                      {t("more_matches", { n: result.matches.length - 5 })}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-paper-deep/20 shrink-0 flex items-center gap-4 text-[10px] text-ink-ghost/50 font-body">
          <span>{t("enter_open")}</span>
          <span>{t("esc_close")}</span>
        </div>
      </div>
    </div>
  );
}
