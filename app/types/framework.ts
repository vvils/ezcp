export interface FrameworkConfig {
  name: string;
  displayName: string;
  version?: string;
  icon: string;
  detector: (files: FileList) => Promise<boolean>;
  excludePatterns: string[];
  includePatterns?: string[];
  priorityFiles: string[];
  appDetector?: (files: FileList) => Promise<string[]>;
  outputFormatter: (
    projectName: string,
    files: ProjectFile[],
    apps?: string[]
  ) => string;
}

export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  size: number;
  isDirectory: boolean;
  relativePath: string;
  selected: boolean;
  priority: "high" | "medium" | "low";
  app?: string;
}

export interface ProjectStructure {
  name: string;
  framework: FrameworkConfig;
  files: ProjectFile[];
  apps: string[];
  totalSize: number;
  selectedFiles: number;
}

export type FrameworkType =
  | "django"
  | "flask"
  | "react"
  | "laravel"
  | "spring"
  | "unknown";
