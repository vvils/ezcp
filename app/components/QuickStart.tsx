"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FolderOpen,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import {
  detectFrameworkFromDirectory,
  getFrameworkRoute,
  validateDirectoryDrop,
  FrameworkDetectionResult,
} from "@/lib/quick-start-detector";
import { useAppContext } from "@/lib/app-context";
import { processFiles } from "@/lib/file-processor";

interface QuickStartProps {
  onProjectDetected?: (result: FrameworkDetectionResult) => void;
}

export function QuickStart({ onProjectDetected }: QuickStartProps) {
  const router = useRouter();
  const {
    setUploadedFiles,
    setDetectionResult,
    setSelectedFramework,
    setProjectName,
    setProcessedFiles,
    setApps,
    setShouldSkipManualSelection,
    setAutoDetectionComplete,
  } = useAppContext();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setLocalDetectionResult] =
    useState<FrameworkDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processDetectedProject = useCallback(
    async (files: FileList, result: FrameworkDetectionResult) => {
      try {
        // Store files and detection result in global state
        setUploadedFiles(files);
        setDetectionResult(result);

        if (result.framework) {
          setSelectedFramework(result.framework);

          // Extract project name from the first file's path
          const firstFile = files[0];
          if (firstFile) {
            const pathParts = (
              firstFile.webkitRelativePath || firstFile.name
            ).split("/");
            const extractedProjectName = pathParts[0] || "Unknown Project";
            setProjectName(extractedProjectName);
          }

          // Process files with detected framework
          const processed = await processFiles(files, result.framework, {
            includeTests: false,
            maxFileSize: 1024 * 1024, // 1MB
            customExcludes: [],
          });

          // Default all files to selected
          const processedWithSelection = processed.map((file) => ({
            ...file,
            selected: true,
          }));
          setProcessedFiles(processedWithSelection);

          // Detect apps if framework supports it
          if (result.framework.appDetector) {
            const detectedApps = await result.framework.appDetector(files);
            setApps(detectedApps);
          }

          setAutoDetectionComplete(true);

          // Auto-redirect if framework detected with high confidence
          if (result.confidence > 70) {
            setShouldSkipManualSelection(true);
            setTimeout(() => {
              const route = getFrameworkRoute(result.framework!);
              router.push(route);
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Error processing detected project:", err);
        setError("Failed to process the project files. Please try again.");
      }
    },
    [
      setUploadedFiles,
      setDetectionResult,
      setSelectedFramework,
      setProjectName,
      setProcessedFiles,
      setApps,
      setAutoDetectionComplete,
      setShouldSkipManualSelection,
      router,
    ]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setError(null);

      const items = e.dataTransfer.items;

      // Validate that we have directory items
      if (!validateDirectoryDrop(items)) {
        setError("Please drop a project folder, not individual files.");
        return;
      }

      setIsProcessing(true);

      try {
        // Convert DataTransferItemList to FileList
        const files: File[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await traverseFileTree(entry, files);
            }
          }
        }

        if (files.length === 0) {
          setError("No files found in the dropped folder.");
          return;
        }

        // Create FileList-like object
        const fileList = createFileList(files);

        // Detect framework
        const result = await detectFrameworkFromDirectory(fileList);
        setLocalDetectionResult(result);

        if (onProjectDetected) {
          onProjectDetected(result);
        }

        // Process the project for seamless navigation
        await processDetectedProject(fileList, result);
      } catch (err) {
        console.error("Error processing dropped folder:", err);
        setError("Failed to process the dropped folder. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [processDetectedProject, onProjectDetected]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsProcessing(true);
      setError(null);

      try {
        const result = await detectFrameworkFromDirectory(files);
        setLocalDetectionResult(result);

        if (onProjectDetected) {
          onProjectDetected(result);
        }

        // Process the project for seamless navigation
        await processDetectedProject(files, result);
      } catch (err) {
        console.error("Error processing selected folder:", err);
        setError("Failed to process the selected folder. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [processDetectedProject, onProjectDetected]
  );

  const handleManualSelection = () => {
    // Reset state and let user manually select framework
    setLocalDetectionResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quick Start Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Zap className="h-8 w-8 text-yellow-500 mr-2" />
          <h2 className="text-3xl font-bold text-gray-900">Quick Start</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Drop your project folder below for instant framework detection and
          analysis
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
          isDragOver
            ? "border-blue-400 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400"
        } ${isProcessing ? "pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {isProcessing ? (
            <div className="space-y-4">
              <Loader className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Analyzing Project...
                </h3>
                <p className="text-gray-600">
                  Detecting framework and processing files
                </p>
              </div>
            </div>
          ) : detectionResult ? (
            <div className="space-y-4">
              {detectionResult.framework ? (
                <div className="space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {detectionResult.framework.icon}{" "}
                      {detectionResult.framework.displayName} Detected!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Confidence: {detectionResult.confidence}%
                    </p>
                    {detectionResult.confidence > 70 ? (
                      <p className="text-sm text-blue-600">
                        Redirecting to {detectionResult.framework.displayName}{" "}
                        analyzer...
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-600">
                          Low confidence detection. Please verify this is
                          correct.
                        </p>
                        <button
                          onClick={() =>
                            router.push(
                              getFrameworkRoute(detectionResult.framework!)
                            )
                          }
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Continue with {detectionResult.framework.displayName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Framework Not Detected
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We couldn&apos;t automatically detect your framework.
                      Please select manually.
                    </p>
                    <button
                      onClick={handleManualSelection}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Choose Framework Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop Your Project Folder Here
                </h3>
                <p className="text-gray-600 mb-6">
                  Or click below to browse and select your project directory
                </p>

                <div className="space-y-4">
                  <input
                    type="file"
                    onChange={handleFileInput}
                    {...({
                      webkitdirectory: "",
                    } as React.InputHTMLAttributes<HTMLInputElement>)}
                    className="hidden"
                    id="quick-start-input"
                  />
                  <label
                    htmlFor="quick-start-input"
                    className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Choose Project Folder
                  </label>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to traverse file tree from drag & drop
async function traverseFileTree(
  item: FileSystemEntry,
  files: File[]
): Promise<void> {
  if (item.isFile) {
    const fileEntry = item as FileSystemFileEntry;
    return new Promise((resolve) => {
      fileEntry.file((file) => {
        // Add webkitRelativePath for consistency
        Object.defineProperty(file, "webkitRelativePath", {
          value: item.fullPath.substring(1), // Remove leading slash
          writable: false,
        });
        files.push(file);
        resolve();
      });
    });
  } else if (item.isDirectory) {
    const dirEntry = item as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();

    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        for (const entry of entries) {
          await traverseFileTree(entry, files);
        }
        resolve();
      });
    });
  }
}

// Helper function to create FileList-like object
function createFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file;
      }
    },
  };

  // Add array-like access
  files.forEach((file, index) => {
    (fileList as Record<number, File> & FileList)[index] = file;
  });

  return fileList as FileList;
}
