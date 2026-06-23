import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { useVaultStore } from "@/stores/vaultStore";
import { FileText } from "lucide-react";

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const activeFile = useVaultStore((s) => s.activeFile);
  const activeContent = useVaultStore((s) => s.activeContent);
  const setActiveContent = useVaultStore((s) => s.setActiveContent);
  const saveFile = useVaultStore((s) => s.saveFile);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(), 600);
  }, [saveFile]);

  // Init editor
  useEffect(() => {
    if (!editorRef.current) return;
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }
    if (!activeFile) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        setActiveContent(update.state.doc.toString());
        debouncedSave();
      }
    });

    const state = EditorState.create({
      doc: activeContent,
      extensions: [
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([...defaultKeymap, indentWithTab]),
        placeholder("开始写作..."),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
            backgroundColor: "transparent",
          },
          ".cm-scroller": {
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            lineHeight: "1.9",
          },
          ".cm-content": {
            caretColor: "var(--bamboo)",
            padding: "24px 28px",
          },
          ".cm-cursor": {
            borderLeftColor: "var(--bamboo)",
          },
          ".cm-activeLine": {
            backgroundColor: "var(--bamboo-mist)",
          },
          ".cm-selectionBackground, .cm-focused .cm-selectionBackground": {
            backgroundColor: "var(--bamboo-glow)",
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "none",
            color: "var(--ink-ghost)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "transparent",
            color: "var(--ink-faint)",
          },
          ".cm-matchingBracket": {
            color: "var(--bamboo)",
            backgroundColor: "var(--bamboo-mist)",
          },
        }),
      ],
    });

    viewRef.current = new EditorView({ state, parent: editorRef.current });
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [activeFile]);

  // Sync external changes
  useEffect(() => {
    if (viewRef.current && activeFile) {
      const cur = viewRef.current.state.doc.toString();
      if (cur !== activeContent) {
        viewRef.current.dispatch({
          changes: { from: 0, to: cur.length, insert: activeContent },
        });
      }
    }
  }, [activeContent, activeFile]);

  // Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveFile]);

  // Empty state
  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-up">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-paper-warm/80 animate-float-gentle">
            <FileText size={32} className="text-ink-ghost/50" />
          </div>
          <div>
            <p className="text-[13px] text-ink-faint font-body">
              选择一篇笔记开始写作
            </p>
            <p className="text-[11px] text-ink-ghost/60 font-body mt-1.5">
              Ctrl+K 搜索 &middot; Ctrl+S 保存
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fileName = activeFile.split("/").pop()?.replace(/\.md$/, "") ?? "";

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center h-9 px-5 border-b border-paper-deep/20 shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText size={13} className="text-ink-ghost/60" />
          <span className="text-[11px] text-ink-faint font-body">
            {fileName}
          </span>
        </div>
      </div>

      {/* CodeMirror */}
      <div ref={editorRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
