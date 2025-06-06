"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FrameworkConfig, ProjectFile } from "@/types/framework";
import { FrameworkDetectionResult } from "@/lib/quick-start-detector";

interface AppState {
  // File management
  uploadedFiles: FileList | null;
  processedFiles: ProjectFile[];

  // Framework detection
  detectionResult: FrameworkDetectionResult | null;
  selectedFramework: FrameworkConfig | null;

  // Project metadata
  projectName: string;
  apps: string[];

  // Navigation state
  isAutoDetectionComplete: boolean;
  shouldSkipManualSelection: boolean;
}

interface AppContextType {
  state: AppState;
  setUploadedFiles: (files: FileList | null) => void;
  setProcessedFiles: (files: ProjectFile[]) => void;
  setDetectionResult: (result: FrameworkDetectionResult | null) => void;
  setSelectedFramework: (framework: FrameworkConfig | null) => void;
  setProjectName: (name: string) => void;
  setApps: (apps: string[]) => void;
  setAutoDetectionComplete: (complete: boolean) => void;
  setShouldSkipManualSelection: (skip: boolean) => void;
  resetState: () => void;
}

const initialState: AppState = {
  uploadedFiles: null,
  processedFiles: [],
  detectionResult: null,
  selectedFramework: null,
  projectName: "",
  apps: [],
  isAutoDetectionComplete: false,
  shouldSkipManualSelection: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setUploadedFiles = (files: FileList | null) => {
    setState((prev) => ({ ...prev, uploadedFiles: files }));
  };

  const setProcessedFiles = (files: ProjectFile[]) => {
    setState((prev) => ({ ...prev, processedFiles: files }));
  };

  const setDetectionResult = (result: FrameworkDetectionResult | null) => {
    setState((prev) => ({ ...prev, detectionResult: result }));
  };

  const setSelectedFramework = (framework: FrameworkConfig | null) => {
    setState((prev) => ({ ...prev, selectedFramework: framework }));
  };

  const setProjectName = (name: string) => {
    setState((prev) => ({ ...prev, projectName: name }));
  };

  const setApps = (apps: string[]) => {
    setState((prev) => ({ ...prev, apps }));
  };

  const setAutoDetectionComplete = (complete: boolean) => {
    setState((prev) => ({ ...prev, isAutoDetectionComplete: complete }));
  };

  const setShouldSkipManualSelection = (skip: boolean) => {
    setState((prev) => ({ ...prev, shouldSkipManualSelection: skip }));
  };

  const resetState = () => {
    setState(initialState);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setUploadedFiles,
        setProcessedFiles,
        setDetectionResult,
        setSelectedFramework,
        setProjectName,
        setApps,
        setAutoDetectionComplete,
        setShouldSkipManualSelection,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
