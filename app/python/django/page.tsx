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

export default function DjangoPage() {
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
  const [apps, setApps] = useState<string[]>(globalApps);
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
      setApps(globalApps);
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
        // Detect framework (should be Django)
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

          // Detect apps if framework supports it
          if (detectedFramework.appDetector) {
            const detectedApps = await detectedFramework.appDetector(files);
            setApps(detectedApps);
            setGlobalApps(detectedApps);
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
            const detectedApps = await newFramework.appDetector(selectedFiles);
            setApps(detectedApps);
            setGlobalApps(detectedApps);
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
    if (!framework) return;

    setCopyStatus("copying");

    try {
      // Generate output
      const generated = generateOutput(
        projectName,
        processedFiles,
        framework,
        apps
      );
      setOutput(generated);

      // Automatically copy to clipboard
      const success = await copyToClipboard(generated);
      setCopyStatus(success ? "success" : "error");
    } catch (error) {
      console.error("Error generating or copying:", error);
      setCopyStatus("error");
    }

    setTimeout(() => setCopyStatus("idle"), 3000);
  }, [projectName, processedFiles, framework, apps]);

  const selectedCount = processedFiles.filter((f) => f.selected).length;
  const totalSize = processedFiles
    .filter((f) => f.selected)
    .reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ezcp - Django Projects
            </h1>
            <p className="text-gray-700 mt-1">
              {isAutoDetectionComplete
                ? "Project automatically detected and ready for processing"
                : "Upload your Django project to generate clean, structured context"}
            </p>
          </div>
        </div>

        {/* Show upload section only if no auto-detection or files */}
        {!isAutoDetectionComplete && (
          <div
            className={`bg-white rounded-xl border-2 shadow-sm p-8 text-center mb-8 transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload
              className={`mx-auto h-12 w-12 mb-4 ${
                isDragOver ? "text-blue-600" : "text-blue-500"
              }`}
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select Your Django Project Directory
            </h3>
            <p className="text-gray-600 mb-6">
              {isDragOver
                ? "Drop your project folder here!"
                : "Drag and drop your project folder here, or click to browse"}
            </p>
            <input
              type="file"
              {...({
                webkitdirectory: "",
              } as React.InputHTMLAttributes<HTMLInputElement>)}
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="directory-upload"
            />
            <label
              htmlFor="directory-upload"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all transform hover:scale-105 shadow-md"
            >
              <Upload className="w-5 h-5 mr-2" />
              Choose Directory
            </label>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-700 font-medium">
              Processing your Django project...
            </p>
          </div>
        )}

        {processedFiles.length > 0 && (
          <div className="space-y-8">
            {/* Project Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {projectName}
                    {isAutoDetectionComplete && (
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Auto-detected
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedCount} of {processedFiles.length} files selected •{" "}
                    {(totalSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex space-x-3">
                  {/* Settings Toggle */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                    {showSettings ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </button>

                  {/* Generate & Copy Button */}
                  <button
                    onClick={handleGenerateAndCopy}
                    disabled={selectedCount === 0 || copyStatus === "copying"}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md"
                  >
                    {copyStatus === "copying" && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    )}
                    {copyStatus === "success" && (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {copyStatus === "error" && (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    {copyStatus === "idle" && <Code className="w-4 h-4 mr-2" />}
                    {copyStatus === "copying"
                      ? "Generating..."
                      : copyStatus === "success"
                      ? "Copied!"
                      : copyStatus === "error"
                      ? "Error"
                      : "Generate & Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            {showSettings && (
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
            )}

            {/* File Tree */}
            <FileTree
              files={processedFiles}
              onFileToggle={handleFileToggle}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
            />

            {/* Output Preview */}
            {output && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Generated Output Preview
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
