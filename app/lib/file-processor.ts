import { ProjectFile, FrameworkConfig } from "@/types/framework";

export interface ProcessingOptions {
  includeTests?: boolean;
  customExcludes?: string[];
  maxFileSize?: number; // in bytes
}

export const processFiles = async (
  files: FileList,
  framework: FrameworkConfig,
  options: ProcessingOptions = {}
): Promise<ProjectFile[]> => {
  const {
    includeTests = false,
    customExcludes = [],
    maxFileSize = 1024 * 1024,
  } = options;

  const excludePatterns = [
    ...framework.excludePatterns,
    ...customExcludes,
    ...(includeTests ? [] : ["*test*", "*spec*", "tests/", "test_*"]),
  ];

  const processedFiles: ProjectFile[] = [];
  const apps = framework.appDetector ? await framework.appDetector(files) : [];

  for (const file of Array.from(files)) {
    if (file.size > maxFileSize) continue;
    if (shouldExcludeFile(file, excludePatterns)) continue;
    if (!isTextFile(file.name)) continue;

    try {
      const content = await readFileContent(file);
      const relativePath = file.webkitRelativePath || file.name;
      const app = detectFileApp(relativePath, apps);
      const priority = getFilePriority(file.name, framework.priorityFiles);

      processedFiles.push({
        path: file.webkitRelativePath || file.name,
        name: file.name,
        content,
        size: file.size,
        isDirectory: false,
        relativePath,
        selected: priority === "high", // Auto-select high priority files
        priority,
        app,
      });
    } catch (error) {
      console.warn(`Failed to read file ${file.name}:`, error);
    }
  }

  return processedFiles.sort(sortFilesByPriority);
};

const shouldExcludeFile = (file: File, excludePatterns: string[]): boolean => {
  const path = file.webkitRelativePath || file.name;

  return excludePatterns.some((pattern) => {
    if (pattern.endsWith("/")) {
      // Directory pattern
      return path.includes(pattern) || path.includes(pattern.slice(0, -1));
    } else if (pattern.includes("*")) {
      // Glob pattern - simple implementation
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(path) || regex.test(file.name);
    } else {
      // Exact match
      return path.includes(pattern) || file.name === pattern;
    }
  });
};

const isTextFile = (filename: string): boolean => {
  const textExtensions = [
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
    ".scss",
    ".sass",
    ".json",
    ".xml",
    ".yml",
    ".yaml",
    ".md",
    ".txt",
    ".ini",
    ".cfg",
    ".conf",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".vb",
    ".swift",
    ".kt",
    ".scala",
  ];

  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return textExtensions.includes(ext) || !filename.includes(".");
};

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const detectFileApp = (
  relativePath: string,
  apps: string[]
): string | undefined => {
  const pathParts = relativePath.split("/");

  for (const app of apps) {
    if (pathParts.includes(app)) {
      return app;
    }
  }

  return undefined;
};

const getFilePriority = (
  filename: string,
  priorityFiles: string[]
): "high" | "medium" | "low" => {
  if (priorityFiles.some((pf) => filename === pf || filename.endsWith(pf))) {
    return "high";
  }

  if (filename.includes("test") || filename.includes("spec")) {
    return "low";
  }

  return "medium";
};

const sortFilesByPriority = (a: ProjectFile, b: ProjectFile): number => {
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }

  return a.relativePath.localeCompare(b.relativePath);
};

export const generateOutput = (
  projectName: string,
  files: ProjectFile[],
  framework: FrameworkConfig,
  apps: string[] = []
): string => {
  return framework.outputFormatter(projectName, files, apps);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);

    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }
};
