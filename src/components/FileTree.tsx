import { useState, useRef, useCallback, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import type { TreeNode } from "@/types";
import { useVaultStore } from "@/stores/vaultStore";
import { useI18n } from "@/i18n/context";

/* ===== 全局拖拽状态 ===== */
let dragState: {
  sourcePath: string;
  sourceName: string;
  sourceType: "file" | "folder";
  sourceEl: HTMLElement | null;
  startX: number;
  startY: number;
  dragging: boolean;
  currentTarget: string | null;
  currentTargetEl: HTMLElement | null;
  isOverRoot: boolean;
  rootDropEl: HTMLElement | null;
  rootDropBounds: DOMRect | null;
  labelEl: HTMLElement | null;
} | null = null;

/* ===== Context Menu ===== */
function ContextMenu({
  x,
  y,
  onClose,
  items,
}: {
  x: number;
  y: number;
  onClose: () => void;
  items: {
    label: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
    shortcut?: string;
  }[];
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-[152px] py-1.5 bg-cloud/95 backdrop-blur-sm border border-paper-deep/50 rounded-lg overflow-hidden select-none animate-scale-in"
        style={{ left: x, top: y }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-body transition-colors ${
              item.danger
                ? "text-red-400 hover:bg-danger-bg hover:text-red-500"
                : "text-ink-soft hover:bg-bamboo-mist/60 hover:text-bamboo"
            }`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-[10px] text-ink-ghost/60 font-mono ml-6">
                {item.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

/* ===== DraggableRow ===== */
function DraggableRow({
  node,
  depth,
  onDragTargetChange,
}: {
  node: TreeNode;
  depth: number;
  onDragTargetChange: (path: string | null, el: HTMLElement | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name.replace(/\.md$/, ""));
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newName, setNewName] = useState("");
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const activeFile = useVaultStore((s) => s.activeFile);
  const openFile = useVaultStore((s) => s.openFile);
  const createFile = useVaultStore((s) => s.createFile);
  const createFolder = useVaultStore((s) => s.createFolder);
  const deleteItem = useVaultStore((s) => s.deleteItem);
  const renameItem = useVaultStore((s) => s.renameItem);

  const isActive = node.type === "file" && activeFile === node.path;
  const displayName = node.type === "file" ? node.name.replace(/\.md$/, "") : node.name;

  const handleRename = async () => {
    const t = renameValue.trim();
    if (t && t !== displayName) {
      try { await renameItem(node.path, t); } catch (e) { console.error(e); }
    }
    setIsRenaming(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { setIsCreating(null); return; }
    try {
      if (isCreating === "file") await createFile(node.path, newName);
      else await createFolder(node.path, newName);
    } catch (e) { console.error(e); }
    setIsCreating(null);
    setNewName("");
    setExpanded(true);
  };

  const handleDelete = async () => {
    if (confirm(t("confirm_delete", { name: displayName }))) {
      try { await deleteItem(node.path); } catch (e) { console.error(e); }
    }
  };

  const contextItems = [
    ...(node.type === "folder"
      ? [
          {
            label: t("new_note"),
            icon: <FilePlus size={13} />,
            onClick: () => setIsCreating("file"),
          },
          {
            label: t("new_folder"),
            icon: <FolderPlus size={13} />,
            onClick: () => setIsCreating("folder"),
          },
        ]
      : []),
    {
      label: t("rename"),
      icon: <Pencil size={13} />,
      onClick: () => {
        setIsRenaming(true);
        setRenameValue(displayName);
      },
    },
    {
      label: t("delete"),
      icon: <Trash2 size={13} />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea, [role='menuitem']")) return;
    if (e.button !== 0) return;

    const row = rowRef.current;
    if (!row) return;

    dragState = {
      sourcePath: node.path,
      sourceName: displayName,
      sourceType: node.type,
      sourceEl: row,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      currentTarget: null,
      currentTargetEl: null,
      isOverRoot: false,
      rootDropEl: null,
      rootDropBounds: null,
      labelEl: null,
    };

    const handleMouseMove = (me: globalThis.MouseEvent) => {
      if (!dragState) return;
      const dx = me.clientX - dragState.startX;
      const dy = me.clientY - dragState.startY;
      if (!dragState.dragging && Math.sqrt(dx * dx + dy * dy) > 6) {
        dragState.dragging = true;
        document.body.style.cursor = "grabbing";
        document.body.classList.add("select-none");

        // 源元素变半透明
        if (dragState.sourceEl) {
          dragState.sourceEl.style.opacity = "0.4";
        }

        // 创建浮动标签
        const label = document.createElement("div");
        label.className = "fixed z-[100] flex items-center gap-1.5 px-2.5 py-1 bg-cloud/95 backdrop-blur-sm border border-paper-deep/40 rounded-lg shadow-lg pointer-events-none select-none whitespace-nowrap";
        label.style.left = `${me.clientX + 12}px`;
        label.style.top = `${me.clientY + 12}px`;

        // 图标
        const iconSpan = document.createElement("span");
        iconSpan.className = "flex items-center shrink-0";
        iconSpan.innerHTML = dragState.sourceType === "folder"
          ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:inherit;opacity:0.6"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
          : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:inherit;opacity:0.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;

        // 名称
        const nameSpan = document.createElement("span");
        nameSpan.className = "text-[12px] text-ink-soft font-body";
        nameSpan.textContent = dragState.sourceName;

        label.appendChild(iconSpan);
        label.appendChild(nameSpan);
        document.body.appendChild(label);
        dragState.labelEl = label;

        // 获取根区域元素的边界范围（只获取一次）
        const rootEl = document.querySelector<HTMLElement>("[data-drop-root]:not(.pointer-events-none)");
        if (rootEl) {
          dragState.rootDropEl = rootEl;
          dragState.rootDropBounds = rootEl.getBoundingClientRect();
          console.debug("[DnD] rootBounds cached", {
            left: dragState.rootDropBounds.left,
            top: dragState.rootDropBounds.top,
            width: dragState.rootDropBounds.width,
            height: dragState.rootDropBounds.height,
          });
        } else {
          console.debug("[DnD] rootEl NOT FOUND");
        }
      }
      if (!dragState.dragging) return;

      // Hit-test: find the folder element under cursor
      const el = document.elementFromPoint(me.clientX, me.clientY);
      const folderRow = el?.closest<HTMLElement>("[data-tree-path]");
      console.debug("[DnD] mouse=(", me.clientX, me.clientY, "), el=", el?.tagName, el?.className?.slice(0, 40), ", folderRow=", folderRow?.dataset?.treePath || null);
      if (folderRow) {
        const path = folderRow.dataset.treePath || "";
        if (dragState.sourcePath === path || dragState.sourcePath.startsWith(path + "/") || dragState.sourcePath.startsWith(path + "\\")) {
          // Invalid target (self or child)
          if (dragState.currentTargetEl) {
            dragState.currentTargetEl.style.outline = "";
            dragState.currentTargetEl.style.backgroundColor = "";
          }
          dragState.currentTarget = null;
          dragState.currentTargetEl = null;
          dragState.isOverRoot = false;
          if (dragState.rootDropEl) {
            dragState.rootDropEl.classList.remove("bg-bamboo-mist/30");
          }
          onDragTargetChange(null, null);
        } else {
          if (dragState.currentTargetEl && dragState.currentTargetEl !== folderRow) {
            dragState.currentTargetEl.style.outline = "";
            dragState.currentTargetEl.style.backgroundColor = "";
          }
          dragState.currentTarget = path;
          dragState.currentTargetEl = folderRow;
          dragState.isOverRoot = false;
          if (dragState.rootDropEl) {
            dragState.rootDropEl.classList.remove("bg-bamboo-mist/30");
          }
          folderRow.style.outline = "2px solid color-mix(in srgb, var(--accent) 50%, transparent)";
          folderRow.style.backgroundColor = "color-mix(in srgb, var(--accent) 10%, transparent)";
          onDragTargetChange(path, folderRow);
        }
      } else {
        // 检查鼠标是否在根区域边界范围内
        const bounds = dragState.rootDropBounds;
        const isInsideRoot = bounds &&
          me.clientX >= bounds.left &&
          me.clientX <= bounds.right &&
          me.clientY >= bounds.top &&
          me.clientY <= bounds.bottom;

        if (dragState.currentTargetEl) {
          dragState.currentTargetEl.style.outline = "";
          dragState.currentTargetEl.style.backgroundColor = "";
          dragState.currentTargetEl = null;
          dragState.currentTarget = null;
        }

        const sourceHasParent = dragState.sourcePath.includes("/") || dragState.sourcePath.includes("\\");
        if (isInsideRoot && sourceHasParent) {
          console.debug("[DnD] ROOT DROP ACTIVE — isInsideRoot=true, sourceHasParent=true, sourcePath=", dragState.sourcePath);
          dragState.isOverRoot = true;
          if (dragState.rootDropEl) {
            dragState.rootDropEl.classList.add("bg-bamboo-mist/30");
          }
        } else {
          dragState.isOverRoot = false;
          if (dragState.rootDropEl) {
            dragState.rootDropEl.classList.remove("bg-bamboo-mist/30");
          }
        }
        onDragTargetChange(null, null);
      }

      // 更新浮动标签位置
      if (dragState.labelEl) {
        dragState.labelEl.style.left = `${me.clientX + 12}px`;
        dragState.labelEl.style.top = `${me.clientY + 12}px`;
      }
    };

    const handleMouseUp = (me: globalThis.MouseEvent) => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.classList.remove("select-none");

      const ds = dragState;
      dragState = null;
      onDragTargetChange(null, null);

      if (ds?.dragging) {
        console.debug("[DnD] mouseup: currentTarget=", ds.currentTarget, "isOverRoot=", ds.isOverRoot, "sourcePath=", ds.sourcePath);
        if (ds.currentTarget) {
          const store = useVaultStore.getState();
          store.moveItem(ds.sourcePath, ds.currentTarget).catch(console.error);
        } else if (ds.isOverRoot && (ds.sourcePath.includes("/") || ds.sourcePath.includes("\\"))) {
          // Dropped on root area
          const store = useVaultStore.getState();
          store.moveItem(ds.sourcePath, "").catch(console.error);
        }
      }

      // Cleanup styles
      if (ds?.currentTargetEl) {
        ds.currentTargetEl.style.outline = "";
        ds.currentTargetEl.style.backgroundColor = "";
      }
      if (ds?.rootDropEl) {
        ds.rootDropEl.classList.remove("bg-bamboo-mist/30");
      }
      if (ds?.sourceEl) {
        ds.sourceEl.style.opacity = "";
      }
      if (ds?.labelEl) {
        ds.labelEl.remove();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [node.path, onDragTargetChange]);

  return (
    <div>
      {/* Tree item row */}
      <div
        ref={rowRef}
        data-tree-path={node.type === "folder" ? node.path : undefined}
        className={`group flex items-center gap-1 h-7 mx-1.5 rounded-lg cursor-pointer select-none transition-all duration-200 ${
          isActive
            ? "bg-bamboo-mist/70"
            : isDragOver
              ? "bg-bamboo-mist/40"
              : "hover:bg-paper-warm/70"
        }`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        onClick={() => {
          if (node.type === "folder") {
            setExpanded(!expanded);
          } else {
            openFile(node.path);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuPos({ x: e.clientX, y: e.clientY });
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Expand icon */}
        {node.type === "folder" ? (
          <span className={`shrink-0 text-ink-ghost/50 transition-transform duration-200`}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="w-[13px] shrink-0" />
        )}

        {/* Type icon */}
        {node.type === "folder" ? (
          expanded ? (
            <FolderOpen size={14} className="text-ink-ghost/60 shrink-0" />
          ) : (
            <Folder size={14} className="text-ink-ghost/60 shrink-0" />
          )
        ) : (
          <FileText size={13} className="text-ink-ghost/50 shrink-0" />
        )}

        {/* Name or rename */}
        {isRenaming ? (
          <input
            className="flex-1 bg-paper-warm text-[13px] px-1 py-0 rounded outline-none ring-1 ring-bamboo/50 min-w-0 text-ink font-body"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`text-[13px] truncate flex-1 min-w-0 pr-1 font-body ${
              isActive ? "text-bamboo font-medium" : "text-ink-soft"
            }`}
          >
            {displayName}
          </span>
        )}
      </div>

      {/* Context menu */}
      {menuPos && (
        <ContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)} items={contextItems} />
      )}

      {/* Inline create input */}
      {isCreating && (
        <div
          className="flex items-center gap-1 h-7 mx-1.5 rounded-lg"
          style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
        >
          {isCreating === "file" ? (
            <FileText size={13} className="text-ink-ghost/50 shrink-0" />
          ) : (
            <Folder size={13} className="text-ink-ghost/60 shrink-0" />
          )}
          <input
            className="flex-1 bg-paper-warm text-[13px] px-1.5 py-0 rounded outline-none ring-1 ring-bamboo/50 min-w-0 text-ink font-body placeholder:text-ink-ghost/60"
            placeholder={isCreating === "file" ? "笔记名" : "文件夹名"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleCreate}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setIsCreating(null); setNewName(""); }
            }}
            autoFocus
          />
        </div>
      )}

      {/* Children */}
      {node.type === "folder" && expanded && (
        <>
          {node.children?.map((child) => (
            <DraggableRow key={child.path} node={child} depth={depth + 1} onDragTargetChange={onDragTargetChange} />
          ))}
          {(!node.children || node.children.length === 0) && (
            <div
              className="text-[11px] text-ink-ghost/50 py-1 font-body"
              style={{ paddingLeft: `${(depth + 1) * 12 + 26}px` }}
            >
              {t("empty_folder")}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ===== FileTree Root ===== */
export function FileTree() {
  const tree = useVaultStore((s) => s.tree);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const createFile = useVaultStore((s) => s.createFile);
  const createFolder = useVaultStore((s) => s.createFolder);
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newName, setNewName] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const { t } = useI18n();

  // Track the current drag target from DraggableRow callbacks
  const rootDropRef = useRef<HTMLDivElement>(null);

  const handleCreateRoot = async () => {
    if (!newName.trim()) { setIsCreating(null); return; }
    try {
      if (isCreating === "file") await createFile("", newName);
      else await createFolder("", newName);
    } catch (e) { console.error(e); }
    setIsCreating(null);
    setNewName("");
  };

  const noteCount = tree.reduce((acc, n) => {
    if (n.type === "file") return acc + 1;
    return acc + (n.children?.length ?? 0);
  }, 0);

  const startCreate = (type: "file" | "folder") => {
    setIsCreating(type);
    setNewName("");
    setAddMenuOpen(false);
  };

  // Subscribe to drag target changes from DraggableRow
  const handleDragTargetChange = useCallback((_path: string | null, _el: HTMLElement | null) => {
    // Root drop is handled in DraggableRow's handleMouseMove (native event)
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-paper-deep shrink-0">
        <span className="text-[11px] font-semibold text-ink-faint font-body uppercase tracking-[0.5px]">
          {t("library")}
        </span>
        <div className="relative">
          <button
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
              isCreating || addMenuOpen
                ? "text-bamboo bg-bamboo-mist/50"
                : "text-ink-ghost hover:text-ink-faint hover:bg-paper-warm"
            }`}
            onClick={() => setAddMenuOpen(!addMenuOpen)}
          >
            <Plus size={14} />
          </button>
          {addMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAddMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 w-36 py-1 bg-cloud/95 backdrop-blur-sm border border-paper-deep/50 rounded-lg shadow-[0_4px_16px_var(--shadow-deep)]">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-ink-soft hover:bg-bamboo-mist/60 hover:text-bamboo transition-colors font-body"
                  onClick={() => startCreate("file")}
                >
                  <FileText size={13} />
                  {t("new_note")}
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-ink-soft hover:bg-bamboo-mist/60 hover:text-bamboo transition-colors font-body"
                  onClick={() => startCreate("folder")}
                >
                  <FolderPlus size={13} />
                  {t("new_folder")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tree area */}
      <div
        ref={rootDropRef}
        data-drop-root=""
        className="flex-1 overflow-y-auto scrollbar-hidden py-1.5 relative"
      >
        {vaultPath && tree.length === 0 && !isCreating && (
          <div className="px-4 py-16 text-center animate-fade-up">
            <p className="text-[13px] text-ink-ghost font-body">{t("empty_vault")}</p>
            <p className="text-[11px] text-ink-ghost/60 font-body mt-1">
              {t("empty_vault_hint")}
            </p>
          </div>
        )}

        {tree.map((node) => (
          <DraggableRow key={node.path} node={node} depth={0} onDragTargetChange={handleDragTargetChange} />
        ))}

        {/* Root-level create */}
        {isCreating && (
          <div className="flex items-center gap-1 h-7 mx-1.5 mt-1 px-1.5 rounded-lg">
            {isCreating === "file" ? (
              <FileText size={13} className="text-ink-ghost/50 shrink-0" />
            ) : (
              <Folder size={13} className="text-ink-ghost/60 shrink-0" />
            )}
            <input
              className="flex-1 bg-paper-warm text-[13px] px-1.5 py-0 rounded outline-none ring-1 ring-bamboo/50 min-w-0 text-ink font-body placeholder:text-ink-ghost/60"
              placeholder={isCreating === "file" ? t("note_name") : t("folder_name")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleCreateRoot}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateRoot();
                if (e.key === "Escape") { setIsCreating(null); setNewName(""); }
              }}
              autoFocus
            />
          </div>
        )}

        {/* Drag overlay for root drop visual highlight */}
        {dragState?.dragging && (
          <div className="absolute inset-0 z-20 pointer-events-none" />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-paper-deep/20 shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-ink-ghost/60 font-mono tabular-nums">
          {t("note_count", { n: noteCount })}
        </span>
      </div>
    </div>
  );
}
