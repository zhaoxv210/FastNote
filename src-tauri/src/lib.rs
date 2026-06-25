use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Represents a node in the file tree
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum TreeNode {
    File {
        name: String,
        path: String,
    },
    Folder {
        name: String,
        path: String,
        children: Vec<TreeNode>,
    },
}

/// Search result item
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub file_name: String,
    pub file_path: String,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchMatch {
    pub line_number: usize,
    pub line_content: String,
}

/// Store the vault path in Tauri managed state
#[allow(dead_code)]
struct VaultPath(std::sync::Mutex<Option<String>>);

/// Build a tree structure from a directory path
fn build_tree(dir_path: &Path, base_path: &Path) -> Vec<TreeNode> {
    let mut children = Vec::new();

    if let Ok(entries) = fs::read_dir(dir_path) {
        let mut entry_list: Vec<_> = entries.filter_map(|e| e.ok()).collect();
        // Sort: folders first, then files, both alphabetically
        entry_list.sort_by(|a, b| {
            let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
            if a_is_dir == b_is_dir {
                a.file_name().cmp(&b.file_name())
            } else if a_is_dir {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        });

        for entry in entry_list {
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();

            // Skip hidden files/dirs and non-markdown files (but keep dirs)
            if file_name.starts_with('.') {
                continue;
            }

            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                let sub_children = build_tree(&path, base_path);
                let rel_path = path
                    .strip_prefix(base_path)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();

                children.push(TreeNode::Folder {
                    name: file_name,
                    path: rel_path,
                    children: sub_children,
                });
            } else if file_name.ends_with(".md") {
                let rel_path = path
                    .strip_prefix(base_path)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();

                children.push(TreeNode::File {
                    name: file_name,
                    path: rel_path,
                });
            }
        }
    }

    children
}

/// Get the directory tree of the vault
#[tauri::command]
fn get_tree(vault_path: String) -> Result<Vec<TreeNode>, String> {
    let path = Path::new(&vault_path);
    if !path.exists() || !path.is_dir() {
        return Err(format!("路径不存在或不是目录: {}", vault_path));
    }
    Ok(build_tree(path, path))
}

/// Open a file and return its content
#[tauri::command]
fn open_file(vault_path: String, file_path: String) -> Result<String, String> {
    let full_path = Path::new(&vault_path).join(&file_path);
    if !full_path.exists() {
        return Err(format!("文件不存在: {}", full_path.display()));
    }
    fs::read_to_string(&full_path).map_err(|e| format!("读取文件失败: {}", e))
}

/// Save content to a file (auto-create parent dirs)
#[tauri::command]
fn save_file(vault_path: String, file_path: String, content: String) -> Result<(), String> {
    let full_path = Path::new(&vault_path).join(&file_path);
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    fs::write(&full_path, &content).map_err(|e| format!("保存文件失败: {}", e))
}

/// Create a new file
#[tauri::command]
fn create_file(vault_path: String, parent: String, name: String) -> Result<String, String> {
    let file_name = if name.ends_with(".md") {
        name
    } else {
        format!("{}.md", name)
    };

    let full_path = Path::new(&vault_path).join(&parent).join(&file_name);

    if full_path.exists() {
        return Err(format!("文件已存在: {}", full_path.display()));
    }

    // Ensure parent directory exists
    if let Some(parent_dir) = full_path.parent() {
        fs::create_dir_all(parent_dir).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    fs::write(&full_path, "").map_err(|e| format!("创建文件失败: {}", e))?;

    let rel_path = full_path
        .strip_prefix(&vault_path)
        .unwrap_or(&full_path)
        .to_string_lossy()
        .to_string();

    Ok(rel_path)
}

/// Create a new folder
#[tauri::command]
fn create_folder(vault_path: String, parent: String, name: String) -> Result<String, String> {
    let full_path = Path::new(&vault_path).join(&parent).join(&name);

    if full_path.exists() {
        return Err(format!("目录已存在: {}", full_path.display()));
    }

    fs::create_dir_all(&full_path).map_err(|e| format!("创建目录失败: {}", e))?;

    let rel_path = full_path
        .strip_prefix(&vault_path)
        .unwrap_or(&full_path)
        .to_string_lossy()
        .to_string();

    Ok(rel_path)
}

/// Delete a file or folder
#[tauri::command]
fn delete_item(vault_path: String, path: String) -> Result<(), String> {
    let full_path = Path::new(&vault_path).join(&path);

    if !full_path.exists() {
        return Err(format!("路径不存在: {}", full_path.display()));
    }

    if full_path.is_dir() {
        fs::remove_dir_all(&full_path).map_err(|e| format!("删除目录失败: {}", e))?;
    } else {
        fs::remove_file(&full_path).map_err(|e| format!("删除文件失败: {}", e))?;
    }

    Ok(())
}

/// Move a file or folder into a target directory
#[tauri::command]
fn move_item(vault_path: String, source: String, target_dir: String) -> Result<String, String> {
    let src_path = Path::new(&vault_path).join(&source);
    if !src_path.exists() {
        return Err(format!("源路径不存在: {}", src_path.display()));
    }

    let dst_dir = Path::new(&vault_path).join(&target_dir);
    if !dst_dir.exists() || !dst_dir.is_dir() {
        return Err(format!("目标目录不存在: {}", dst_dir.display()));
    }

    // Check: destination is inside source (cannot move folder into itself)
    let src_canonical = src_path.canonicalize().map_err(|e| e.to_string())?;
    let dst_canonical = dst_dir.canonicalize().map_err(|e| e.to_string())?;
    if dst_canonical.starts_with(&src_canonical) {
        return Err("不能将文件夹移动到自身或子目录中".to_string());
    }
    // Check: source is already directly in target (no-op)
    if let Some(parent) = src_path.parent() {
        if parent == dst_dir {
            let p = dst_dir.display();
            return Err(format!("已在目标目录中: {}", p));
        }
    }

    let file_name = src_path
        .file_name()
        .ok_or("无法获取文件名")?;
    let dst_path = dst_dir.join(file_name);

    if dst_path.exists() {
        return Err(format!("目标已存在: {}", dst_path.display()));
    }

    fs::rename(&src_path, &dst_path).map_err(|e| format!("移动失败: {}", e))?;

    let rel_path = dst_path
        .strip_prefix(&vault_path)
        .unwrap_or(&dst_path)
        .to_string_lossy()
        .to_string();

    Ok(rel_path)
}

/// Rename a file or folder
#[tauri::command]
fn rename_item(vault_path: String, path: String, new_name: String) -> Result<String, String> {
    let full_path = Path::new(&vault_path).join(&path);

    if !full_path.exists() {
        return Err(format!("路径不存在: {}", full_path.display()));
    }

    let parent = full_path
        .parent()
        .ok_or("无法获取父目录")?;
    let new_path = parent.join(&new_name);

    if new_path.exists() {
        return Err(format!("目标已存在: {}", new_path.display()));
    }

    // If renaming a .md file and new_name doesn't have extension, add it
    let final_new_name = if full_path.is_file()
        && full_path.extension().map(|e| e == "md").unwrap_or(false)
        && !new_name.ends_with(".md")
    {
        format!("{}.md", new_name)
    } else {
        new_name.to_string()
    };

    let final_new_path = parent.join(&final_new_name);

    fs::rename(&full_path, &final_new_path).map_err(|e| format!("重命名失败: {}", e))?;

    let rel_path = final_new_path
        .strip_prefix(&vault_path)
        .unwrap_or(&final_new_path)
        .to_string_lossy()
        .to_string();

    Ok(rel_path)
}

/// Search for a keyword across all markdown files
#[tauri::command]
fn search(vault_path: String, keyword: String) -> Result<Vec<SearchResult>, String> {
    let mut results: Vec<SearchResult> = Vec::new();
    let keyword_lower = keyword.to_lowercase();

    for entry in WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if path.is_file()
            && path.extension().map(|e| e == "md").unwrap_or(false)
        {
            let file_name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            // Check title match first
            let title_match = file_name.to_lowercase().contains(&keyword_lower);

            // Read file content
            match fs::read_to_string(path) {
                Ok(content) => {
                    let mut matches: Vec<SearchMatch> = Vec::new();

                    // If title matches, add it even if content doesn't
                    if title_match {
                        matches.push(SearchMatch {
                            line_number: 0,
                            line_content: format!("📄 标题匹配: {}", file_name),
                        });
                    }

                    // Search content
                    for (i, line) in content.lines().enumerate() {
                        if line.to_lowercase().contains(&keyword_lower) {
                            let trimmed = line.trim();
                            if !trimmed.is_empty() {
                                matches.push(SearchMatch {
                                    line_number: i + 1,
                                    line_content: trimmed.to_string(),
                                });
                            }
                        }
                    }

                    if !matches.is_empty() {
                        let rel_path = path
                            .strip_prefix(&vault_path)
                            .unwrap_or(path)
                            .to_string_lossy()
                            .to_string();

                        results.push(SearchResult {
                            file_name,
                            file_path: rel_path,
                            matches,
                        });
                    }
                }
                Err(_) => continue,
            }
        }
    }

    // Sort: most matches first
    results.sort_by(|a, b| b.matches.len().cmp(&a.matches.len()));

    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(VaultPath(std::sync::Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            get_tree,
            open_file,
            save_file,
            create_file,
            create_folder,
            delete_item,
            rename_item,
            move_item,
            search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running FastNote");
}
