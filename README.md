# ezcp - Universal Development Tool

A powerful web-based tool that streamlines sharing your entire codebase with AI assistants. Features smart framework detection, intelligent file filtering, and optimized output formatting for AI consumption.

![AI Context Copier](https://img.shields.io/badge/Framework-Next.js-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Features

### ✨ Smart Framework Detection

- **Automatic Detection**: Recognizes Django, Flask, and other frameworks from project structure
- **Manual Override**: Framework selection dropdown for edge cases
- **Extensible Architecture**: Easy to add new framework support

### 🎯 Intelligent File Filtering

- **Framework-Specific Exclusions**: Automatically excludes virtual environments, migrations, cache files
- **Priority-Based Selection**: High-priority files (models.py, settings.py) auto-selected
- **Custom Patterns**: Add your own exclude patterns
- **Size Limits**: Configurable maximum file size filtering

### 📁 Interactive Project Visualization

- **File Tree View**: Hierarchical display of your project structure
- **Visual Indicators**: File types, priorities, and Django apps clearly marked
- **Bulk Operations**: Select all/none with smart filtering options

### 🤖 AI-Optimized Output

- **Structured Format**: Clear project overview with file counts and structure
- **Framework Context**: Django apps, Flask blueprints properly organized
- **Copy-Ready**: One-click clipboard integration

## 🛠️ Currently Supported Frameworks

### 🎯 Django

- **Detection**: `manage.py` + `settings.py` presence
- **App Recognition**: Automatic Django app detection
- **Smart Exclusions**: Migrations, `__pycache__`, virtual environments, static files
- **Priority Files**: `models.py`, `views.py`, `settings.py`, `urls.py`
- **Output Format**: Grouped by Django apps with clear structure

### 🌶️ Flask

- **Detection**: `app.py`/`main.py` + Flask imports + `requirements.txt`
- **Smart Exclusions**: Virtual environments, cache files, instance folders
- **Priority Files**: `app.py`, `routes.py`, `models.py`, `config.py`
- **Output Format**: Grouped by file type (Python, templates, other)

## 🏗️ Architecture

### Extensible Framework System

Adding a new framework requires only:

```typescript
// 1. Create framework configuration
export const newFrameworkConfig: FrameworkConfig = {
  name: "framework-name",
  displayName: "Framework Name",
  icon: "🔥",
  detector: async (files: FileList) => {
    /* detection logic */
  },
  excludePatterns: ["pattern1/", "*.cache"],
  priorityFiles: ["important.file"],
  outputFormatter: (name, files, apps) => {
    /* formatting logic */
  },
};

// 2. Register in framework-registry.ts
import { newFrameworkConfig } from "./frameworks/new-framework";
export const frameworks = [djangoConfig, flaskConfig, newFrameworkConfig];
```

### Core Components

- **Framework Detection**: `app/lib/framework-registry.ts`
- **File Processing**: `app/lib/file-processor.ts`
- **UI Components**: `app/components/`
- **Type Definitions**: `app/types/framework.ts`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-context-copier

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. **Select Project Directory**: Click "Choose Directory" and select your project folder
2. **Framework Detection**: The tool automatically detects your framework
3. **Review Files**: Use the interactive file tree to select/deselect files
4. **Configure Options**: Adjust settings like including test files or custom exclusions
5. **Generate Output**: Click "Generate Output" to create AI-optimized text
6. **Copy to Clipboard**: One-click copy for pasting into AI assistants

## 📋 Example Output

```
=== DJANGO PROJECT: MyBlog ===
Framework: Django
Apps detected: blog, users, api
Selected files: 23
Total characters: 45,230

=== PROJECT STRUCTURE ===
myblog/
├── manage.py
├── requirements.txt
├── myblog/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── blog/
│   ├── models.py
│   ├── views.py
│   └── urls.py
└── users/
    ├── models.py
    └── views.py

=== FILE CONTENTS ===

--- /manage.py ---
#!/usr/bin/env python
import os
import sys
...

--- /myblog/settings.py ---
import os
from pathlib import Path
...
```

## 🔧 Configuration Options

### Processing Options

- **Include Test Files**: Toggle test file inclusion
- **Maximum File Size**: Set size limit (default: 1MB)
- **Custom Exclusions**: Add project-specific patterns

### Framework-Specific Settings

Each framework has optimized defaults:

- **Django**: Excludes migrations, media uploads, collected static
- **Flask**: Excludes instance folder, cache directories
- **General**: Excludes `.git/`, `node_modules/`, virtual environments

## 🛣️ Roadmap

### Planned Framework Support

- **React/Next.js**: Component-based project structure
- **Laravel**: PHP framework with Artisan detection
- **Spring Boot**: Java enterprise applications
- **Ruby on Rails**: Convention-over-configuration framework
- **Express.js**: Node.js web framework

### Upcoming Features

- **Project Templates**: Save and reuse configuration profiles
- **Export Options**: JSON, markdown, or custom formats
- **Integration APIs**: Direct integration with popular AI services
- **Collaborative Features**: Share project configurations

## 🤝 Contributing

We welcome contributions! Here's how to add a new framework:

1. **Create Framework Config**: Add to `app/lib/frameworks/`
2. **Implement Detection Logic**: File patterns, imports, or structure
3. **Define Exclusion Patterns**: Framework-specific ignores
4. **Create Output Formatter**: Organize files for AI consumption
5. **Register Framework**: Add to `framework-registry.ts`
6. **Test**: Verify detection and output quality

### Development Guidelines

- Use TypeScript for type safety
- Follow existing patterns for consistency
- Add comprehensive exclusion patterns
- Optimize for AI readability in output formatters

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)
- Inspired by the need for better AI-developer workflows

---

**Made with ❤️ for the developer community**

_Streamline your AI interactions, focus on building amazing things._
