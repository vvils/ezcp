"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Code,
  ArrowLeft,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectFile, FrameworkConfig } from "@/types/framework";
import {
  ProcessingOptions,
  processFiles,
  generateOutput,
  copyToClipboard,
} from "@/lib/file-processor";
import { frameworks, detectFramework } from "@/lib/framework-registry";
import { FileTree } from "@/components/FileTree";
import { ProjectSettings } from "@/components/ProjectSettings";
import { useAppContext } from "@/lib/app-context";

export default function NextjsPage() {
  const router = useRouter();
  const {
    state: {
      uploadedFiles,
      processedFiles: globalProcessedFiles,
      selectedFramework: globalFramework,
      projectName: globalProjectName,
      apps: globalApps,
      isAutoDetectionComplete,
    },
    setProcessedFiles: setGlobalProcessedFiles,
    setSelectedFramework,
    setProjectName: setGlobalProjectName,
    setApps: setGlobalApps,
  } = useAppContext();

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(
    uploadedFiles
  );
  const [processedFiles, setProcessedFiles] =
    useState<ProjectFile[]>(globalProcessedFiles);
  const [framework, setFramework] = useState<FrameworkConfig | null>(
    globalFramework
  );
  const [projectName, setProjectName] = useState(globalProjectName);
  const [routes, setRoutes] = useState<string[]>(globalApps);
  const [options, setOptions] = useState<ProcessingOptions>({
    includeTests: false,
    maxFileSize: 1024 * 1024, // 1MB
    customExcludes: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState("");
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copying" | "success" | "error"
  >("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Check for auto-detected project on mount
  useEffect(() => {
    if (
      isAutoDetectionComplete &&
      globalFramework &&
      uploadedFiles &&
      globalProcessedFiles.length > 0
    ) {
      // Use the globally stored state from auto-detection
      setSelectedFiles(uploadedFiles);
      setProcessedFiles(globalProcessedFiles);
      setFramework(globalFramework);
      setProjectName(globalProjectName);
      setRoutes(globalApps);
    }
  }, [
    isAutoDetectionComplete,
    globalFramework,
    uploadedFiles,
    globalProcessedFiles,
    globalProjectName,
    globalApps,
  ]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsProcessing(true);
      setSelectedFiles(files);

      // Extract project name from the first file's path
      const firstFile = files[0];
      const pathParts = (firstFile.webkitRelativePath || firstFile.name).split(
        "/"
      );
      const extractedProjectName = pathParts[0] || "Unknown Project";
      setProjectName(extractedProjectName);
      setGlobalProjectName(extractedProjectName);

      try {
        // Detect framework (should be Next.js)
        const detectedFramework = await detectFramework(files);
        setFramework(detectedFramework);
        setSelectedFramework(detectedFramework);

        if (detectedFramework) {
          // Process files with detected framework
          const processed = await processFiles(
            files,
            detectedFramework,
            options
          );
          // Default all files to selected
          const processedWithSelection = processed.map((file) => ({
            ...file,
            selected: true,
          }));
          setProcessedFiles(processedWithSelection);
          setGlobalProcessedFiles(processedWithSelection);

          // Detect routes if framework supports it
          if (detectedFramework.appDetector) {
            const detectedRoutes = await detectedFramework.appDetector(files);
            setRoutes(detectedRoutes);
            setGlobalApps(detectedRoutes);
          }
        }
      } catch (error) {
        console.error("Error processing files:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      options,
      setGlobalProjectName,
      setSelectedFramework,
      setGlobalProcessedFiles,
      setGlobalApps,
    ]
  );

  const handleFileToggle = useCallback(
    (file: ProjectFile) => {
      const updatedFiles = processedFiles.map((f) =>
        f.path === file.path ? { ...f, selected: !f.selected } : f
      );
      setProcessedFiles(updatedFiles);
      setGlobalProcessedFiles(updatedFiles);
    },
    [processedFiles, setGlobalProcessedFiles]
  );

  const handleSelectAll = useCallback(() => {
    const updatedFiles = processedFiles.map((f) => ({ ...f, selected: true }));
    setProcessedFiles(updatedFiles);
    setGlobalProcessedFiles(updatedFiles);
  }, [processedFiles, setGlobalProcessedFiles]);

  const handleSelectNone = useCallback(() => {
    const updatedFiles = processedFiles.map((f) => ({ ...f, selected: false }));
    setProcessedFiles(updatedFiles);
    setGlobalProcessedFiles(updatedFiles);
  }, [processedFiles, setGlobalProcessedFiles]);

  const handleFrameworkChange = useCallback(
    async (newFramework: FrameworkConfig) => {
      setFramework(newFramework);
      setSelectedFramework(newFramework);

      if (selectedFiles) {
        setIsProcessing(true);
        try {
          const processed = await processFiles(
            selectedFiles,
            newFramework,
            options
          );
          // Default all files to selected
          const processedWithSelection = processed.map((file) => ({
            ...file,
            selected: true,
          }));
          setProcessedFiles(processedWithSelection);
          setGlobalProcessedFiles(processedWithSelection);

          if (newFramework.appDetector) {
            const detectedRoutes = await newFramework.appDetector(
              selectedFiles
            );
            setRoutes(detectedRoutes);
            setGlobalApps(detectedRoutes);
          }
        } catch (error) {
          console.error("Error reprocessing files:", error);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [
      selectedFiles,
      options,
      setSelectedFramework,
      setGlobalProcessedFiles,
      setGlobalApps,
    ]
  );

  const handleOptionsChange = useCallback(
    async (newOptions: ProcessingOptions) => {
      setOptions(newOptions);

      if (selectedFiles && framework) {
        setIsProcessing(true);
        try {
          const processed = await processFiles(
            selectedFiles,
            framework,
            newOptions
          );
          // Preserve current selection state
          const currentSelections = new Map(
            processedFiles.map((f) => [f.path, f.selected])
          );
          const processedWithSelection = processed.map((file) => ({
            ...file,
            selected: currentSelections.get(file.path) ?? true,
          }));
          setProcessedFiles(processedWithSelection);
          setGlobalProcessedFiles(processedWithSelection);
        } catch (error) {
          console.error("Error reprocessing files:", error);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [selectedFiles, framework, processedFiles, setGlobalProcessedFiles]
  );

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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Note: Full directory drag & drop requires webkitdirectory support
    // For now, this provides the visual feedback
    console.log(
      "Drop detected - please use the 'Choose Directory' button for full directory upload"
    );
  }, []);

  const handleGenerateAndCopy = useCallback(async () => {
    if (!framework || processedFiles.length === 0) return;

    setCopyStatus("copying");
    setIsProcessing(true);

    try {
      const selectedFiles = processedFiles.filter((f) => f.selected);
      const generatedOutput = generateOutput(
        projectName,
        selectedFiles,
        framework,
        routes
      );
      setOutput(generatedOutput);

      await copyToClipboard(generatedOutput);
      setCopyStatus("success");

      // Reset status after 3 seconds
      setTimeout(() => setCopyStatus("idle"), 3000);
    } catch (error) {
      console.error("Error generating output:", error);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [framework, processedFiles, projectName, routes]);

  const selectedCount = processedFiles.filter((f) => f.selected).length;
  const totalSize = processedFiles
    .filter((f) => f.selected)
    .reduce((sum, f) => sum + f.size, 0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg shadow-md mr-3">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Next.js Project Analyzer
                </h1>
                <p className="text-gray-600">
                  ⚡ React framework for production
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isAutoDetectionComplete && !selectedFiles ? (
          // File upload section
          <div className="max-w-2xl mx-auto">
            <div
              className={`bg-white rounded-xl shadow-lg p-8 border-2 transition-all duration-200 ${
                isDragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center mb-6">
                <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Your Next.js Project
                </h2>
                <p className="text-gray-600">
                  {isAutoDetectionComplete
                    ? "Project automatically detected and ready for processing"
                    : "Select your project folder to analyze the structure and generate context"}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    {...({
                      webkitdirectory: "",
                    } as React.InputHTMLAttributes<HTMLInputElement>)}
                    className="hidden"
                    id="folder-input"
                  />
                  <label
                    htmlFor="folder-input"
                    className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-700">
                        Choose Project Folder
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Click to select your Next.js project directory
                      </p>
                    </div>
                  </label>
                </div>

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="text-gray-600 mt-2">Processing project...</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  What we&apos;ll detect:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Next.js configuration files (next.config.js/ts)</li>
                  <li>• App Router structure (app/ directory)</li>
                  <li>• Pages Router structure (pages/ directory)</li>
                  <li>• API routes and middleware</li>
                  <li>• Components and utilities</li>
                  <li>• Styling files and configurations</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // Project analysis section
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Tree */}
            <div className="lg:col-span-2">
              <FileTree
                files={processedFiles}
                onFileToggle={handleFileToggle}
                onSelectAll={handleSelectAll}
                onSelectNone={handleSelectNone}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Project Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">
                      {projectName}
                      {isAutoDetectionComplete && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Auto-detected
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Framework:</span>
                    <span className="font-medium text-gray-900">
                      {framework?.displayName || "Detecting..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Files:</span>
                    <span className="font-medium text-gray-900">
                      {selectedCount} selected
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium text-gray-900">
                      {formatFileSize(totalSize)}
                    </span>
                  </div>
                  {routes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Routes:</span>
                      <span className="font-medium text-gray-900">
                        {routes.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-lg font-semibold text-gray-900">
                      Settings
                    </span>
                  </div>
                  {showSettings ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>

                {showSettings && (
                  <div className="px-6 pb-6">
                    <ProjectSettings
                      framework={framework}
                      frameworks={frameworks}
                      onFrameworkChange={handleFrameworkChange}
                      options={options}
                      onOptionsChange={handleOptionsChange}
                      projectName={projectName}
                      onProjectNameChange={(name) => {
                        setProjectName(name);
                        setGlobalProjectName(name);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAndCopy}
                disabled={isProcessing || selectedCount === 0 || !framework}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
                  isProcessing || selectedCount === 0 || !framework
                    ? "bg-gray-400 cursor-not-allowed"
                    : copyStatus === "success"
                    ? "bg-green-500 hover:bg-green-600"
                    : copyStatus === "error"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600 hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-center">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : copyStatus === "copying" ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Copying...
                    </>
                  ) : copyStatus === "success" ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Copied to Clipboard!
                    </>
                  ) : copyStatus === "error" ? (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Copy Failed
                    </>
                  ) : (
                    <>
                      <Code className="h-5 w-5 mr-2" />
                      Generate & Copy Context
                    </>
                  )}
                </div>
              </button>

              {/* Output Preview */}
              {output && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Generated Output Preview
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {output.substring(0, 500)}
                      {output.length > 500 && "..."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
