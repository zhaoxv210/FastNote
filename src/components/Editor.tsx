import { useEffect, useRef, useCallback } from "react";
import { Editor as MilkEditor, rootCtx, defaultValueCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import { history } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { indent } from "@milkdown/kit/plugin/indent";
import { trailing } from "@milkdown/kit/plugin/trailing";
import { cursor } from "@milkdown/kit/plugin/cursor";
import { replaceAll, getMarkdown } from "@milkdown/kit/utils";
import { useVaultStore } from "@/stores/vaultStore";
import { FileText } from "lucide-react";
import "./milkdown.css";

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MilkEditor | null>(null);
  const activeFile = useVaultStore((s) => s.activeFile);
  const activeContent = useVaultStore((s) => s.activeContent);
  const setActiveContent = useVaultStore((s) => s.setActiveContent);
  const saveFile = useVaultStore((s) => s.saveFile);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(), 800);
  }, [saveFile]);

  // Create/destroy editor when active file changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy old editor
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }
    if (!activeFile) return;

    // Clear container
    containerRef.current.innerHTML = "";

    let skipFirst = true;

    MilkEditor.make()
      .config((ctx) => {
        ctx.set(rootCtx, containerRef.current!);
        ctx.set(defaultValueCtx, activeContent);

        // Listen for markdown changes to auto-save
        const mgr = ctx.get(listenerCtx);
        mgr.markdownUpdated((_ctx, markdown, _prev) => {
          setActiveContent(markdown);
          if (skipFirst) {
            skipFirst = false;
            return;
          }
          debouncedSave();
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(clipboard)
      .use(indent)
      .use(trailing)
      .use(cursor)
      .create()
      .then((editor) => {
        editorRef.current = editor;
      });

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [activeFile]);

  // Sync content when externally changed (e.g. file opened from search)
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;
    const editor = editorRef.current;
    const currentMd = editor.action(getMarkdown());
    if (currentMd !== activeContent) {
      editor.action(replaceAll(activeContent));
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

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-up">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-paper-warm/80 animate-float-gentle">
            <FileText size={32} className="text-ink-ghost/50" />
          </div>
          <p className="text-[13px] text-ink-faint font-body">
            选择一篇笔记开始写作
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-9 px-5 border-b border-paper-deep/20 shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText size={13} className="text-ink-ghost/60" />
          <span className="text-[11px] text-ink-faint font-body">
            {activeFile.split("/").pop()?.replace(/\.md$/, "") ?? ""}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto milkdown-editor" />
    </div>
  );
}
