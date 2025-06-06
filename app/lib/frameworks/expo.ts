import { FrameworkConfig, ProjectFile } from "@/types/framework";

const expoDetector = async (files: FileList): Promise<boolean> => {
  const fileNames = Array.from(files).map((file) => file.name);

  // Check for Expo config files
  const hasExpoJson = fileNames.includes("expo.json");
  const hasAppJson = fileNames.includes("app.json");

  // Check app.json for Expo configuration
  let hasExpoConfig = false;
  if (hasAppJson) {
    const appJsonFile = Array.from(files).find(
      (file) => file.name === "app.json"
    );
    if (appJsonFile) {
      try {
        const content = await appJsonFile.text();
        const appData = JSON.parse(content);
        hasExpoConfig = !!(appData.expo || appData.name);
      } catch {
        // Invalid JSON, continue with other checks
      }
    }
  }

  // Check for package.json with Expo SDK dependency
  const hasPackageJson = fileNames.includes("package.json");
  let hasExpoDependency = false;

  if (hasPackageJson) {
    const packageFile = Array.from(files).find(
      (file) => file.name === "package.json"
    );
    if (packageFile) {
      try {
        const content = await packageFile.text();
        const packageData = JSON.parse(content);
        hasExpoDependency =
          (packageData.dependencies && packageData.dependencies.expo) ||
          (packageData.devDependencies && packageData.devDependencies.expo) ||
          (packageData.dependencies &&
            Object.keys(packageData.dependencies).some((key) =>
              key.startsWith("@expo/")
            )) ||
          (packageData.devDependencies &&
            Object.keys(packageData.devDependencies).some((key) =>
              key.startsWith("@expo/")
            ));
      } catch {
        // Invalid JSON, continue with other checks
      }
    }
  }

  // Check for main app entry point
  const hasAppEntry = fileNames.some(
    (name) => name === "App.js" || name === "App.tsx" || name === "App.jsx"
  );

  return (
    hasExpoJson ||
    (hasAppJson && hasExpoConfig) ||
    (hasExpoDependency && hasAppEntry)
  );
};

const expoAppDetector = async (files: FileList): Promise<string[]> => {
  const screens: Set<string> = new Set();

  Array.from(files).forEach((file) => {
    const path = file.webkitRelativePath || "";
    const fileName = file.name;

    // Detect screen components
    if (
      (path.includes("/screens/") || path.includes("/Screens/")) &&
      (fileName.endsWith(".tsx") ||
        fileName.endsWith(".ts") ||
        fileName.endsWith(".jsx") ||
        fileName.endsWith(".js"))
    ) {
      const screenName = fileName.replace(/\.(tsx?|jsx?)$/, "");
      screens.add(`screens/${screenName}`);
    }

    // Detect navigation files
    if (
      (path.includes("navigation") || path.includes("Navigation")) &&
      (fileName.endsWith(".tsx") ||
        fileName.endsWith(".ts") ||
        fileName.endsWith(".jsx") ||
        fileName.endsWith(".js"))
    ) {
      const navName = fileName.replace(/\.(tsx?|jsx?)$/, "");
      screens.add(`navigation/${navName}`);
    }

    // Detect components
    if (
      (path.includes("/components/") || path.includes("/Components/")) &&
      (fileName.endsWith(".tsx") ||
        fileName.endsWith(".ts") ||
        fileName.endsWith(".jsx") ||
        fileName.endsWith(".js"))
    ) {
      const componentName = fileName.replace(/\.(tsx?|jsx?)$/, "");
      screens.add(`components/${componentName}`);
    }
  });

  return Array.from(screens);
};

const expoOutputFormatter = (
  projectName: string,
  files: ProjectFile[]
): string => {
  const selectedFiles = files.filter((f) => f.selected);
  const totalChars = selectedFiles.reduce(
    (sum, f) => sum + f.content.length,
    0
  );

  // Generate project structure
  const structure = generateExpoStructure(selectedFiles);

  let output = `=== EXPO PROJECT: ${projectName} ===\n`;
  output += `Framework: Expo\n`;
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

  // Output main app entry point
  if (groupedFiles.app.length > 0) {
    output += `--- MAIN APP ENTRY ---\n\n`;
    groupedFiles.app.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output screens
  if (groupedFiles.screens.length > 0) {
    output += `--- SCREENS ---\n\n`;
    groupedFiles.screens.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output navigation
  if (groupedFiles.navigation.length > 0) {
    output += `--- NAVIGATION ---\n\n`;
    groupedFiles.navigation.forEach((file) => {
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

  // Output assets and constants
  if (groupedFiles.assets.length > 0) {
    output += `--- ASSETS & CONSTANTS ---\n\n`;
    groupedFiles.assets.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output services and API
  if (groupedFiles.services.length > 0) {
    output += `--- SERVICES & API ---\n\n`;
    groupedFiles.services.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Output utilities
  if (groupedFiles.utils.length > 0) {
    output += `--- UTILITIES ---\n\n`;
    groupedFiles.utils.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  return output;
};

type TreeNode = { [key: string]: TreeNode | null };

const generateExpoStructure = (files: ProjectFile[]): string => {
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
  const screens: ProjectFile[] = [];
  const navigation: ProjectFile[] = [];
  const components: ProjectFile[] = [];
  const assets: ProjectFile[] = [];
  const services: ProjectFile[] = [];
  const utils: ProjectFile[] = [];

  files.forEach((file) => {
    const path = file.relativePath.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Configuration files
    if (
      fileName === "expo.json" ||
      fileName === "app.json" ||
      fileName === "package.json" ||
      fileName === "babel.config.js" ||
      fileName === "metro.config.js" ||
      path.includes("eas.json")
    ) {
      config.push(file);
    }
    // Main app entry point
    else if (
      fileName === "app.js" ||
      fileName === "app.tsx" ||
      fileName === "app.jsx"
    ) {
      app.push(file);
    }
    // Screens
    else if (path.includes("/screens/") || path.includes("/screen/")) {
      screens.push(file);
    }
    // Navigation
    else if (path.includes("navigation") || path.includes("navigator")) {
      navigation.push(file);
    }
    // Components
    else if (path.includes("/components/") || path.includes("/component/")) {
      components.push(file);
    }
    // Assets and constants
    else if (
      path.includes("/assets/") ||
      path.includes("/constants/") ||
      path.includes("/constant/") ||
      fileName.includes("constant") ||
      fileName.includes("theme") ||
      fileName.includes("color")
    ) {
      assets.push(file);
    }
    // Services and API
    else if (
      path.includes("/services/") ||
      path.includes("/service/") ||
      path.includes("/api/") ||
      path.includes("/apis/") ||
      fileName.includes("api") ||
      fileName.includes("service")
    ) {
      services.push(file);
    }
    // Everything else goes to utils
    else {
      utils.push(file);
    }
  });

  return {
    config,
    app,
    screens,
    navigation,
    components,
    assets,
    services,
    utils,
  };
};

export const expoConfig: FrameworkConfig = {
  name: "expo",
  displayName: "Expo",
  icon: "📱",
  detector: expoDetector,
  appDetector: expoAppDetector,
  excludePatterns: [
    "node_modules/",
    ".expo/",
    "dist/",
    "web-build/",
    ".git/",
    "*.log",
    ".env*",
    "coverage/",
    "ios/",
    "android/",
    ".DS_Store",
    "Thumbs.db",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".vscode/",
    ".idea/",
    "*.tsbuildinfo",
    ".expo-shared/",
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
    "tsconfig.json",
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
    // React Native specific
    ".expo/",
    "ios/",
    "android/",
    // Storybook
    ".storybook/",
    "*.stories.*",
  ],
  priorityFiles: [
    "expo.json",
    "app.json",
    "App.js",
    "App.tsx",
    "App.jsx",
    "package.json",
    "babel.config.js",
    "metro.config.js",
    "eas.json",
  ],
  outputFormatter: expoOutputFormatter,
};
