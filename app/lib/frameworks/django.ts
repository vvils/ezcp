import { FrameworkConfig, ProjectFile } from "@/types/framework";

const djangoDetector = async (files: FileList): Promise<boolean> => {
  const fileNames = Array.from(files).map((file) => file.name);
  const hasManagePy = fileNames.includes("manage.py");

  // Look for settings.py in any subdirectory
  const hasSettings = Array.from(files).some((file) =>
    file.webkitRelativePath?.includes("settings.py")
  );

  return hasManagePy && hasSettings;
};

const djangoAppDetector = async (files: FileList): Promise<string[]> => {
  const apps: Set<string> = new Set();

  Array.from(files).forEach((file) => {
    const path = file.webkitRelativePath || "";
    const parts = path.split("/");

    // Look for Django app indicators
    if (
      parts.length >= 2 &&
      (path.includes("/models.py") ||
        path.includes("/views.py") ||
        path.includes("/apps.py"))
    ) {
      // Get the app directory name (parent of models.py, views.py, etc.)
      const appDir = parts[parts.length - 2];
      if (appDir && appDir !== parts[0]) {
        // Not the root project directory
        apps.add(appDir);
      }
    }
  });

  return Array.from(apps);
};

const djangoOutputFormatter = (
  projectName: string,
  files: ProjectFile[],
  apps: string[] = []
): string => {
  const selectedFiles = files.filter((f) => f.selected);
  const totalChars = selectedFiles.reduce(
    (sum, f) => sum + f.content.length,
    0
  );

  // Generate project structure
  const structure = generateDjangoStructure(selectedFiles);

  let output = `=== DJANGO PROJECT: ${projectName} ===\n`;
  output += `Framework: Django\n`;
  if (apps.length > 0) {
    output += `Apps detected: ${apps.join(", ")}\n`;
  }
  output += `Selected files: ${selectedFiles.length}\n`;
  output += `Total characters: ${totalChars.toLocaleString()}\n\n`;

  output += `=== PROJECT STRUCTURE ===\n`;
  output += structure;
  output += `\n=== FILE CONTENTS ===\n\n`;

  // Group files by app and priority
  const groupedFiles = groupFilesByApp(selectedFiles, apps);

  // Output core project files first
  if (groupedFiles.core.length > 0) {
    groupedFiles.core.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output app files grouped by app
  Object.entries(groupedFiles.apps).forEach(([appName, appFiles]) => {
    if (appFiles.length > 0) {
      output += `--- ${appName.toUpperCase()} APP ---\n\n`;
      appFiles.forEach((file) => {
        output += `--- ${file.relativePath} ---\n`;
        output += file.content;
        output += `\n\n`;
      });
    }
  });

  return output;
};

type TreeNode = { [key: string]: TreeNode | null };

const generateDjangoStructure = (files: ProjectFile[]): string => {
  const tree: TreeNode = {};

  files.forEach((file) => {
    const parts = file.relativePath.split("/").filter((p) => p);
    let current = tree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      if (index < parts.length - 1 && current[part]) {
        current = current[part] as TreeNode;
      }
    });
  });

  return renderTree(tree, "", true);
};

const renderTree = (
  node: TreeNode,
  prefix: string = "",
  isRoot: boolean = false
): string => {
  let result = "";
  const entries = Object.entries(node);

  entries.forEach(([name, value], index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const newPrefix = prefix + (isLast ? "    " : "│   ");

    result += `${prefix}${isRoot ? "" : connector}${name}${
      value === null ? "" : "/"
    }\n`;

    if (value !== null && typeof value === "object") {
      result += renderTree(value, newPrefix);
    }
  });

  return result;
};

const groupFilesByApp = (files: ProjectFile[], apps: string[]) => {
  const core: ProjectFile[] = [];
  const appFiles: { [key: string]: ProjectFile[] } = {};

  apps.forEach((app) => {
    appFiles[app] = [];
  });

  files.forEach((file) => {
    if (file.app && apps.includes(file.app)) {
      appFiles[file.app].push(file);
    } else {
      core.push(file);
    }
  });

  return { core, apps: appFiles };
};

export const djangoConfig: FrameworkConfig = {
  name: "django",
  displayName: "Django",
  icon: "🎯",
  detector: djangoDetector,
  appDetector: djangoAppDetector,
  excludePatterns: [
    "__pycache__/",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".Python",
    "venv/",
    ".venv/",
    "env/",
    ".env/",
    "ENV/",
    "env.bak/",
    "venv.bak/",
    "site-packages/",
    ".git/",
    ".gitignore",
    ".DS_Store",
    "*.log",
    "logs/",
    "db.sqlite3",
    "db.sqlite",
    "*/migrations/",
    "*/migration/",
    "static/collected/",
    "static/admin/",
    "media/uploads/",
    "media/cache/",
    "celerybeat-schedule",
    "celerybeat.pid",
    "*.egg-info/",
    "dist/",
    "build/",
    ".coverage",
    "htmlcov/",
    ".pytest_cache/",
    ".mypy_cache/",
    ".tox/",
    "node_modules/",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
  ],
  priorityFiles: [
    "manage.py",
    "requirements.txt",
    "settings.py",
    "urls.py",
    "wsgi.py",
    "asgi.py",
    "models.py",
    "views.py",
    "serializers.py",
    "admin.py",
    "apps.py",
    "forms.py",
  ],
  outputFormatter: djangoOutputFormatter,
};
