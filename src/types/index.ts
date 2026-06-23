export interface TreeNode {
  type: "file" | "folder";
  name: string;
  path: string;
  children?: TreeNode[];
}

export interface SearchMatch {
  line_number: number;
  line_content: string;
}

export interface SearchResult {
  file_name: string;
  file_path: string;
  matches: SearchMatch[];
}

export interface VaultState {
  vaultPath: string | null;
  tree: TreeNode[];
  activeFile: string | null;
  activeContent: string;
  isDirty: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchOpen: boolean;
  isLoading: boolean;
}
