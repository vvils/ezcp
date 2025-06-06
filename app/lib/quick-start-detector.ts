import { FrameworkConfig } from "@/types/framework";
import { frameworks } from "./framework-registry";

export interface FrameworkDetectionResult {
  framework: FrameworkConfig | null;
  confidence: number;
  detectedFrameworks: Array<{
    framework: FrameworkConfig;
    confidence: number;
  }>;
}

export const detectFrameworkFromDirectory = async (
  files: FileList
): Promise<FrameworkDetectionResult> => {
  const detectionResults: Array<{
    framework: FrameworkConfig;
    confidence: number;
  }> = [];

  // Test each framework detector
  for (const framework of frameworks) {
    try {
      const isDetected = await framework.detector(files);
      if (isDetected) {
        // Calculate confidence based on framework-specific indicators
        const confidence = calculateFrameworkConfidence(framework, files);
        detectionResults.push({ framework, confidence });
      }
    } catch (error) {
      console.warn(`Error detecting ${framework.name}:`, error);
    }
  }

  // Sort by confidence (highest first)
  detectionResults.sort((a, b) => b.confidence - a.confidence);

  // Return the highest confidence framework, or null if none detected
  const bestMatch = detectionResults[0] || null;

  return {
    framework: bestMatch?.framework || null,
    confidence: bestMatch?.confidence || 0,
    detectedFrameworks: detectionResults,
  };
};

const calculateFrameworkConfidence = (
  framework: FrameworkConfig,
  files: FileList
): number => {
  let confidence = 0;
  const fileNames = Array.from(files).map((file) => file.name);
  const filePaths = Array.from(files).map(
    (file) => file.webkitRelativePath || file.name
  );

  // Base confidence for detection
  confidence += 30;

  // Check for priority files (higher weight)
  const priorityFilesFound = framework.priorityFiles.filter(
    (priorityFile) =>
      fileNames.some((fileName) => fileName === priorityFile) ||
      filePaths.some((path) => path.includes(priorityFile))
  );
  confidence += priorityFilesFound.length * 15;

  // Framework-specific confidence boosters
  switch (framework.name) {
    case "django":
      if (fileNames.includes("manage.py")) confidence += 20;
      if (filePaths.some((path) => path.includes("settings.py")))
        confidence += 15;
      if (filePaths.some((path) => path.includes("models.py")))
        confidence += 10;
      if (filePaths.some((path) => path.includes("views.py"))) confidence += 10;
      break;

    case "flask":
      if (fileNames.includes("app.py") || fileNames.includes("main.py"))
        confidence += 20;
      if (filePaths.some((path) => path.includes("requirements.txt")))
        confidence += 10;
      break;

    case "nextjs":
      if (fileNames.some((name) => name.startsWith("next.config")))
        confidence += 25;
      if (
        filePaths.some(
          (path) => path.includes("/app/") || path.includes("/pages/")
        )
      )
        confidence += 15;
      if (filePaths.some((path) => path.includes("/api/"))) confidence += 10;
      if (fileNames.includes("package.json")) {
        // Check for Next.js in package.json
        const packageFile = Array.from(files).find(
          (file) => file.name === "package.json"
        );
        if (packageFile) {
          try {
            packageFile.text().then((content) => {
              const packageData = JSON.parse(content);
              if (
                packageData.dependencies?.next ||
                packageData.devDependencies?.next
              ) {
                confidence += 20;
              }
            });
          } catch {
            // Ignore JSON parse errors
          }
        }
      }
      break;

    case "expo":
      if (fileNames.includes("expo.json")) confidence += 25;
      if (fileNames.includes("app.json")) confidence += 15;
      if (fileNames.some((name) => name === "App.js" || name === "App.tsx"))
        confidence += 20;
      if (filePaths.some((path) => path.includes("/screens/")))
        confidence += 10;
      if (fileNames.includes("package.json")) {
        // Check for Expo in package.json
        const packageFile = Array.from(files).find(
          (file) => file.name === "package.json"
        );
        if (packageFile) {
          try {
            packageFile.text().then((content) => {
              const packageData = JSON.parse(content);
              if (
                packageData.dependencies?.expo ||
                Object.keys(packageData.dependencies || {}).some((key) =>
                  key.startsWith("@expo/")
                )
              ) {
                confidence += 20;
              }
            });
          } catch {
            // Ignore JSON parse errors
          }
        }
      }
      break;
  }

  // Cap confidence at 100
  return Math.min(confidence, 100);
};

export const getFrameworkRoute = (framework: FrameworkConfig): string => {
  switch (framework.name) {
    case "django":
      return "/python/django";
    case "flask":
      return "/python/flask";
    case "nextjs":
      return "/javascript/nextjs";
    case "expo":
      return "/javascript/expo";
    default:
      return "/";
  }
};

export const validateDirectoryDrop = (items: DataTransferItemList): boolean => {
  // Check if any of the dropped items is a directory
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const entry = item.webkitGetAsEntry();
      if (entry && entry.isDirectory) {
        return true;
      }
    }
  }
  return false;
};
