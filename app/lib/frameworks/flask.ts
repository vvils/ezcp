import { FrameworkConfig, ProjectFile } from "@/types/framework";

const flaskDetector = async (files: FileList): Promise<boolean> => {
  const fileNames = Array.from(files).map((file) => file.name);
  const hasAppPy =
    fileNames.includes("app.py") || fileNames.includes("main.py");
  const hasRequirements = fileNames.includes("requirements.txt");

  // Check for Flask in any Python file
  const hasFlaskImport = await Promise.all(
    Array.from(files)
      .filter((file) => file.name.endsWith(".py"))
      .slice(0, 5) // Check only first 5 Python files for performance
      .map(async (file) => {
        try {
          const content = await readFileContent(file);
          return (
            content.includes("from flask") || content.includes("import flask")
          );
        } catch {
          return false;
        }
      })
  );

  return hasAppPy && hasRequirements && hasFlaskImport.some(Boolean);
};

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const flaskOutputFormatter = (
  projectName: string,
  files: ProjectFile[]
): string => {
  const selectedFiles = files.filter((f) => f.selected);
  const totalChars = selectedFiles.reduce(
    (sum, f) => sum + f.content.length,
    0
  );

  let output = `=== FLASK PROJECT: ${projectName} ===\n`;
  output += `Framework: Flask\n`;
  output += `Selected files: ${selectedFiles.length}\n`;
  output += `Total characters: ${totalChars.toLocaleString()}\n\n`;

  // Group by file type
  const pythonFiles = selectedFiles.filter((f) => f.name.endsWith(".py"));
  const templateFiles = selectedFiles.filter((f) =>
    f.relativePath.includes("templates/")
  );
  const otherFiles = selectedFiles.filter(
    (f) => !f.name.endsWith(".py") && !f.relativePath.includes("templates/")
  );

  output += `=== FILE CONTENTS ===\n\n`;

  // Core Python files first
  if (pythonFiles.length > 0) {
    output += `--- PYTHON FILES ---\n\n`;
    pythonFiles.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Templates
  if (templateFiles.length > 0) {
    output += `--- TEMPLATES ---\n\n`;
    templateFiles.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  // Other files
  if (otherFiles.length > 0) {
    output += `--- OTHER FILES ---\n\n`;
    otherFiles.forEach((file) => {
      output += `--- ${file.relativePath} ---\n`;
      output += file.content;
      output += `\n\n`;
    });
  }

  return output;
};

export const flaskConfig: FrameworkConfig = {
  name: "flask",
  displayName: "Flask",
  icon: "🌶️",
  detector: flaskDetector,
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
    "instance/",
    ".coverage",
    "htmlcov/",
    ".pytest_cache/",
    ".mypy_cache/",
    ".tox/",
    "dist/",
    "build/",
    "*.egg-info/",
    "node_modules/",
    "npm-debug.log*",
  ],
  priorityFiles: [
    "app.py",
    "main.py",
    "requirements.txt",
    "config.py",
    "run.py",
    "__init__.py",
    "models.py",
    "views.py",
    "routes.py",
    "forms.py",
  ],
  outputFormatter: flaskOutputFormatter,
};
