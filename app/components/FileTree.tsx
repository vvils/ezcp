"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ProjectFile } from "@/types/framework";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Search,
  X,
  Loader,
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
  matchesSearch?: boolean;
  hasMatchingChildren?: boolean;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set());
  const [searchDebounceTimeout, setSearchDebounceTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setSearchResults(new Set());
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        // Simulate search delay and scan file contents
        const matchingFiles = new Set<string>();
        const searchLower = term.toLowerCase();

        for (const file of files) {
          if (!file.isDirectory) {
            // Search in file content and filename
            const contentMatches = file.content
              .toLowerCase()
              .includes(searchLower);
            const nameMatches = file.name.toLowerCase().includes(searchLower);
            const pathMatches = file.relativePath
              .toLowerCase()
              .includes(searchLower);

            if (contentMatches || nameMatches || pathMatches) {
              matchingFiles.add(file.relativePath);
            }
          }
        }

        setSearchResults(matchingFiles);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(new Set());
      } finally {
        setIsSearching(false);
      }
    },
    [files]
  );

  // Handle search input with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      // Clear existing timeout
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        performSearch(value);
      }, 300);

      setSearchDebounceTimeout(timeout);
    },
    [searchDebounceTimeout, performSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults(new Set());
    setIsSearching(false);
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }
  }, [searchDebounceTimeout]);

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim() || searchResults.size === 0) {
      return files;
    }

    return files.filter((file) => {
      if (file.isDirectory) {
        // Include directories that contain matching files
        return files.some(
          (f) =>
            !f.isDirectory &&
            f.relativePath.startsWith(file.relativePath + "/") &&
            searchResults.has(f.relativePath)
        );
      } else {
        return searchResults.has(file.relativePath);
      }
    });
  }, [files, searchTerm, searchResults]);

  const tree = React.useMemo(
    () => buildTreeWithSearch(filteredFiles, searchResults),
    [filteredFiles, searchResults]
  );

  // Auto-expand first level directories on initial load only
  React.useEffect(() => {
    if (tree.length > 0 && expandedDirs.size === 0) {
      const firstLevelDirs = tree
        .filter((node) => node.isDirectory)
        .map((node) => node.path);
      setExpandedDirs(new Set(firstLevelDirs));
    }
  }, [tree, expandedDirs.size]);

  // Auto-expand directories with search matches
  React.useEffect(() => {
    if (searchResults.size > 0) {
      const dirsToExpand = new Set(expandedDirs);
      searchResults.forEach((filePath) => {
        const pathParts = filePath.split("/");
        let currentPath = "";
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentPath = currentPath
            ? `${currentPath}/${pathParts[i]}`
            : pathParts[i];
          dirsToExpand.add(currentPath);
        }
      });
      setExpandedDirs(dirsToExpand);
    }
  }, [searchResults, expandedDirs]);

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
    const dirFiles = filteredFiles.filter(
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
    const dirFiles = filteredFiles.filter((file) =>
      file.relativePath.startsWith(dirPath + "/")
    );

    if (dirFiles.length === 0) return { selected: false, indeterminate: false };

    const selectedCount = dirFiles.filter((file) => file.selected).length;

    if (selectedCount === 0) return { selected: false, indeterminate: false };
    if (selectedCount === dirFiles.length)
      return { selected: true, indeterminate: false };
    return { selected: false, indeterminate: true };
  };

  const selectedCount = filteredFiles.filter((f) => f.selected).length;
  const totalCount = filteredFiles.length;
  const originalTotalCount = files.length;

  // Calculate token and character counts for selected files
  const selectedFiles = filteredFiles.filter((f) => f.selected);
  const totalCharacters = selectedFiles.reduce(
    (sum, file) => sum + file.content.length,
    0
  );
  const estimatedTokens = Math.ceil(totalCharacters / 4);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search files by content, name, or path..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="mt-2 text-xs text-gray-600">
            {isSearching
              ? "Searching..."
              : searchResults.size > 0
              ? `Found ${searchResults.size} matching file${
                  searchResults.size === 1 ? "" : "s"
                }`
              : "No files match your search"}
          </div>
        )}
      </div>

      {/* File Count Header */}
      <div className="flex justify-between items-center p-6 bg-gray-50 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Project Files ({selectedCount}/{totalCount}
            {totalCount !== originalTotalCount && ` of ${originalTotalCount}`})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            ~{estimatedTokens.toLocaleString()} tokens (
            {totalCharacters.toLocaleString()} characters)
          </p>
        </div>
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
        {tree.length > 0 ? (
          renderTree(
            tree,
            expandedDirs,
            toggleDirectory,
            onFileToggle,
            handleDirectoryToggle,
            getDirectoryState,
            searchResults
          )
        ) : searchTerm && !isSearching ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files match your search criteria.</p>
            <button
              onClick={clearSearch}
              className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
            >
              Clear search to view all files
            </button>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function buildTreeWithSearch(
  files: ProjectFile[],
  searchResults: Set<string>
): TreeNode[] {
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
        const matchesSearch =
          !file.isDirectory && searchResults.has(file.relativePath);

        node = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
          expanded: true,
          selected: isLast ? file?.selected || false : false,
          matchesSearch,
          hasMatchingChildren: false,
        };
        nodeMap.set(currentPath, node);
        currentLevel.push(node);
      }

      if (!isLast) {
        currentLevel = node.children;
      }
    });
  });

  // Mark directories that have matching children
  const markDirectoriesWithMatches = (nodes: TreeNode[]): boolean => {
    let hasMatches = false;
    for (const node of nodes) {
      if (node.isDirectory) {
        const childrenHaveMatches = markDirectoriesWithMatches(node.children);
        node.hasMatchingChildren = childrenHaveMatches;
        if (childrenHaveMatches) hasMatches = true;
      } else if (node.matchesSearch) {
        hasMatches = true;
      }
    }
    return hasMatches;
  };

  markDirectoriesWithMatches(root);

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
  searchResults: Set<string>,
  depth: number = 0
): React.ReactNode {
  return nodes.map((node) => {
    const isExpanded = expandedDirs.has(node.path);
    const hasSearchMatch = node.matchesSearch || node.hasMatchingChildren;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-2 px-4 hover:bg-gray-50 border-b border-gray-100 ${
            hasSearchMatch ? "bg-yellow-50" : ""
          }`}
          style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
        >
          {node.isDirectory ? (
            <>
              <button
                onClick={() => toggleDirectory(node.path)}
                className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>

              <div className="flex items-center flex-1 min-w-0">
                {isExpanded ? (
                  <FolderOpen className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                ) : (
                  <Folder className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                )}

                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium text-gray-900 truncate ${
                      hasSearchMatch ? "text-yellow-800" : ""
                    }`}
                  >
                    {node.name}
                    {node.hasMatchingChildren && searchResults.size > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        contains matches
                      </span>
                    )}
                  </span>

                  <div className="flex items-center ml-3">
                    <input
                      type="checkbox"
                      checked={getDirectoryState(node.path).selected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = getDirectoryState(
                            node.path
                          ).indeterminate;
                        }
                      }}
                      onChange={() => handleDirectoryToggle(node.path)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-6 mr-2"></div>
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 mr-3">
                  <File
                    className={`h-4 w-4 ${
                      hasSearchMatch ? "text-yellow-600" : "text-gray-400"
                    }`}
                  />
                  <span className="text-xs ml-1">{getFileIcon(node.name)}</span>
                </div>

                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-sm text-gray-700 truncate ${
                        hasSearchMatch ? "font-medium text-yellow-800" : ""
                      }`}
                    >
                      {node.name}
                      {hasSearchMatch && searchResults.size > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          match
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(node.file?.size || 0)}
                      </span>
                      {node.file?.priority && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${getPriorityClass(
                            node.file.priority
                          )}`}
                        >
                          {node.file.priority}
                        </span>
                      )}
                      {node.file?.app && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {node.file.app}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center ml-3">
                    <input
                      type="checkbox"
                      checked={node.file?.selected || false}
                      onChange={() => node.file && onFileToggle(node.file)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {node.isDirectory && isExpanded && (
          <div>
            {renderTree(
              node.children,
              expandedDirs,
              toggleDirectory,
              onFileToggle,
              handleDirectoryToggle,
              getDirectoryState,
              searchResults,
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
