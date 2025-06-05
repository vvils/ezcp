"use client";

import React from "react";
import { FrameworkConfig } from "@/types/framework";
import { ProcessingOptions } from "@/lib/file-processor";
import { Settings, Info } from "lucide-react";

interface ProjectSettingsProps {
  framework: FrameworkConfig | null;
  frameworks: FrameworkConfig[];
  onFrameworkChange: (framework: FrameworkConfig) => void;
  options: ProcessingOptions;
  onOptionsChange: (options: ProcessingOptions) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

export function ProjectSettings({
  framework,
  frameworks,
  onFrameworkChange,
  options,
  onOptionsChange,
  projectName,
  onProjectNameChange,
}: ProjectSettingsProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Project Settings
        </h2>
      </div>

      {/* Project Name */}
      <div className="space-y-3">
        <label
          htmlFor="project-name"
          className="block text-sm font-medium text-gray-800"
        >
          Project Name
        </label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Enter project name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-gray-900 placeholder-gray-500 transition-colors"
        />
      </div>

      {/* Framework Selection */}
      <div className="space-y-3">
        <label
          htmlFor="framework"
          className="block text-sm font-medium text-gray-800"
        >
          Framework
        </label>
        <select
          id="framework"
          value={framework?.name || ""}
          onChange={(e) => {
            const selected = frameworks.find((f) => f.name === e.target.value);
            if (selected) {
              onFrameworkChange(selected);
            }
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-gray-900 bg-white transition-colors"
        >
          <option value="">Select Framework...</option>
          {frameworks.map((f) => (
            <option key={f.name} value={f.name}>
              {f.icon} {f.displayName}
            </option>
          ))}
        </select>
        {framework && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {framework.displayName} Detected
              </span>
            </div>
            <p className="text-sm text-blue-800 mt-2 leading-relaxed">
              Using {framework.displayName}-specific file filtering and output
              formatting for optimal AI analysis.
            </p>
          </div>
        )}
      </div>

      {/* Processing Options */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Processing Options
        </h3>

        <div className="flex items-center space-x-3">
          <input
            id="include-tests"
            type="checkbox"
            checked={options.includeTests || false}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                includeTests: e.target.checked,
              })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="include-tests" className="text-sm text-gray-800">
            Include test files in the output
          </label>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="max-file-size"
            className="block text-sm font-medium text-gray-800"
          >
            Maximum file size (KB)
          </label>
          <input
            id="max-file-size"
            type="number"
            value={(options.maxFileSize || 1048576) / 1024}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                maxFileSize: parseInt(e.target.value) * 1024,
              })
            }
            min="1"
            max="10240"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-gray-900 transition-colors"
          />
          <p className="text-xs text-gray-600 leading-relaxed">
            Files larger than this will be excluded from processing
          </p>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="custom-excludes"
            className="block text-sm font-medium text-gray-800"
          >
            Additional exclude patterns
          </label>
          <textarea
            id="custom-excludes"
            value={(options.customExcludes || []).join("\n")}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                customExcludes: e.target.value
                  .split("\n")
                  .filter((line) => line.trim()),
              })
            }
            placeholder="Enter patterns to exclude (one per line)&#10;e.g., *.tmp&#10;temp/&#10;*.cache"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-gray-900 placeholder-gray-500 resize-none transition-colors"
          />
          <p className="text-xs text-gray-600 leading-relaxed">
            One pattern per line. Use * for wildcards, / for directories
          </p>
        </div>
      </div>

      {/* Framework-specific exclusions preview */}
      {framework && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            {framework.displayName} Default Exclusions
          </h4>
          <div className="text-xs text-gray-700 space-y-2">
            {framework.excludePatterns.slice(0, 8).map((pattern, index) => (
              <div
                key={index}
                className="font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800"
              >
                {pattern}
              </div>
            ))}
            {framework.excludePatterns.length > 8 && (
              <div className="text-gray-600 italic">
                ... and {framework.excludePatterns.length - 8} more patterns
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
