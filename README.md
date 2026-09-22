<div align="center">

# 📦 CleanDrop

**Smart, safe, and lightning-fast downloads & desktop auto-organizer CLI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![CI Status](https://github.com/mahdyarmonfared/cleandrop/actions/workflows/ci.yml/badge.svg)](https://github.com/mahdyarmonfared/cleandrop/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com)


</div>

---

## 🧐 Why CleanDrop?

Is your `Downloads` or `Desktop` folder flooded with hundreds of unorganized screenshots, random PDFs, installation `.deb`/`.exe` packages, and zip files?

Cleaning it manually is tedious and time-consuming. **CleanDrop** reorganizes messy directories in seconds, safely placing files into categorized subfolders based on their extensions.

```
Messy Folder:                              CleanDrop Magic:
📁 Downloads/                              📁 Downloads/
 ├── invoice.pdf             ───────►       ├── 📁 Documents/ (invoice.pdf, notes.txt)
 ├── screenshot.png                         ├── 📁 Images/ (screenshot.png)
 ├── app.zip                                ├── 📁 Archives/ (app.zip)
 ├── script.js                              └── 📁 Code/ (script.js)
 └── notes.txt
```

---

## ✨ Features

- ⚡ **Lightning Fast:** Processes hundreds of files in milliseconds with zero memory bloat.
- 🛡️ **Dry-Run Mode (`-d`):** Preview exactly what will happen before touching a single file on disk.
- 🔄 **One-Click Undo (`-u`):** Made a mistake? CleanDrop remembers the last run and restores every file to its exact original location.
- 🔒 **Collision Safe:** Automatically detects naming conflicts and renames duplicates (e.g., `file (1).pdf`) instead of overwriting existing data.
- 🌐 **Visual Web Organizer (`--web`):** Drag-and-drop web dashboard with one-click messy demo generation, 100% client-side privacy (zero uploads), and categorized ZIP archive export.
- 🎨 **Beautiful Terminal UI:** Visual progress spinners, colorful categorization tables, and summary metrics.
- 🧪 **Zero External Bloat:** Built with native Node.js ES Modules and verified with `node:test`.

---

## 🚀 Quick Start

### Run Instantly via `npx` (No Install Required)

```bash
# Preview what would be organized in Downloads
npx cleandrop ~/Downloads --dry-run

# Organize Downloads folder
npx cleandrop ~/Downloads

# Launch the visual web dashboard
npx cleandrop --web
```

### Global Installation

```bash
# Clone the repository
git clone https://github.com/mahdyarmonfared/cleandrop.git
cd cleandrop

# Install dependencies
npm install

# Link executable globally
npm link
```

Now you can use `cleandrop` anywhere!

---

## 📖 Usage & Options

```bash
cleandrop [directory] [options]
```

### Options

| Flag | Shorthand | Description |
| :--- | :--- | :--- |
| `--dry-run` | `-d` | Preview changes without moving any files |
| `--undo` | `-u` | Undo the last organization run in this directory |
| `--verbose` | `-v` | Display each file movement in real-time |
| `--web [port]` | | Launch browser visual organizer locally (default: 3000) |
| `--help` | `-h` | Show help and options |
| `--version` | `-V` | Output version number |

### Examples

#### 1. Preview changes safely (Recommended first step):
```bash
cleandrop ~/Downloads --dry-run
```

#### 2. Clean up desktop with detailed output:
```bash
cleandrop ~/Desktop --verbose
```

#### 3. Revert everything back:
```bash
cleandrop ~/Downloads --undo
```

---

## 🗂️ Default Categories & Supported Formats

| Category | File Extensions |
| :--- | :--- |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.gif`, `.ico`, `.avif`, `.bmp`, `.tiff`, `.heic` |
| **Documents** | `.pdf`, `.doc`, `.docx`, `.txt`, `.rtf`, `.odt`, `.xls`, `.xlsx`, `.csv`, `.ppt`, `.pptx`, `.md` |
| **Archives** | `.zip`, `.rar`, `.tar`, `.gz`, `.7z`, `.bz2`, `.xz`, `.iso` |
| **Code** | `.js`, `.ts`, `.py`, `.html`, `.css`, `.json`, `.sql`, `.sh`, `.cpp`, `.java`, `.go`, `.rs` |
| **Audio** | `.mp3`, `.wav`, `.flac`, `.aac`, `.m4a`, `.ogg` |
| **Videos** | `.mp4`, `.mkv`, `.mov`, `.avi`, `.webm`, `.flv` |
| **Installers** | `.deb`, `.rpm`, `.AppImage`, `.exe`, `.msi`, `.dmg`, `.pkg`, `.apk` |
| **Others** | Any uncategorized extension |

---

## 🧪 Running Tests

CleanDrop uses Node's native test runner (`node:test`):

```bash
npm test
```

---

## 🤝 Contributing
 
Contributions, issues, and feature requests are welcome! Please check the [contributing guidelines](CONTRIBUTING.md) and [issues page](https://github.com/mahdyarmonfared/cleandrop/issues).

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
