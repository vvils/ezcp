"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Framework {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  status: "available" | "work-in-progress" | "coming-soon";
  description: string;
  route: string;
}

interface FrameworkSelectorProps {
  languageId: string;
}

const frameworksByLanguage: Record<string, Framework[]> = {
  python: [
    {
      id: "django",
      name: "Django",
      icon: "🎯",
      enabled: true,
      status: "available",
      description: "Full-featured web framework",
      route: "/python/django",
    },
    {
      id: "flask",
      name: "Flask",
      icon: "🌶️",
      enabled: false,
      status: "work-in-progress",
      description: "Lightweight web framework",
      route: "/python/flask",
    },
    {
      id: "fastapi",
      name: "FastAPI",
      icon: "⚡",
      enabled: false,
      status: "coming-soon",
      description: "Modern, fast web framework",
      route: "/python/fastapi",
    },
  ],
};

export function FrameworkSelector({ languageId }: FrameworkSelectorProps) {
  const router = useRouter();
  const frameworks = frameworksByLanguage[languageId] || [];

  const handleFrameworkSelect = (framework: Framework) => {
    if (framework.enabled) {
      router.push(framework.route);
    }
  };

  const getStatusBadge = (status: Framework["status"]) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        );
      case "work-in-progress":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Work in Progress
          </span>
        );
      case "coming-soon":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Coming Soon
          </span>
        );
    }
  };

  if (frameworks.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
        Choose a Framework
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frameworks.map((framework) => (
          <div
            key={framework.id}
            className={`relative bg-white rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
              framework.enabled
                ? "border-gray-200 hover:border-blue-300 hover:shadow-md transform hover:-translate-y-1"
                : "border-gray-100 opacity-60 cursor-not-allowed"
            }`}
            onClick={() => handleFrameworkSelect(framework)}
          >
            <div className="absolute top-3 right-3">
              {getStatusBadge(framework.status)}
            </div>

            <div className="text-center">
              <div className="text-2xl mb-2">{framework.icon}</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {framework.name}
              </h4>
              <p className="text-gray-600 text-sm">{framework.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
