import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { IGNORED_NAMES, IGNORED_EXTENSIONS, CATEGORIES, DEFAULT_OTHER_FOLDER } from './config.js';
import { getCategoryForExtension, getUniqueDestinationPath } from './utils.js';
import { saveHistory } from './history.js';

/**
 * Scan and organize files in target directory into categorized subdirectories
 */
export async function organizeDirectory(targetDir, options = {}) {
  const { dryRun = false, verbose = false } = options;

  // Resolve absolute path
  const absoluteTarget = path.resolve(targetDir);

  // Validate directory existence
  const stat = await fs.stat(absoluteTarget);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${absoluteTarget}`);
  }

  const entries = await fs.readdir(absoluteTarget, { withFileTypes: true });
  const categoryNames = new Set([...Object.keys(CATEGORIES), DEFAULT_OTHER_FOLDER]);

  const preservedFolders = [];
  for (const entry of entries) {
    if (entry.isDirectory() && !categoryNames.has(entry.name) && !entry.name.startsWith('.')) {
      preservedFolders.push(entry.name);
    }
  }

  const moves = [];
  let totalBytes = 0;

  for (const entry of entries) {
    // Only process loose files in the top-level of targetDir
    if (!entry.isFile()) continue;

    const fileName = entry.name;
    const ext = path.extname(fileName).toLowerCase();

    // Skip hidden files, ignored names, and active in-progress downloads (.crdownload, .part)
    if (fileName.startsWith('.') || IGNORED_NAMES.has(fileName) || IGNORED_EXTENSIONS.has(ext)) {
      continue;
    }

    const sourcePath = path.join(absoluteTarget, fileName);
    const category = getCategoryForExtension(ext);
    const categoryDir = path.join(absoluteTarget, category);

    try {
      // Get file size
      const fileStat = await fs.stat(sourcePath);

      // Calculate destination path (safely handling duplicate names)
      let destPath;
      if (dryRun) {
        destPath = path.join(categoryDir, fileName);
      } else {
        await fs.mkdir(categoryDir, { recursive: true });
        destPath = await getUniqueDestinationPath(categoryDir, fileName);
        await fs.rename(sourcePath, destPath);
      }

      totalBytes += fileStat.size;
      moves.push({
        name: fileName,
        source: sourcePath,
        destination: destPath,
        category,
        size: fileStat.size
      });

      if (verbose) {
        console.log(`  ${chalk.cyan('→')} ${chalk.white(fileName)} ${chalk.gray('➜')} ${chalk.green(category + '/' + path.basename(destPath))}`);
      }
    } catch (err) {
      console.warn(chalk.yellow(`  Warning: Could not process ${fileName} (${err.code || err.message}). Skipping.`));
    }
  }

  if (!dryRun && moves.length > 0) {
    await saveHistory(absoluteTarget, moves);
  }

  return {
    targetDir: absoluteTarget,
    moves,
    totalBytes,
    dryRun,
    preservedFolders
  };
}
