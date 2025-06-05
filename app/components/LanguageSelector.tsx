"use client";

import React from "react";

interface Language {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

interface LanguageSelectorProps {
  onLanguageSelect: (languageId: string) => void;
}

const languages: Language[] = [
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    enabled: true,
    description: "Django, Flask, FastAPI and more",
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: "🟨",
    enabled: false,
    description: "React, Vue, Node.js and more",
  },
  {
    id: "java",
    name: "Java",
    icon: "☕",
    enabled: false,
    description: "Spring Boot, Maven projects",
  },
  {
    id: "csharp",
    name: "C#",
    icon: "🔷",
    enabled: false,
    description: ".NET, ASP.NET Core projects",
  },
  {
    id: "go",
    name: "Go",
    icon: "🔵",
    enabled: false,
    description: "Gin, Echo, standard library",
  },
  {
    id: "php",
    name: "PHP",
    icon: "🐘",
    enabled: false,
    description: "Laravel, Symfony, WordPress",
  },
];

export function LanguageSelector({ onLanguageSelect }: LanguageSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {languages.map((language) => (
        <div
          key={language.id}
          className={`relative bg-white rounded-xl border-2 p-6 transition-all duration-200 cursor-pointer ${
            language.enabled
              ? "border-gray-200 hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1"
              : "border-gray-100 opacity-60 cursor-not-allowed"
          }`}
          onClick={() => language.enabled && onLanguageSelect(language.id)}
        >
          {!language.enabled && (
            <div className="absolute top-3 right-3 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              Coming Soon
            </div>
          )}

          <div className="text-center">
            <div className="text-4xl mb-3">{language.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language.name}
            </h3>
            <p className="text-gray-600 text-sm">{language.description}</p>
          </div>

          {language.enabled && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Available
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
