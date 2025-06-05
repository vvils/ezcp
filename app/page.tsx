"use client";

import React, { useState } from "react";
import { Code, Sparkles } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FrameworkSelector } from "@/components/FrameworkSelector";

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
  };

  const handleBack = () => {
    setSelectedLanguage(null);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Code className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-6 w-6 text-yellow-500 ml-2" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">ezcp</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Easy project context copier for developers. Smart framework
            detection and intelligent file filtering to generate clean,
            structured project contexts.
          </p>
        </div>

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
                  Python Frameworks
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
