import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { TreeNode, SearchResult } from "@/types";

interface VaultStore {
  // State
  vaultPath: string | null;
  tree: TreeNode[];
  activeFile: string | null;
  activeContent: string;
  isDirty: boolean;
  searchResults: SearchResult[];
  isSearchOpen: boolean;
  isLoading: boolean;
  savedContent: string;

  // Actions
  setVaultPath: (path: string) => void;
  switchVault: (path: string) => void;
  loadTree: () => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
  saveFile: () => Promise<void>;
  setActiveContent: (content: string) => void;
  createFile: (parent: string, name: string) => Promise<void>;
  createFolder: (parent: string, name: string) => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  renameItem: (path: string, newName: string) => Promise<void>;
  moveItem: (source: string, targetDir: string) => Promise<void>;
  search: (keyword: string) => Promise<void>;
  setSearchOpen: (open: boolean) => void;
  clearSearch: () => void;
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  vaultPath: null,
  tree: [],
  activeFile: null,
  activeContent: "",
  isDirty: false,
  searchResults: [],
  isSearchOpen: false,
  isLoading: false,
  savedContent: "",

  setVaultPath: (path: string) => {
    set({ vaultPath: path });
    localStorage.setItem("fastnote-vault-path", path);
  },

  switchVault: (path: string) => {
    const { isDirty, activeFile, activeContent, savedContent } = get();
    
    // Auto-save current file if dirty
    if (isDirty && activeFile && activeContent !== savedContent) {
      invoke("save_file", {
        vaultPath: get().vaultPath,
        filePath: activeFile,
        content: activeContent,
      }).catch((err) => console.error("Auto-save failed:", err));
    }
    
    // Clear state and set new vault
    set({
      vaultPath: path,
      tree: [],
      activeFile: null,
      activeContent: "",
      isDirty: false,
      savedContent: "",
      searchResults: [],
      isSearchOpen: false,
    });
    localStorage.setItem("fastnote-vault-path", path);
  },

  loadTree: async () => {
    const { vaultPath } = get();
    if (!vaultPath) return;

    try {
      const tree = await invoke<TreeNode[]>("get_tree", {
        vaultPath,
      });
      set({ tree });
    } catch (err) {
      console.error("Failed to load tree:", err);
    }
  },

  openFile: async (filePath: string) => {
    const { vaultPath, isDirty, activeFile, activeContent } = get();

    // Auto-save current file if dirty
    if (isDirty && activeFile && activeContent !== get().savedContent) {
      try {
        await invoke("save_file", {
          vaultPath,
          filePath: activeFile,
          content: activeContent,
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }

    try {
      const content = await invoke<string>("open_file", {
        vaultPath,
        filePath,
      });
      set({
        activeFile: filePath,
        activeContent: content,
        savedContent: content,
        isDirty: false,
      });
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  },

  saveFile: async () => {
    const { vaultPath, activeFile, activeContent } = get();
    if (!vaultPath || !activeFile) return;

    try {
      await invoke("save_file", {
        vaultPath,
        filePath: activeFile,
        content: activeContent,
      });
      set({ isDirty: false, savedContent: activeContent });
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  },

  setActiveContent: (content: string) => {
    const { savedContent } = get();
    set({
      activeContent: content,
      isDirty: content !== savedContent,
    });
  },

  createFile: async (parent: string, name: string) => {
    const { vaultPath, loadTree } = get();
    if (!vaultPath) return;

    try {
      const filePath = await invoke<string>("create_file", {
        vaultPath,
        parent,
        name,
      });
      await loadTree();
      // Auto-open the new file
      await get().openFile(filePath);
    } catch (err) {
      console.error("Failed to create file:", err);
      throw err;
    }
  },

  createFolder: async (parent: string, name: string) => {
    const { vaultPath, loadTree } = get();
    if (!vaultPath) return;

    try {
      await invoke<string>("create_folder", {
        vaultPath,
        parent,
        name,
      });
      await loadTree();
    } catch (err) {
      console.error("Failed to create folder:", err);
      throw err;
    }
  },

  deleteItem: async (path: string) => {
    const { vaultPath, loadTree, activeFile } = get();
    if (!vaultPath) return;

    try {
      await invoke("delete_item", { vaultPath, path });
      // If deleted file was active, clear editor
      if (activeFile === path || activeFile?.startsWith(path + "/")) {
        set({ activeFile: null, activeContent: "", isDirty: false, savedContent: "" });
      }
      await loadTree();
    } catch (err) {
      console.error("Failed to delete:", err);
      throw err;
    }
  },

  renameItem: async (path: string, newName: string) => {
    const { vaultPath, loadTree, activeFile } = get();
    if (!vaultPath) return;

    try {
      const newPath = await invoke<string>("rename_item", {
        vaultPath,
        path,
        newName,
      });
      // Update active file if it was renamed
      if (activeFile === path) {
        set({ activeFile: newPath });
      }
      await loadTree();
    } catch (err) {
      console.error("Failed to rename:", err);
      throw err;
    }
  },

  moveItem: async (source: string, targetDir: string) => {
    const { vaultPath, activeFile, loadTree } = get();
    if (!vaultPath) return;

    // Don't move if already in the target directory
    const sourceDir = source.split("/").slice(0, -1).join("/");
    if (sourceDir === targetDir) return;

    try {
      const newPath = await invoke<string>("move_item", {
        vaultPath,
        source,
        targetDir,
      });
      // Update active file if it was moved
      if (activeFile === source) {
        set({ activeFile: newPath });
      } else if (activeFile && activeFile.startsWith(source + "/")) {
        set({ activeFile: activeFile.replace(source, newPath) });
      }
      await loadTree();
    } catch (err) {
      console.error("Failed to move item:", err);
      throw err;
    }
  },

  search: async (keyword: string) => {
    const { vaultPath } = get();
    if (!vaultPath || !keyword.trim()) {
      set({ searchResults: [], isSearchOpen: false });
      return;
    }

    try {
      const results = await invoke<SearchResult[]>("search", {
        vaultPath,
        keyword,
      });
      set({ searchResults: results, isSearchOpen: true });
    } catch (err) {
      console.error("Search failed:", err);
    }
  },

  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

  clearSearch: () =>
    set({ searchResults: [], isSearchOpen: false }),
}));
