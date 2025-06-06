"use client";

import React, { useState } from "react";
import { Code, Sparkles } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FrameworkSelector } from "@/components/FrameworkSelector";
import { QuickStart } from "@/components/QuickStart";

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(true);

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
    setShowQuickStart(false);
  };

  const handleBack = () => {
    setSelectedLanguage(null);
    setShowQuickStart(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Code className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-6 w-6 text-yellow-500 ml-2" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ezcp - Universal Development Tool
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Easy project context copier for developers. Smart framework
            detection and intelligent file filtering to generate clean,
            structured project contexts.
          </p>
        </div>

        {/* Quick Start Section */}
        {showQuickStart && !selectedLanguage && (
          <div className="mb-16">
            <QuickStart />

            {/* Divider */}
            <div className="flex items-center my-12">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-4 text-gray-500 font-medium">OR</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        )}

        {/* Language/Framework Selection */}
        <div className="max-w-6xl mx-auto">
          {!selectedLanguage ? (
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
                Choose Your Programming Language
              </h2>
              <LanguageSelector onLanguageSelect={handleLanguageSelect} />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center mb-6">
                <button
                  onClick={handleBack}
                  className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Back to Languages
                </button>
                <h2 className="text-3xl font-semibold text-gray-900">
                  {selectedLanguage === "python"
                    ? "Python"
                    : selectedLanguage === "javascript"
                    ? "JavaScript/TypeScript"
                    : selectedLanguage}{" "}
                  Frameworks
                </h2>
              </div>
              <FrameworkSelector languageId={selectedLanguage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
