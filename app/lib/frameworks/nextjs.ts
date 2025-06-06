import { FrameworkConfig, ProjectFile } from "@/types/framework";

const nextjsDetector = async (files: FileList): Promise<boolean> => {
  const fileNames = Array.from(files).map((file) => file.name);
  const filePaths = Array.from(files).map(
    (file) => file.webkitRelativePath || file.name
  );

  // Check for Next.js config files
  const hasNextConfig = fileNames.some(
    (name) =>
      name === "next.config.js" ||
      name === "next.config.ts" ||
      name === "next.config.mjs"
  );

  // Check for package.json with Next.js dependency
  const hasPackageJson = fileNames.includes("package.json");
  let hasNextDependency = false;

  if (hasPackageJson) {
    const packageFile = Array.from(files).find(
      (file) => file.name === "package.json"
    );
    if (packageFile) {
      try {
        const content = await packageFile.text();
        const packageData = JSON.parse(content);
        hasNextDependency =
          (packageData.dependencies && packageData.dependencies.next) ||
          (packageData.devDependencies && packageData.devDependencies.next);
      } catch {
        // Invalid JSON, continue with other checks
      }
    }
  }

  // Check for Next.js directory structure
  const hasAppDir = filePaths.some((path) => path.includes("app/"));
  const hasPagesDir = filePaths.some((path) => path.includes("pages/"));

  return hasNextConfig || (hasNextDependency && (hasAppDir || hasPagesDir));
};

const nextjsAppDetector = async (files: FileList): Promise<string[]> => {
  const routes: Set<string> = new Set();

  Array.from(files).forEach((file) => {
    const path = file.webkitRelativePath || "";

    // Detect App Router routes
    if (
      path.includes("/app/") &&
      (path.endsWith("/page.tsx") || path.endsWith("/page.js"))
    ) {
      const routeParts = path.split("/app/")[1].split("/");
      if (routeParts.length > 1) {
        const route = routeParts.slice(0, -1).join("/");
        routes.add(`app/${route}`);
      }
    }

    // Detect Pages Router routes
    if (path.includes("/pages/") && !path.includes("/api/")) {
      const routeParts = path.split("/pages/")[1];
      if (
        routeParts &&
        routeParts !== "index.tsx" &&
        routeParts !== "index.js" &&
        routeParts !== "_app.tsx" &&
        routeParts !== "_app.js"
      ) {
        const route = routeParts.replace(/\.(tsx?|jsx?)$/, "");
        routes.add(`pages/${route}`);
      }
    }

    // Detect API routes
    if (path.includes("/api/")) {
      const apiParts = path.split("/api/")[1];
      if (apiParts) {
        const route = apiParts.replace(/\.(tsx?|jsx?)$/, "");
        routes.add(`api/${route}`);
      }
    }
  });

  return Array.from(routes);
};

const nextjsOutputFormatter = (
  projectName: string,
  files: ProjectFile[]
): string => {
  const selectedFiles = files.filter((f) => f.selected);
  const totalChars = selectedFiles.reduce(
    (sum, f) => sum + f.content.length,
    0
  );

  // Generate project structure
  const structure = generateNextjsStructure(selectedFiles);

  let output = `=== NEXT.JS PROJECT: ${projectName} ===\n`;
  output += `Framework: Next.js\n`;
  output += `Selected files: ${selectedFiles.length}\n`;
  output += `Total characters: ${totalChars.toLocaleString()}\n\n`;

  output += `=== PROJECT STRUCTURE ===\n`;
  output += structure;
  output += `\n=== FILE CONTENTS ===\n\n`;

  // Group files by category
  const groupedFiles = groupFilesByCategory(selectedFiles);

  // Output configuration files first
  if (groupedFiles.config.length > 0) {
    output += `--- CONFIGURATION FILES ---\n\n`;
    groupedFiles.config.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output App Router files
  if (groupedFiles.app.length > 0) {
    output += `--- APP ROUTER ---\n\n`;
    groupedFiles.app.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output Pages Router files
  if (groupedFiles.pages.length > 0) {
    output += `--- PAGES ROUTER ---\n\n`;
    groupedFiles.pages.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output API routes
  if (groupedFiles.api.length > 0) {
    output += `--- API ROUTES ---\n\n`;
    groupedFiles.api.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output components
  if (groupedFiles.components.length > 0) {
    output += `--- COMPONENTS ---\n\n`;
    groupedFiles.components.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output utilities and other files
  if (groupedFiles.utils.length > 0) {
    output += `--- UTILITIES & LIBRARIES ---\n\n`;
    groupedFiles.utils.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output styles
  if (groupedFiles.styles.length > 0) {
    output += `--- STYLES ---\n\n`;
    groupedFiles.styles.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  return output;
};

type TreeNode = { [key: string]: TreeNode | null };

const generateNextjsStructure = (files: ProjectFile[]): string => {
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

const groupFilesByCategory = (files: ProjectFile[]) => {
  const config: ProjectFile[] = [];
  const app: ProjectFile[] = [];
  const pages: ProjectFile[] = [];
  const api: ProjectFile[] = [];
  const components: ProjectFile[] = [];
  const utils: ProjectFile[] = [];
  const styles: ProjectFile[] = [];

  files.forEach((file) => {
    const path = file.relativePath.toLowerCase();

    // Configuration files
    if (
      path.includes("next.config") ||
      path.includes("package.json") ||
      path.includes("tsconfig.json") ||
      path.includes("tailwind.config") ||
      path.includes(".env") ||
      path.includes("middleware")
    ) {
      config.push(file);
    }
    // App Router files
    else if (path.includes("/app/") && !path.includes("/api/")) {
      app.push(file);
    }
    // Pages Router files
    else if (path.includes("/pages/") && !path.includes("/api/")) {
      pages.push(file);
    }
    // API routes
    else if (path.includes("/api/")) {
      api.push(file);
    }
    // Components
    else if (
      path.includes("component") ||
      path.includes("/ui/") ||
      path.includes("/shared/")
    ) {
      components.push(file);
    }
    // Styles
    else if (
      path.endsWith(".css") ||
      path.endsWith(".scss") ||
      path.endsWith(".sass") ||
      path.includes("style")
    ) {
      styles.push(file);
    }
    // Everything else goes to utils
    else {
      utils.push(file);
    }
  });

  return { config, app, pages, api, components, utils, styles };
};

export const nextjsConfig: FrameworkConfig = {
  name: "nextjs",
  displayName: "Next.js",
  icon: "⚡",
  detector: nextjsDetector,
  appDetector: nextjsAppDetector,
  excludePatterns: [
    ".next/",
    "node_modules/",
    ".git/",
    "dist/",
    "out/",
    "*.log",
    ".env*",
    "coverage/",
    ".nyc_output/",
    ".cache/",
    "build/",
    ".vercel/",
    ".netlify/",
    "*.tsbuildinfo",
    ".DS_Store",
    "Thumbs.db",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    // Test files
    "*.test.js",
    "*.test.ts",
    "*.test.tsx",
    "*.spec.js",
    "*.spec.ts",
    "*.spec.tsx",
    "__tests__/",
    // Configuration files
    "*.config.js",
    "*.config.ts",
    ".eslintrc*",
    ".prettierrc*",
    "babel.config.js",
    "jest.config.js",
    "jest.config.ts",
    // Build and generated files
    "*.d.ts",
    // Lock files and package managers
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    // Documentation and meta files
    "*.md",
    "README.md",
    "LICENSE",
    ".gitignore",
    ".dockerignore",
    // Storybook
    ".storybook/",
    "*.stories.*",
  ],
  priorityFiles: [
    "next.config.js",
    "next.config.ts",
    "next.config.mjs",
    "package.json",
    "tailwind.config.js",
    "tailwind.config.ts",
    "tsconfig.json",
    "app/layout.tsx",
    "app/layout.js",
    "pages/_app.tsx",
    "pages/_app.js",
    "app/page.tsx",
    "app/page.js",
    "pages/index.tsx",
    "pages/index.js",
    "middleware.ts",
    "middleware.js",
  ],
  outputFormatter: nextjsOutputFormatter,
};
