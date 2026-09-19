# Contributing to CleanDrop 🤝

Thank you for your interest in contributing to **CleanDrop**! We welcome all kinds of contributions: bug reports, feature suggestions, documentation improvements, and pull requests.

---

## 🛠️ Local Development Setup

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/mahdyarmonfared/cleandrop.git
   cd cleandrop
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run the Test Suite:**
   ```bash
   npm test
   ```

---

## 🚀 Submitting Changes

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/your-awesome-feature
   ```

2. **Commit with Conventional Messages:**
   - `feat: add support for .webp and .avif categorization`
   - `fix: prevent crash when folder is write-protected`
   - `docs: improve CLI help documentation`

3. **Ensure Tests Pass:**
   Always run `npm test` before pushing to verify your changes did not break existing functionality.

4. **Open a Pull Request:**
   Push your branch to GitHub and submit a PR to the `main` branch.

---

## 💡 Ideas for Contribution

- Adding custom user configuration via a `.cleandroprc` file.
- Adding date-based subfolders (e.g. `Images/2026-09/`).
- Adding notification support upon completion.

Happy coding! 🎉
