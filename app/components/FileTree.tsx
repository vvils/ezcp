"use client";

import React from "react";
import { ProjectFile } from "@/types/framework";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";

interface FileTreeProps {
  files: ProjectFile[];
  onFileToggle: (file: ProjectFile) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: ProjectFile;
  expanded: boolean;
  selected: boolean;
  indeterminate?: boolean;
}

export function FileTree({
  files,
  onFileToggle,
  onSelectAll,
  onSelectNone,
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = React.useState<Set<string>>(
    new Set()
  );

  const tree = React.useMemo(() => buildTree(files), [files]);

  // Auto-expand first level directories on initial load only
  React.useEffect(() => {
    if (tree.length > 0 && expandedDirs.size === 0) {
      const firstLevelDirs = tree
        .filter((node) => node.isDirectory)
        .map((node) => node.path);
      setExpandedDirs(new Set(firstLevelDirs));
    }
  }, [tree, expandedDirs.size]);

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const handleDirectoryToggle = (dirPath: string) => {
    const dirFiles = files.filter(
      (file) =>
        file.relativePath.startsWith(dirPath + "/") ||
        file.relativePath === dirPath
    );

    const allSelected = dirFiles.every((file) => file.selected);

    // Toggle all files in directory
    dirFiles.forEach((file) => {
      if (file.selected === allSelected) {
        onFileToggle(file);
      }
    });
  };

  const getDirectoryState = (dirPath: string) => {
    const dirFiles = files.filter((file) =>
      file.relativePath.startsWith(dirPath + "/")
    );

    if (dirFiles.length === 0) return { selected: false, indeterminate: false };

    const selectedCount = dirFiles.filter((file) => file.selected).length;

    if (selectedCount === 0) return { selected: false, indeterminate: false };
    if (selectedCount === dirFiles.length)
      return { selected: true, indeterminate: false };
    return { selected: false, indeterminate: true };
  };

  const selectedCount = files.filter((f) => f.selected).length;
  const totalCount = files.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Project Files ({selectedCount}/{totalCount})
        </h3>
        <div className="space-x-3">
          <button
            onClick={onSelectAll}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            Select All
          </button>
          <button
            onClick={onSelectNone}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm"
          >
            Select None
          </button>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto">
        {renderTree(
          tree,
          expandedDirs,
          toggleDirectory,
          onFileToggle,
          handleDirectoryToggle,
          getDirectoryState
        )}
      </div>
    </div>
  );
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Create directory structure
  files.forEach((file) => {
    const parts = file.relativePath.split("/").filter(Boolean);
    let currentPath = "";
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let node = nodeMap.get(currentPath);
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
          expanded: true, // Default to expanded for better UX
          selected: isLast ? file?.selected || false : false,
        };
        nodeMap.set(currentPath, node);
        currentLevel.push(node);
      }

      if (!isLast) {
        currentLevel = node.children;
      }
    });
  });

  return sortTree(root);
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      // Directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((node) => ({
      ...node,
      children: sortTree(node.children),
    }));
}

function renderTree(
  nodes: TreeNode[],
  expandedDirs: Set<string>,
  toggleDirectory: (path: string) => void,
  onFileToggle: (file: ProjectFile) => void,
  handleDirectoryToggle: (dirPath: string) => void,
  getDirectoryState: (dirPath: string) => {
    selected: boolean;
    indeterminate: boolean;
  },
  depth: number = 0
): React.ReactNode {
  return nodes.map((node) => {
    const dirState = node.isDirectory ? getDirectoryState(node.path) : null;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-2 px-4 hover:bg-blue-50 transition-colors ${
            depth > 0 ? "border-l-2 border-gray-100 ml-4" : ""
          }`}
          style={{ paddingLeft: `${depth * 20 + 16}px` }}
        >
          {node.isDirectory ? (
            <>
              <input
                type="checkbox"
                checked={dirState?.selected || false}
                ref={(el) => {
                  if (el && dirState?.indeterminate) {
                    el.indeterminate = true;
                  }
                }}
                onChange={() => handleDirectoryToggle(node.path)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <button
                onClick={() => toggleDirectory(node.path)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 min-w-0 flex-1"
              >
                {expandedDirs.has(node.path) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                {expandedDirs.has(node.path) ? (
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                ) : (
                  <Folder className="w-5 h-5 text-blue-500" />
                )}
                <span className="font-medium text-gray-900 truncate">
                  {node.name}
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="w-4 mr-3" /> {/* Spacer for alignment */}
              <input
                type="checkbox"
                checked={node.file?.selected || false}
                onChange={() => node.file && onFileToggle(node.file)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <File className={`w-4 h-4 mr-2 ${getFileIcon(node.name)}`} />
              <div className="flex items-center justify-between w-full min-w-0">
                <span
                  className={`${getPriorityClass(node.file?.priority)} ${
                    node.file?.app ? "italic" : ""
                  } truncate`}
                >
                  {node.name}
                  {node.file?.app && (
                    <span className="text-xs text-blue-600 ml-1">
                      ({node.file.app})
                    </span>
                  )}
                </span>
                <span className="ml-4 text-xs text-gray-500 flex-shrink-0">
                  {formatFileSize(node.file?.size || 0)}
                </span>
              </div>
            </>
          )}
        </div>

        {node.isDirectory &&
          expandedDirs.has(node.path) &&
          node.children.length > 0 && (
            <div>
              {renderTree(
                node.children,
                expandedDirs,
                toggleDirectory,
                onFileToggle,
                handleDirectoryToggle,
                getDirectoryState,
                depth + 1
              )}
            </div>
          )}
      </div>
    );
  });
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py":
      return "text-yellow-600";
    case "js":
    case "jsx":
      return "text-yellow-500";
    case "ts":
    case "tsx":
      return "text-blue-600";
    case "html":
      return "text-orange-500";
    case "css":
    case "scss":
      return "text-blue-500";
    case "json":
      return "text-green-600";
    case "md":
      return "text-gray-600";
    default:
      return "text-gray-500";
  }
}

function getPriorityClass(priority?: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "font-semibold text-green-700";
    case "medium":
      return "text-gray-800";
    case "low":
      return "text-gray-600";
    default:
      return "text-gray-800";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
