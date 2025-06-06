"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-600 text-sm">
          Questions or feedback? Contact the developer at{" "}
          <a
            href="mailto:wilson@spotsocial.app"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            wilson@spotsocial.app
          </a>
        </p>
      </div>
    </footer>
  );
}
