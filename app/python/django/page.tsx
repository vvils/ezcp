"use client";

import React, { useState, useCallback } from "react";
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

export default function DjangoPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProjectFile[]>([]);
  const [framework, setFramework] = useState<FrameworkConfig | null>(null);
  const [projectName, setProjectName] = useState("");
  const [apps, setApps] = useState<string[]>([]);
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

      try {
        // Detect framework (should be Django)
        const detectedFramework = await detectFramework(files);
        setFramework(detectedFramework);

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

          // Detect apps if framework supports it
          if (detectedFramework.appDetector) {
            const detectedApps = await detectedFramework.appDetector(files);
            setApps(detectedApps);
          }
        }
      } catch (error) {
        console.error("Error processing files:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [options]
  );

  const handleFileToggle = useCallback((file: ProjectFile) => {
    setProcessedFiles((prev) =>
      prev.map((f) =>
        f.path === file.path ? { ...f, selected: !f.selected } : f
      )
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setProcessedFiles((prev) => prev.map((f) => ({ ...f, selected: true })));
  }, []);

  const handleSelectNone = useCallback(() => {
    setProcessedFiles((prev) => prev.map((f) => ({ ...f, selected: false })));
  }, []);

  const handleFrameworkChange = useCallback(
    async (newFramework: FrameworkConfig) => {
      setFramework(newFramework);

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

          if (newFramework.appDetector) {
            const detectedApps = await newFramework.appDetector(selectedFiles);
            setApps(detectedApps);
          }
        } catch (error) {
          console.error("Error reprocessing files:", error);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [selectedFiles, options]
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
        } catch (error) {
          console.error("Error reprocessing files:", error);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [selectedFiles, framework, processedFiles]
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
              Upload your Django project to generate clean, structured context
            </p>
          </div>
        </div>

        {/* File Upload */}
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

                    {copyStatus === "copying" && "Generating & Copying..."}
                    {copyStatus === "success" && "Copied to Clipboard!"}
                    {copyStatus === "error" && "Failed to Copy"}
                    {copyStatus === "idle" && "Generate & Copy to Clipboard"}
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Settings */}
            {showSettings && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <ProjectSettings
                    framework={framework}
                    frameworks={frameworks}
                    onFrameworkChange={handleFrameworkChange}
                    options={options}
                    onOptionsChange={handleOptionsChange}
                    projectName={projectName}
                    onProjectNameChange={setProjectName}
                  />
                </div>
              </div>
            )}

            {/* File Tree */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <FileTree
                files={processedFiles}
                onFileToggle={handleFileToggle}
                onSelectAll={handleSelectAll}
                onSelectNone={handleSelectNone}
              />
            </div>

            {/* Output Preview */}
            {output && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Generated Context
                    </h3>
                    <p className="text-gray-600">
                      {output.length.toLocaleString()} characters ready for AI
                    </p>
                  </div>
                  {copyStatus === "success" && (
                    <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Copied to Clipboard
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {output.substring(0, 1000)}
                    {output.length > 1000 && "..."}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State Features */}
        {processedFiles.length === 0 && !isProcessing && (
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Django-Specific Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  App Detection
                </h3>
                <p className="text-gray-600">
                  Automatically identifies Django apps and organizes your
                  project structure for optimal AI understanding.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Smart Filtering
                </h3>
                <p className="text-gray-600">
                  Excludes migrations, static files, and other non-essential
                  files while preserving your core logic.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
